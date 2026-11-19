/**
 * Quem comenta o semestre depois que você assina — e o que essa pessoa tem a dizer.
 *
 * Regra do guia de falas: a reação sempre cita algo desta partida (uma escolha,
 * um número do placar ou um prazo). Se nada do que aconteceu dá assunto para
 * ninguém, é melhor ficar em silêncio do que narrar o óbvio.
 *
 * Só um conselheiro fala por semestre: o que tiver mais o que dizer. Quem falou
 * no semestre anterior leva um desconto para o comitê não virar monólogo.
 */
import { opcaoPorId, type Abordagem, type Escolhas } from "./gaps";
import { recorrenteAtivo, type PartidaTrad } from "./tradicional";
import { valorDoBanco } from "../model/scoring";
import { p } from "../model/simulate";
import { anoDoTurno } from "./fases";
import type { Estado } from "../model/types";

export type Conselheiro = "ceo" | "cfo" | "cto" | "voz";

export interface Reacao {
  conselheiro: Conselheiro;
  /** chave sob `reacoes.` no i18n */
  chave: string;
  vars: Record<string, string>;
}

interface Candidata extends Reacao {
  peso: number;
}

/** Tudo que aconteceu no semestre, já mastigado para as regras lerem. */
interface Fatos {
  turno: number;
  ano: number;
  gasto: Record<Abordagem, number>;
  gastoTotal: number;
  copilotosNovos: number;
  recorrente: number;
  hibridoNovo: boolean;
  gpr: boolean;
  painel: boolean;
  /** pagou um piloto neste semestre; o número medido chega no briefing seguinte */
  pilotoContratado: boolean;
  d: Record<"receita" | "nps" | "engajamento" | "turnover" | "prontidao" | "eficiencia" | "risco", number>;
  e: Estado;
}

const ZERO: Record<Abordagem, number> = { build: 0, buy: 0, borrow: 0, bot: 0 };

function levantar(part: PartidaTrad): Fatos {
  const e = part.estado;
  const antes = part.historico.at(-1) ?? e; // fecharTurno ainda não rodou
  const esc: Escolhas = part.escolhasPorTurno.at(-1) ?? { porGap: {}, politicas: [] };

  const gasto = { ...ZERO };
  let copilotosNovos = 0;
  for (const id of Object.values(esc.porGap)) {
    const o = opcaoPorId(id);
    if (!o) continue;
    gasto[o.abordagem] += o.custo;
    if (o.alavanca === "ia_copiloto") copilotosNovos += o.esforco;
  }

  const delta = (c: keyof Estado) => Number(e[c]) - Number(antes[c]);
  return {
    turno: e.turno,
    ano: anoDoTurno(e.turno),
    gasto,
    gastoTotal: gasto.build + gasto.buy + gasto.borrow + gasto.bot,
    copilotosNovos,
    recorrente: recorrenteAtivo(part),
    hibridoNovo: esc.politicas.includes("hibrido") || esc.politicas.includes("gpr"),
    gpr: esc.politicas.includes("gpr"),
    painel: esc.politicas.includes("painel"),
    pilotoContratado: part.pilotoPendente,
    d: {
      receita: delta("receita"),
      nps: delta("nps"),
      engajamento: delta("engajamento"),
      turnover: delta("turnover"),
      prontidao: delta("prontidao"),
      eficiencia: delta("eficiencia"),
      risco: delta("risco"),
    },
    e,
  };
}

const custoPiloto = () => p("analytics.custoPiloto");
const n0 = (v: number) => String(Math.round(v));
const n1 = (v: number) => Math.abs(Math.round(v * 10) / 10).toFixed(1);

/**
 * As regras. Cada uma devolve uma candidata ou nada; o peso é "o quanto essa
 * pessoa tem assunto". Nenhuma fala sem ter um número desta partida na mão.
 */
