import eventosJson from "../content/events.json";
import type { RespostaChefao } from "./chefoes";
import { copilotosDaDecisao, opcaoPorId, type Escolhas } from "./gaps";
import { placarMetas, type MetaId, type PlacarMetas } from "./metas";
import type { Reacao } from "./reacoes";
import type { CampoNum, Decisao, Estado, Explicacao } from "../model/types";
import { criarRng, type Rng } from "../model/rng";
import { estadoInicial, p, simularTurno } from "../model/simulate";
import { classificarFinal, notasPorHorizonte, valorDoBanco } from "../model/scoring";

export interface EfeitoEvento {
  campo?: CampoNum;
  delta?: number;
  percentual?: boolean;
  riscoDelta?: number;
  analyticsDelta?: number;
}
export interface OpcaoEvento {
  efeitos: EfeitoEvento[];
  orcamentoDelta?: number;
}
export interface EventoDef {
  id: string;
  /** quem traz o assunto: o evento chega pela boca de alguém, não de um narrador */
  conselheiro: string;
  opcoes: OpcaoEvento[];
}

export const EVENTOS = (eventosJson as { eventos: EventoDef[] }).eventos;
export const TURNOS_CHEFAO = [3, 5, 7];
export const TOTAL_TURNOS = 8;

export type CampoNevoa = "engajamento" | "turnover" | "prontidao";
export const CAMPOS_NEVOA: CampoNevoa[] = ["engajamento", "turnover", "prontidao"];

export interface InsightEnganoso {
  turno: number;
  campo: string;
  mostrado: number;
  real: number;
}

export interface EscolhaEvento {
  turno: number;
  eventoId: string;
  opcao: 0 | 1;
}

export interface EscolhaChefao {
  turno: number;
  chefaoId: string;
  respostaId: string;
}

export interface Compromisso {
  /** moedas que voltam a ser cobradas todo semestre */
  moedas: number;
  /** 999 = permanente (folha) */
  turnosRestantes: number;
  rotulo: string;
}

export interface PartidaTrad {
  seed: number;
  /** as três metas de 2030 que a CEO pediu e o jogador escolheu */
  metas: MetaId[];
  rngTurno: Rng;
  rngIntel: Rng;
  estado: Estado;
  historico: Estado[];
  explicacoesPorTurno: Explicacao[][];
  decisoes: Decisao[];
  escolhasPorTurno: Escolhas[];
  eventosEscolhidos: EscolhaEvento[];
  respostasChefao: EscolhaChefao[];
  agendaEventos: Map<number, EventoDef>;
  /** orçamento disponível para o turno em curso */
  orcamento: number;
  /** delta de orçamento acumulado para o próximo turno (eventos/intel) */
  orcamentoDeltaProximo: number;
  /** custos recorrentes já assumidos (assinaturas, folha, contratos) */
  compromissos: Compromisso[];
  /** famílias com licença de copiloto que seguem ativas */
  copilotosAtivos: number;
  reveladas: Record<CampoNevoa, number>;
  insightsEnganosos: InsightEnganoso[];
  /** piloto contratado neste semestre; o resultado medido aparece no próximo */
  pilotoPendente: boolean;
  pilotoResultado: number | null;
  /** quem comentou cada semestre (null = ninguém tinha o que dizer) */
  reacoesPorTurno: (Reacao | null)[];
}

