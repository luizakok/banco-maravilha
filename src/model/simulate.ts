import paramsJson from "./params.json";
import type { Alavanca, CampoNum, Decisao, EfeitoPendente, Estado, Explicacao, ResultadoTurno } from "./types";
import type { Rng } from "./rng";

type No = { valor: number; fonte: string } | { [k: string]: No };

/** Lê um coeficiente de params.json por caminho, ex.: p("ia.autoLag"). */
export function p(caminho: string): number {
  let no: No = paramsJson as unknown as No;
  for (const parte of caminho.split(".")) {
    no = (no as Record<string, No>)[parte];
    if (no === undefined) throw new Error(`Parâmetro não encontrado: ${caminho}`);
  }
  return (no as { valor: number }).valor;
}

export function fonte(caminho: string): string {
  let no: No = paramsJson as unknown as No;
  for (const parte of caminho.split(".")) no = (no as Record<string, No>)[parte];
  return (no as { fonte: string }).fonte;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function estadoInicial(): Estado {
  const e: Estado = {
    turno: 0,
    engajamento: p("inicial.engajamento"),
    turnover: p("inicial.turnover"),
    prontidao: p("inicial.prontidao"),
    custoPessoal: p("inicial.custoPessoal"),
    receita: p("inicial.receita"),
    nps: p("inicial.nps"),
    risco: p("inicial.risco") as 0 | 1 | 2,
    eficiencia: 0,
    pendentes: [],
    hibridoAtivo: false,
    hibridoComGPR: false,
    familiasAutomatizadas: 0,
    familiasComCopiloto: 0,
    turnosSemLD: 0,
    turnosDesdeContratacaoExterna: 99,
    turnosRiscoSaudavel: 0,
    automatizouSemLD: false,
    analyticsAcumulado: 0,
    dividaAtiva: false,
    turnosSaudaveisDivida: 0,
    apostadorMarcado: false,
  };
  e.eficiencia = eficienciaDe(e);
  return e;
}

function eficienciaDe(e: Estado): number {
  return (p("encadeamento.eficienciaBase") * e.custoPessoal) / e.receita;
}

function moedas(d: Decisao, a: Alavanca): number {
  return Math.max(0, d.alocacao[a] ?? 0);
}

interface Ctx {
  e: Estado;
  exps: Explicacao[];
}

function aplicar(ctx: Ctx, campo: CampoNum, delta: number, motivo: string, percentual = false) {
  if (delta === 0) return;
  const real = percentual ? (ctx.e[campo] * delta) / 100 : delta;
  ctx.e[campo] += real;
  ctx.exps.push({ campo, delta: real, motivo });
}

function agendar(ctx: Ctx, lag: number, campo: CampoNum, delta: number, motivo: string, percentual = false) {
  if (delta === 0) return;
  if (lag <= 0) {
    aplicar(ctx, campo, delta, motivo, percentual);
    return;
  }
  ctx.e.pendentes.push({ turnosRestantes: lag, campo, delta, percentual, motivo });
}

/**
 * Simula um turno. Função pura: clona o estado de entrada.
 * `chefao=true` aplica o chefão do turno (modo Tradicional).
 */
export function simularTurno(entrada: Estado, d: Decisao, rng: Rng, chefao = true): ResultadoTurno {
  const e: Estado = structuredClone(entrada);
  e.turno += 1;
  const exps: Explicacao[] = [];
  const ctx: Ctx = { e, exps };

  // 1) Efeitos pendentes que vencem neste turno
  const restantes: EfeitoPendente[] = [];
  for (const ef of e.pendentes) {
    ef.turnosRestantes -= 1;
    if (ef.turnosRestantes <= 0) aplicar(ctx, ef.campo, ef.delta, ef.motivo, ef.percentual);
    else restantes.push(ef);
  }
  e.pendentes = restantes;

  // 2) Decisões do turno
  const mLD = moedas(d, "ld_cargo") + moedas(d, "ld_realocar");
  const investiuLD = mLD > 0;

  // Capacidade de mudança
  const iniciativas = (Object.keys(d.alocacao) as Alavanca[]).filter(
    (a) => a !== "analytics" && moedas(d, a) > 0
  ).length;
  const excesso = Math.max(0, iniciativas - p("capacidade.maxIniciativas"));
  if (excesso > 0)
    aplicar(ctx, "engajamento", excesso * p("capacidade.penalidadeEngajamentoPorExcesso"), "capacidade.excesso");

  // Contratar fora
  const mC = moedas(d, "contratar");
  if (mC > 0) {
    const total = mC * p("contratar.prontidaoPorMoeda");
    const fi = p("contratar.fracaoImediata");
    aplicar(ctx, "prontidao", total * fi, "contratar.imediato");
    agendar(ctx, p("contratar.lagRestante"), "prontidao", total * (1 - fi), "contratar.rampa");
    aplicar(ctx, "custoPessoal", mC * p("contratar.custoPorMoeda"), "contratar.premioSalarial", true);
    const toExtra = mC * p("contratar.turnoverPorMoeda");
    aplicar(ctx, "turnover", toExtra, "contratar.turnoverExterno");
    agendar(ctx, p("contratar.duracaoTurnoverExtra"), "turnover", -toExtra, "contratar.turnoverExternoFim");
    e.turnosDesdeContratacaoExterna = 0;
  } else if (e.turnosDesdeContratacaoExterna < 99) {
    e.turnosDesdeContratacaoExterna += 1;
  }

  // Promover/mover interno
  const mI = moedas(d, "interno");
  if (mI > 0) {
    agendar(ctx, p("interno.lag"), "prontidao", mI * p("interno.prontidaoPorMoeda"), "interno.prontidao");
    aplicar(ctx, "engajamento", mI * p("interno.engajamentoPorMoeda"), "interno.engajamento");
  }

  // L&D
  if (investiuLD) {
    const mCargo = moedas(d, "ld_cargo");
    const mReal = moedas(d, "ld_realocar");
    agendar(ctx, p("ld.cargoLag"), "prontidao", mCargo * p("ld.cargoProntidaoPorMoeda"), "ld.cargo");
    agendar(ctx, p("ld.realocarLag"), "prontidao", mReal * p("ld.realocarProntidaoPorMoeda"), "ld.realocar");
    aplicar(ctx, "receita", mLD * p("ld.receitaImediataPorMoeda"), "ld.horasTreinamento", true);
    agendar(ctx, p("ld.engajamentoLag"), "engajamento", mLD * p("ld.engajamentoPorMoeda"), "ld.engajamento");
    e.turnosSemLD = 0;
  } else {
    e.turnosSemLD += 1;
    if (e.turnosSemLD >= 2) aplicar(ctx, "prontidao", p("ld.decaimentoSemLD"), "ld.decaimento");
  }

  // IA: automatizar
  const mAuto = moedas(d, "ia_auto");
  if (mAuto > 0) {
    const novasFamilias = Math.min(
      Math.floor(mAuto / p("ia.moedasPorFamiliaAuto")),
      p("ia.totalFamilias") - e.familiasAutomatizadas
    );
    e.familiasAutomatizadas += novasFamilias;
    agendar(ctx, p("ia.autoLag"), "custoPessoal", novasFamilias * p("ia.autoCustoPorFamilia"), "ia.automacaoCusto", true);
    if (novasFamilias > 0) {
      const aten = investiuLD ? p("ia.autoComLDAtenuacao") : 1;
      if (!investiuLD) e.automatizouSemLD = true;
      aplicar(ctx, "engajamento", novasFamilias * p("ia.autoSemLDEngajamentoPorFamilia") * aten, "ia.autoEngajamento");
      agendar(ctx, p("ia.autoLag"), "turnover", p("ia.autoSemLDTurnover") * aten, "ia.autoTurnover");
      aplicar(ctx, "prontidao", p("ia.autoSemLDProntidao") * aten, "ia.autoPerdaConhecimento");
      if (!investiuLD) e.risco = clamp(e.risco + p("ia.autoSemLDRisco"), 0, 2) as 0 | 1 | 2;
    }
  }

  // IA: copiloto (licença por família, por turno)
  const mCop = moedas(d, "ia_copiloto");
  const familiasCopAntes = e.familiasComCopiloto;
  e.familiasComCopiloto = Math.min(mCop, p("ia.totalFamilias"));
  if (e.familiasComCopiloto > 0) {
    const treinado = e.turnosSemLD < p("ia.janelaLDCopiloto");
    const aten = treinado ? 1 : p("ia.copilotoSemLDAtenuacao");
    const novato =
      e.turnosDesdeContratacaoExterna <= p("contratar.lagRestante") ? p("ia.copilotoBonusNovatos") : 1;
    agendar(
      ctx,
      p("ia.copilotoLag"),
      "receita",
      e.familiasComCopiloto * p("ia.copilotoReceitaPorFamiliaTurno") * aten * novato,
      "ia.copilotoProdutividade",
      true
    );
    const familiasNovas = Math.max(0, e.familiasComCopiloto - familiasCopAntes);
    if (familiasNovas > 0)
      agendar(
        ctx,
        p("ia.copilotoTurnoverLag"),
        "turnover",
        familiasNovas * p("ia.copilotoTurnoverPorFamilia") * aten,
        "ia.copilotoRetencao"
      );
  }

  // Futuro do trabalho: híbrido (ativação única)
  const mHib = moedas(d, "hibrido");
  if (mHib > 0 && !e.hibridoAtivo) {
    e.hibridoAtivo = true;
    e.hibridoComGPR = d.gestaoPorResultados === true && mHib >= p("futuroTrabalho.hibridoCustoComGPR");
    const aten = e.hibridoComGPR ? 1 : p("futuroTrabalho.hibridoSemGPRAtenuacao");
    agendar(
      ctx,
      p("futuroTrabalho.hibridoLag"),
      "turnover",
      e.turnover * p("futuroTrabalho.hibridoTurnoverRelativo") * aten,
      "hibrido.turnover"
    );
  }
  if (e.hibridoAtivo && !e.hibridoComGPR)
    aplicar(ctx, "engajamento", p("futuroTrabalho.hibridoSemGPREngajamentoPorTurno"), "hibrido.semGPR");

  // Flex (borrow)
  const mFlex = moedas(d, "flex");
  if (mFlex > 0) {
    const ganho = mFlex * p("futuroTrabalho.flexProntidaoPorMoeda");
    aplicar(ctx, "prontidao", ganho, "flex.prontidao");
    aplicar(ctx, "custoPessoal", mFlex * p("futuroTrabalho.flexCustoPorMoeda"), "flex.custo", true);
    agendar(
      ctx,
      p("futuroTrabalho.flexReverteLag"),
      "prontidao",
      -ganho * p("futuroTrabalho.flexReverteFracao"),
      "flex.fimContrato"
    );
  }

  // Analytics (efeito de informação na UI; aqui só o acúmulo que mitiga a Auditoria)
  e.analyticsAcumulado += moedas(d, "analytics");

  // 3) Pressão competitiva
  aplicar(ctx, "receita", p("pressao.receitaPorTurno"), "pressao.receita", true);
  aplicar(ctx, "nps", p("pressao.npsPorTurno"), "pressao.nps");

  // 4) Encadeamento pessoas -> negócio (agendado com lag; nunca direto)
  agendar(
    ctx,
    p("encadeamento.engajamentoParaReceitaLag"),
    "receita",
    (e.engajamento - p("inicial.engajamento")) * p("encadeamento.engajamentoParaReceita"),
    "encadeamento.engajamentoReceita",
    true
  );
  agendar(
    ctx,
    p("encadeamento.engajamentoParaNpsLag"),
    "nps",
    (e.engajamento - p("inicial.engajamento")) * p("encadeamento.engajamentoParaNps"),
    "encadeamento.engajamentoNps"
  );
  agendar(
    ctx,
    p("encadeamento.prontidaoParaReceitaLag"),
    "receita",
    (e.prontidao - p("inicial.prontidao")) * p("encadeamento.prontidaoParaReceita"),
    "encadeamento.prontidaoReceita",
    true
  );
  const toAcima = Math.max(0, e.turnover - p("encadeamento.turnoverBase"));
  aplicar(ctx, "custoPessoal", toAcima * p("encadeamento.turnoverParaCusto"), "encadeamento.custoReposicao", true);
  if (e.turnover > p("encadeamento.turnoverAltoLimiar"))
    aplicar(ctx, "prontidao", p("encadeamento.turnoverAltoProntidao"), "encadeamento.perdaConhecimento");

  // Risco: piora com prontidão baixa, melhora com saúde sustentada
  if (e.prontidao < p("encadeamento.prontidaoBaixaLimiarRisco")) {
    e.risco = clamp(e.risco + 1, 0, 2) as 0 | 1 | 2;
    e.turnosRiscoSaudavel = 0;
  } else if (
    e.prontidao > p("encadeamento.prontidaoLimiarMelhorarRisco") &&
    e.turnover < p("encadeamento.turnoverAltoLimiar") &&
    !e.automatizouSemLD
  ) {
    e.turnosRiscoSaudavel += 1;
    if (e.turnosRiscoSaudavel >= p("encadeamento.turnosParaMelhorarRisco")) {
      e.risco = clamp(e.risco - 1, 0, 2) as 0 | 1 | 2;
      e.turnosRiscoSaudavel = 0;
    }
  } else {
    e.turnosRiscoSaudavel = 0;
  }
  e.automatizouSemLD = false; // flag vale por turno

  // 5) Dívida de pessoas
  const abaixo =
    e.engajamento < p("divida.gatilhoEngajamento") || e.prontidao < p("divida.gatilhoProntidao");
  if (abaixo) {
    e.dividaAtiva = true;
    e.turnosSaudaveisDivida = 0;
  } else if (e.dividaAtiva) {
    e.turnosSaudaveisDivida += 1;
    if (e.turnosSaudaveisDivida >= p("divida.turnosParaSanar")) {
      e.dividaAtiva = false;
      e.turnosSaudaveisDivida = 0;
    }
  }
  if (e.dividaAtiva) {
    aplicar(ctx, "receita", p("divida.jurosReceitaPorTurno"), "divida.jurosReceita", true);
    aplicar(ctx, "turnover", p("divida.jurosTurnoverPorTurno"), "divida.jurosTurnover");
  }

  // 6) Chefões (Tradicional)
  if (chefao) aplicarChefao(ctx);

  // 7) Limites e derivados
  e.engajamento = clamp(e.engajamento, 0, 100);
  e.prontidao = clamp(e.prontidao, 0, 100);
  e.turnover = clamp(e.turnover, 2, 40);
  e.receita = Math.max(20, e.receita);
  e.custoPessoal = Math.max(20, e.custoPessoal);
  e.nps = clamp(e.nps, -100, 100);
  e.eficiencia = eficienciaDe(e);

  // marca do Apostador
  if (
    e.familiasAutomatizadas >= p("placar.apostadorFamilias") &&
    e.prontidao < p("placar.apostadorProntidao")
  )
    e.apostadorMarcado = true;

  // rng reservado para eventos menores (Fase 3); mantém a assinatura determinística
  void rng;

  return { estado: e, explicacoes: exps };
}

function aplicarChefao(ctx: Ctx) {
  const { e } = ctx;
  const mult =
    e.prontidao < p("ld.limiarProntidaoChefao") ? p("ld.multiplicadorDanoChefao") : 1;

  if (e.turno === p("chefoes.ondaIA.turno")) {
    const mitigado =
      e.familiasComCopiloto + e.familiasAutomatizadas >= p("chefoes.ondaIA.familiasParaMitigar");
    if (mitigado) {
      aplicar(ctx, "nps", p("chefoes.ondaIA.npsComMitigacao") * mult, "chefao.ondaIA.mitigado");
    } else {
      aplicar(ctx, "nps", p("chefoes.ondaIA.npsSemMitigacao") * mult, "chefao.ondaIA.nps");
      aplicar(ctx, "receita", p("chefoes.ondaIA.receitaSemMitigacao") * mult, "chefao.ondaIA.receita", true);
    }
  }

  if (e.turno === p("chefoes.cacaTalentos.turno")) {
    const mitigado =
      e.hibridoAtivo ||
      e.familiasComCopiloto > 0 ||
      e.engajamento >= p("chefoes.cacaTalentos.engajamentoParaMitigar");
    if (mitigado) {
      aplicar(ctx, "prontidao", p("chefoes.cacaTalentos.prontidaoComMitigacao") * mult, "chefao.cacaTalentos.mitigado");
    } else {
      aplicar(ctx, "prontidao", p("chefoes.cacaTalentos.prontidaoSemMitigacao") * mult, "chefao.cacaTalentos.prontidao");
      aplicar(ctx, "turnover", p("chefoes.cacaTalentos.turnoverSemMitigacao") * mult, "chefao.cacaTalentos.turnover");
    }
  }

  if (e.turno === p("chefoes.auditoria.turno")) {
    let nivel = e.risco;
    if (e.analyticsAcumulado >= p("analytics.limiarMitigaAuditoria")) nivel = clamp(nivel - 1, 0, 2) as 0 | 1 | 2;
    if (nivel === 2) {
      aplicar(ctx, "receita", p("chefoes.auditoria.receitaRiscoAlto") * mult, "chefao.auditoria.receita", true);
      aplicar(ctx, "custoPessoal", p("chefoes.auditoria.custoRiscoAlto") * mult, "chefao.auditoria.custo", true);
    } else if (nivel === 1) {
      aplicar(ctx, "receita", p("chefoes.auditoria.receitaRiscoMedio") * mult, "chefao.auditoria.receita", true);
    }
  }
}