function candidatas(f: Fatos): Candidata[] {
  const c: Candidata[] = [];
  const add = (peso: number, conselheiro: Conselheiro, chave: string, vars: Record<string, string> = {}) =>
    c.push({ peso, conselheiro, chave, vars });

  // ── Haroldo (CFO): o custo de tudo ──
  if (f.gasto.build >= 20) add(3 + f.gasto.build / 20, "cfo", "buildPesado", { moedas: n0(f.gasto.build) });
  if (f.recorrente >= 30) add(4.5, "cfo", "recorrenteAlto", { moedas: n0(f.recorrente) });
  if (f.gastoTotal <= 20) add(3.2, "cfo", "gastouPouco", { moedas: n0(f.gastoTotal), ano: n0(f.ano) });
  if (f.pilotoContratado) add(4.5, "cfo", "pagouPiloto", { moedas: n0(custoPiloto()) });
  if (f.d.eficiencia <= -1.5) add(3.8, "cfo", "eficienciaMelhorou", { pontos: n1(f.d.eficiencia) });
  if (f.turno === 7 && f.e.analyticsAcumulado < 2) add(5.5, "cfo", "auditoriaSemDados");

  // ── Kenji (CTO): a ferramenta nova ──
  if (f.copilotosNovos >= 1) add(3.4, "cto", "copilotoNovo", { n: n0(f.copilotosNovos) });
  if (f.gasto.bot > 0 && f.e.prontidao < 50)
    add(5.2, "cto", "automatizouSemPreparo", { pct: n0(100 - f.e.prontidao) });
  if (f.painel) add(3.6, "cto", "painelComprado");
  if (f.turno === 3 && f.gasto.bot + f.copilotosNovos === 0) add(5.4, "cto", "ondaSemResposta", { nps: n0(f.e.nps) });
  if (f.d.prontidao >= 3) add(3.4, "cto", "prontidaoSubiu", { prontidao: n0(f.e.prontidao) });

  // ── Sandra (Voz do Time): quem senta ao lado dela ──
  if (f.gasto.buy > 0 && f.gasto.build === 0) add(4.6, "voz", "comprouEmVezDeFormar", { moedas: n0(f.gasto.buy) });
  if (f.d.turnover >= 1.5) add(5, "voz", "turnoverSubiu", { turnover: n1(f.e.turnover) });
  if (f.d.engajamento >= 3) add(3.6, "voz", "engajamentoSubiu");
  if (f.d.engajamento <= -3) add(4.8, "voz", "engajamentoCaiu");
  if (f.hibridoNovo) add(4.2, "voz", f.gpr ? "hibridoComMetas" : "hibridoSemMetas");
  if (f.gasto.borrow > 0) add(3.3, "voz", "temporarios", { moedas: n0(f.gasto.borrow) });
  if (f.turno === 5 && f.e.turnover > 14) add(5.1, "voz", "cacaTalentosDoeu", { turnover: n1(f.e.turnover) });

  // ── Vera (CEO): trimestre, receita, conselho ──
  if (f.d.receita <= -1) add(4 + Math.abs(f.d.receita) / 2, "ceo", "receitaCaiu", { receita: n0(f.e.receita) });
  if (f.d.receita >= 2) add(3.5, "ceo", "receitaSubiu", { receita: n0(f.e.receita) });
  if (f.turno === 8) add(7, "ceo", "ultimoSemestre", { valor: n0(valorDoBanco(f.e)) });
  // só no semestre em que o risco sobe: repetir "risco no vermelho" por quatro
  // semestres transforma a Vera num alarme de carro
  if (f.d.risco > 0 && f.e.risco >= 2) add(5.3, "ceo", "riscoNoLimite");
  if (f.d.nps <= -3) add(4.4, "ceo", "npsCaiu", { nps: n0(f.e.nps) });

  return c;
}

/**
 * A reação do semestre, memorizada: a tela de resultado repinta ao trocar de
 * idioma e o conselheiro não pode mudar de ideia no meio.
 */
export function reacaoDoSemestre(part: PartidaTrad): Reacao | null {
  const i = part.estado.turno - 1;
  if (i < 0) return null;
  const guardada = part.reacoesPorTurno[i];
  if (guardada !== undefined) return guardada;

  const f = levantar(part);
  const anterior = part.reacoesPorTurno[i - 1]?.conselheiro;
  const jaDitas = new Set(part.reacoesPorTurno.flatMap((r) => (r ? [r.chave] : [])));
  const lista = candidatas(f)
    .map((x) => ({
      ...x,
      // quem acabou de falar cede a vez; fala repetida em oito semestres cansa
      peso: x.peso - (x.conselheiro === anterior ? 1.5 : 0) - (jaDitas.has(x.chave) ? 2.5 : 0),
    }))
    .sort((a, b) => b.peso - a.peso);

  const escolhida = lista[0] ?? null;
  const reacao = escolhida ? { conselheiro: escolhida.conselheiro, chave: escolhida.chave, vars: escolhida.vars } : null;
  part.reacoesPorTurno[i] = reacao;
  return reacao;
}