function montarAgenda(seed: number): Map<number, EventoDef> {
  const rng = criarRng((seed ^ 0x9e3779b9) >>> 0);
  const ordem = [...EVENTOS];
  for (let i = ordem.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  const agenda = new Map<number, EventoDef>();
  const turnosSemChefao = Array.from({ length: TOTAL_TURNOS }, (_, i) => i + 1).filter(
    (t) => !TURNOS_CHEFAO.includes(t)
  );
  turnosSemChefao.forEach((t, i) => agenda.set(t, ordem[i % ordem.length]));
  return agenda;
}

export function novaPartidaTrad(seed = Date.now() >>> 0, metas: MetaId[] = []): PartidaTrad {
  const e = estadoInicial();
  return {
    seed,
    metas,
    rngTurno: criarRng(seed),
    rngIntel: criarRng((seed ^ 0x55555555) >>> 0),
    estado: e,
    historico: [e],
    explicacoesPorTurno: [],
    decisoes: [],
    escolhasPorTurno: [],
    eventosEscolhidos: [],
    respostasChefao: [],
    agendaEventos: montarAgenda(seed),
    orcamento: p("orcamentoPorTurno"),
    orcamentoDeltaProximo: 0,
    compromissos: [],
    copilotosAtivos: 0,
    reveladas: { engajamento: 0, turnover: 0, prontidao: 0 },
    insightsEnganosos: [],
    pilotoPendente: false,
    pilotoResultado: null,
    reacoesPorTurno: [],
  };
}

/** Soma dos custos recorrentes, limitada pelo teto para o orçamento nunca travar. */
export function recorrenteAtivo(part: PartidaTrad): number {
  const soma = part.compromissos.reduce((s, c) => s + c.moedas, 0);
  return Math.min(soma, p("economia.tetoRecorrente"));
}

/** Registra as escolhas do semestre: compromissos recorrentes e licenças de copiloto. */
export function registrarEscolhas(part: PartidaTrad, esc: Escolhas) {
  part.escolhasPorTurno.push(esc);
  for (const id of Object.values(esc.porGap)) {
    const o = opcaoPorId(id);
    if (!o || o.recorrente <= 0) continue;
    part.compromissos.push({
      moedas: o.recorrente,
      turnosRestantes: o.abordagem === "borrow" ? p("economia.duracaoRecorrenteBorrow") + 1 : 999,
      rotulo: o.id,
    });
  }
  part.copilotosAtivos += copilotosDaDecisao(esc);
}

export function turnoAtual(part: PartidaTrad): number {
  return part.estado.turno + 1;
}

export function ehTurnoChefao(part: PartidaTrad): boolean {
  return TURNOS_CHEFAO.includes(turnoAtual(part));
}

/** Toda compra de inteligência vira base de evidência: estreita a previsão e ajuda na Auditoria. */
function acumularAnalytics(part: PartidaTrad) {
  part.estado = { ...part.estado, analyticsAcumulado: part.estado.analyticsAcumulado + 1 };
}

/** Compra de inteligência. Devolve o valor a exibir (pode ser enganoso) ou null se não há saldo. */
export function revelarIndicador(part: PartidaTrad, campo: CampoNevoa): number | null {
  const custo = p("analytics.custoRevelarIndicador");
  if (part.orcamento < custo) return null;
  part.orcamento -= custo;
  part.reveladas[campo] = 2;
  acumularAnalytics(part);
  const real = part.estado[campo];
  if (part.rngIntel() < p("analytics.chanceInsightEnganoso")) {
    const distorcao = 1 + (part.rngIntel() < 0.5 ? -0.15 : 0.15);
    const mostrado = Math.round(real * distorcao * 10) / 10;
    part.insightsEnganosos.push({ turno: turnoAtual(part), campo, mostrado, real: Math.round(real * 10) / 10 });
    return mostrado;
  }
  return Math.round(real * 10) / 10;
}

export function preverTurnover(part: PartidaTrad): number | null {
  const custo = p("analytics.custoPrevisaoTurnover");
  if (part.orcamento < custo) return null;
  part.orcamento -= custo;
  acumularAnalytics(part);
  // projeção: um turno sem decisões, sem chefão (não altera a partida)
  const proj = simularTurno(part.estado, { alocacao: {} }, criarRng(1), false).estado;
  const real = Math.round(proj.turnover * 10) / 10;
  if (part.rngIntel() < p("analytics.chanceInsightEnganoso")) {
    const mostrado = Math.round(real * (part.rngIntel() < 0.5 ? 0.85 : 1.15) * 10) / 10;
    part.insightsEnganosos.push({ turno: turnoAtual(part), campo: "turnover", mostrado, real });
    return mostrado;
  }
  return real;
}

export function rodarPiloto(part: PartidaTrad): boolean {
  const custo = p("analytics.custoPiloto");
  if (part.orcamento < custo || part.pilotoPendente) return false;
  part.orcamento -= custo;
  acumularAnalytics(part);
  part.pilotoPendente = true;
  return true;
}

/**
 * Efeito medido do copiloto em 1 família, no banco de verdade, sem chefão.
 * É o número que o piloto do semestre anterior entrega antes de escalar.
 */
function medirPiloto(e: Estado): number {
  const base = simularTurno(e, { alocacao: {} }, criarRng(7), false).estado;
  const com = simularTurno(e, { alocacao: { ia_copiloto: 1 } }, criarRng(7), false).estado;
  return Math.round((com.receita - base.receita) * 100) / 100;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Aplica uma lista de efeitos fora do turno simulado (eventos menores e
 * respostas a chefão) e refaz os limites e a eficiência.
 */
function aplicarEfeitos(e: Estado, efeitos: EfeitoEvento[], motivo: string, exps: Explicacao[]): Estado {
  const novo = structuredClone(e);
  for (const ef of efeitos) {
    if (ef.campo && ef.delta !== undefined) {
      const real = ef.percentual ? (novo[ef.campo] * ef.delta) / 100 : ef.delta;
      novo[ef.campo] += real;
      exps.push({ campo: ef.campo, delta: real, motivo });
    }
    if (ef.riscoDelta) novo.risco = clamp(novo.risco + ef.riscoDelta, 0, 2) as 0 | 1 | 2;
    if (ef.analyticsDelta) novo.analyticsAcumulado += ef.analyticsDelta;
  }
  novo.engajamento = clamp(novo.engajamento, 0, 100);
  novo.prontidao = clamp(novo.prontidao, 0, 100);
  novo.turnover = clamp(novo.turnover, 2, 40);
  novo.receita = Math.max(20, novo.receita);
  novo.custoPessoal = Math.max(20, novo.custoPessoal);
  novo.eficiencia = (p("encadeamento.eficienciaBase") * novo.custoPessoal) / novo.receita;
  return novo;
}

function aplicarOpcaoEvento(e: Estado, ev: EventoDef, opcao: 0 | 1, exps: Explicacao[]): Estado {
  const motivo = `evento.${ev.id}.${opcao === 0 ? "a" : "b"}`;
  return aplicarEfeitos(e, ev.opcoes[opcao].efeitos, motivo, exps);
}

/** Joga o turno: simula, e se houver evento no turno, retorna a definição para a UI escolher. */
export function jogarTurnoTrad(part: PartidaTrad, d: Decisao): EventoDef | undefined {
  const r = simularTurno(part.estado, d, part.rngTurno, true);
  part.estado = r.estado;
  part.explicacoesPorTurno.push(r.explicacoes);
  part.decisoes.push(d);
  return part.agendaEventos.get(part.estado.turno);
}

export function aplicarEvento(part: PartidaTrad, ev: EventoDef, opcao: 0 | 1) {
  const exps = part.explicacoesPorTurno[part.explicacoesPorTurno.length - 1];
  part.estado = aplicarOpcaoEvento(part.estado, ev, opcao, exps);
  part.orcamentoDeltaProximo += ev.opcoes[opcao].orcamentoDelta ?? 0;
  part.eventosEscolhidos.push({ turno: part.estado.turno, eventoId: ev.id, opcao });
}

/** Aplica a resposta que o jogador deu ao chefão do semestre. */
export function aplicarRespostaChefao(part: PartidaTrad, chefaoId: string, resposta: RespostaChefao) {
  const exps = part.explicacoesPorTurno[part.explicacoesPorTurno.length - 1];
  part.estado = aplicarEfeitos(part.estado, resposta.efeitos, `chefaoResposta.${chefaoId}.${resposta.id}`, exps);
  part.orcamentoDeltaProximo += resposta.orcamentoDelta ?? 0;
  part.respostasChefao.push({ turno: part.estado.turno, chefaoId, respostaId: resposta.id });
}

/** Fecha o turno: registra histórico, decrementa a névoa e prepara o orçamento seguinte. */
export function fecharTurno(part: PartidaTrad) {
  part.historico.push(part.estado);
  for (const c of CAMPOS_NEVOA) part.reveladas[c] = Math.max(0, part.reveladas[c] - 1);

  part.pilotoResultado = part.pilotoPendente ? medirPiloto(part.estado) : null;
  part.pilotoPendente = false;

  part.compromissos = part.compromissos
    .map((c) => ({ ...c, turnosRestantes: c.turnosRestantes - 1 }))
    .filter((c) => c.turnosRestantes > 0);

  part.orcamento = Math.max(
    0,
    p("orcamentoPorTurno") - recorrenteAtivo(part) + part.orcamentoDeltaProximo
  );
  part.orcamentoDeltaProximo = 0;
}

export function acabou(part: PartidaTrad): boolean {
  return part.estado.turno >= TOTAL_TURNOS;
}

export interface ResumoTrad {
  /** Valor do Banco medido pelos indicadores, sem o mandato */
  valorBase: number;
  /** o que o mandato de 2030 somou */
  metas: PlacarMetas;
  /** valorBase + bônus do mandato: é este que o debrief mostra */
  valor: number;
  notas: { curto: string; medio: string; longo: string };
  final: ReturnType<typeof classificarFinal>;
}

export function resumoTrad(part: PartidaTrad): ResumoTrad {
  const valorBase = valorDoBanco(part.estado);
  const metas = placarMetas(part.metas, part.estado);
  return {
    valorBase,
    metas,
    valor: valorBase + metas.bonus,
    notas: notasPorHorizonte(part.historico),
    final: classificarFinal(part.historico, undefined, metas.bonus),
  };
}

export interface RelacaoForte {
  motivo: string;
  /** campos afetados por esse motivo, do maior impacto relativo para o menor */
  campos: { campo: CampoNum; delta: number }[];
}

/**
 * As relações causais mais fortes de um semestre.
 * Os deltas são comparados em relação à média do mercado de cada indicador:
 * +2 de engajamento (base 60) pesa menos que +2 de NPS (base 25).
 */
export function relacoesFortes(exps: Explicacao[], quantas = 2): RelacaoForte[] {
  const peso = (campo: CampoNum, delta: number) => Math.abs(delta) / p(`benchmark.${campo}`);
  const porMotivo = new Map<string, Map<CampoNum, number>>();
  for (const ex of exps) {
    const campos = porMotivo.get(ex.motivo) ?? new Map<CampoNum, number>();
    campos.set(ex.campo, (campos.get(ex.campo) ?? 0) + ex.delta);
    porMotivo.set(ex.motivo, campos);
  }
  return [...porMotivo]
    .map(([motivo, campos]) => ({
      motivo,
      total: [...campos].reduce((s, [campo, delta]) => s + peso(campo, delta), 0),
      campos: [...campos]
        .map(([campo, delta]) => ({ campo, delta }))
        .filter((c) => Math.abs(c.delta) >= 0.05)
        .sort((a, b) => peso(b.campo, b.delta) - peso(a.campo, a.delta)),
    }))
    .filter((r) => r.campos.length > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, quantas)
    .map(({ motivo, campos }) => ({ motivo, campos }));
}

export interface DecisaoChave {
  turno: number;
  deltaValor: number;
  motivoPrincipal: string;
}

/** As 3 decisões (turnos) que mais mexeram no Valor do Banco. */
export function decisoesChave(part: PartidaTrad): DecisaoChave[] {
  const v = part.historico.map(valorDoBanco);
  const porTurno: DecisaoChave[] = [];
  for (let t = 1; t < v.length; t++) {
    const exps = part.explicacoesPorTurno[t - 1] ?? [];
    let melhor = "";
    let maior = 0;
    const agrupado = new Map<string, number>();
    for (const ex of exps) agrupado.set(ex.motivo, (agrupado.get(ex.motivo) ?? 0) + Math.abs(ex.delta));
    for (const [motivo, soma] of agrupado) {
      if (soma > maior) {
        maior = soma;
        melhor = motivo;
      }
    }
    porTurno.push({ turno: t, deltaValor: v[t] - v[t - 1], motivoPrincipal: melhor });
  }
  return porTurno.sort((a, b) => Math.abs(b.deltaValor) - Math.abs(a.deltaValor)).slice(0, 3);
}

/** "E se?": refaz a partida trocando a decisão de um turno; devolve o Valor final alternativo. */
export function eSe(part: PartidaTrad, turno: number, novaDecisao: Decisao): number {
  const rng = criarRng(part.seed);
  let e = estadoInicial();
  const escolhas = new Map(part.eventosEscolhidos.map((ev) => [ev.turno, ev]));
  for (let t = 1; t <= part.decisoes.length; t++) {
    const d = t === turno ? novaDecisao : part.decisoes[t - 1];
    const r = simularTurno(e, d, rng, true);
    e = r.estado;
    const evDef = part.agendaEventos.get(t);
    const escolha = escolhas.get(t);
    if (evDef && escolha) e = aplicarOpcaoEvento(e, evDef, escolha.opcao, []);
  }
  return valorDoBanco(e);
}

export const DECISAO_EQUILIBRADA: Decisao = {
  alocacao: { ld_cargo: 3, interno: 3, ia_copiloto: 4 },
};
