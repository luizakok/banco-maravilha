import gapsJson from "../content/gaps.json";
import { p } from "../model/simulate";
import type { Alavanca, Decisao } from "../model/types";

export type Abordagem = "build" | "buy" | "borrow" | "bot";
export type Tamanho = "P" | "M" | "G";
export type Etiqueta = "rapido" | "lento" | "caro" | "arriscado";

export interface GapDef {
  id: string;
  escala: number;
  alavancas: Partial<Record<Abordagem, Alavanca>>;
}

interface GapsJson {
  catalogo: GapDef[];
  porTurno: Record<string, string[]>;
}

const DADOS = gapsJson as GapsJson;
export const CATALOGO: GapDef[] = DADOS.catalogo;

export const ABORDAGENS: Abordagem[] = ["build", "buy", "borrow", "bot"];
const TAMANHOS: Tamanho[] = ["P", "M", "G"];

export interface OpcaoGap {
  /** chave estável: gap.abordagem.tamanho */
  id: string;
  gapId: string;
  abordagem: Abordagem;
  tamanho: Tamanho;
  alavanca: Alavanca;
  /** unidades de esforço entregues ao modelo */
  esforco: number;
  /** custo único em moedas (inteiro) */
  custo: number;
  /** custo que volta todo semestre, em moedas (0 = custo único) */
  recorrente: number;
  /** semestres até o efeito principal aparecer (0 = neste semestre) */
  lag: number;
  etiquetas: Etiqueta[];
}

const LAGS: Record<Alavanca, string | null> = {
  contratar: null, // efeito imediato (a rampa completa vem depois)
  interno: "interno.lag",
  ld_cargo: "ld.cargoLag",
  ld_realocar: "ld.realocarLag",
  ia_auto: "ia.autoLag",
  ia_copiloto: "ia.copilotoLag",
  hibrido: "futuroTrabalho.hibridoLag",
  flex: null,
  analytics: null,
};

export function lagDe(a: Alavanca): number {
  const chave = LAGS[a];
  return chave === null ? 0 : p(chave);
}

const PRECO: Record<Abordagem, string> = {
  build: "economia.precoBuild",
  buy: "economia.precoBuy",
  borrow: "economia.precoBorrow",
  bot: "economia.precoBot",
};

const RECORRENTE: Record<Abordagem, string> = {
  build: "economia.recorrenteBuild",
  buy: "economia.recorrenteBuy",
  borrow: "economia.recorrenteBorrow",
  bot: "economia.recorrenteBot",
};

/** O modelo conta famílias inteiras (copiloto) e pares de esforço (automação). */
function quantizar(alavanca: Alavanca, esforco: number): number {
  if (alavanca === "ia_copiloto") return Math.max(1, Math.round(esforco));
  if (alavanca === "ia_auto") {
    const passo = p("ia.moedasPorFamiliaAuto");
    return Math.max(passo, Math.round(esforco / passo) * passo);
  }
  return Math.round(esforco * 10) / 10;
}

function esforcoBase(tamanho: Tamanho): number {
  return p(`economia.esforco${tamanho}`);
}

function etiquetasDe(o: Omit<OpcaoGap, "etiquetas">): Etiqueta[] {
  const et: Etiqueta[] = [];
  if (o.lag === 0) et.push("rapido");
  if (o.lag >= 2) et.push("lento");
  if (o.custo >= p("economia.limiarCaro") || o.recorrente > 0) et.push("caro");
  if (o.abordagem === "buy" || o.alavanca === "ia_auto") et.push("arriscado");
  return et;
}

export function opcoesDoGap(gap: GapDef): OpcaoGap[] {
  const saida: OpcaoGap[] = [];
  for (const abordagem of ABORDAGENS) {
    const alavanca = gap.alavancas[abordagem];
    if (!alavanca) continue;
    const vistos = new Set<number>();
    for (const tamanho of TAMANHOS) {
      const esforco = quantizar(alavanca, esforcoBase(tamanho) * gap.escala);
      if (vistos.has(esforco)) continue; // automação P e M cairiam na mesma família
      vistos.add(esforco);
      const custo = Math.round(esforco * p("economia.moedasPorEsforco") * p(PRECO[abordagem]));
      const parcial = {
        id: `${gap.id}.${abordagem}.${tamanho}`,
        gapId: gap.id,
        abordagem,
        tamanho,
        alavanca,
        esforco,
        custo,
        recorrente: Math.round(custo * p(RECORRENTE[abordagem])),
        lag: lagDe(alavanca),
      };
      saida.push({ ...parcial, etiquetas: etiquetasDe(parcial) });
    }
  }
  return saida;
}

export function gapsDoTurno(turno: number): GapDef[] {
  const ids = DADOS.porTurno[String(turno)] ?? [];
  return ids.map((id) => {
    const g = CATALOGO.find((c) => c.id === id);
    if (!g) throw new Error(`Gap desconhecido: ${id}`);
    return g;
  });
}

export function opcaoPorId(id: string): OpcaoGap | undefined {
  const gapId = id.split(".")[0];
  const gap = CATALOGO.find((c) => c.id === gapId);
  if (!gap) return undefined;
  return opcoesDoGap(gap).find((o) => o.id === id);
}

export interface Politica {
  id: "hibrido" | "gpr" | "painel";
  alavanca: Alavanca;
  esforco: number;
  custo: number;
  recorrente: number;
  lag: number;
  etiquetas: Etiqueta[];
}

/** Políticas do semestre: futuro do trabalho e people analytics, em linguagem simples. */
export function politicasDisponiveis(hibridoAtivo: boolean): Politica[] {
  const lista: Politica[] = [];
  if (!hibridoAtivo) {
    const custoHib = Math.round(p("futuroTrabalho.hibridoCustoSemGPR") * p("economia.moedasPorEsforco"));
    lista.push({
      id: "hibrido",
      alavanca: "hibrido",
      esforco: p("futuroTrabalho.hibridoCustoSemGPR"),
      custo: custoHib,
      recorrente: 0,
      lag: p("futuroTrabalho.hibridoLag"),
      etiquetas: ["rapido"],
    });
    const custoGpr = Math.round(p("futuroTrabalho.hibridoCustoComGPR") * p("economia.moedasPorEsforco"));
    lista.push({
      id: "gpr",
      alavanca: "hibrido",
      esforco: p("futuroTrabalho.hibridoCustoComGPR"),
      custo: custoGpr,
      recorrente: 0,
      lag: p("futuroTrabalho.hibridoLag"),
      etiquetas: [],
    });
  }
  lista.push({
    id: "painel",
    alavanca: "analytics",
    esforco: p("analytics.esforcoPainel"),
    custo: p("analytics.custoPainel"),
    recorrente: 0,
    lag: 0,
    etiquetas: ["rapido"],
  });
  return lista;
}

export interface Escolhas {
  /** gapId -> id da opção escolhida */
  porGap: Record<string, string>;
  politicas: Politica["id"][];
}

export function custoTotal(esc: Escolhas, politicas: Politica[]): number {
  let total = 0;
  for (const id of Object.values(esc.porGap)) total += opcaoPorId(id)?.custo ?? 0;
  for (const pid of esc.politicas) total += politicas.find((x) => x.id === pid)?.custo ?? 0;
  return total;
}

export function recorrenteTotal(esc: Escolhas): number {
  let total = 0;
  for (const id of Object.values(esc.porGap)) total += opcaoPorId(id)?.recorrente ?? 0;
  return total;
}

/**
 * Converte as escolhas em uma Decisao do modelo.
 * `copilotosAtivos` são as licenças já pagas em semestres anteriores: o modelo
 * precisa recebê-las todo turno para que as famílias sigam com copiloto.
 */
export function montarDecisao(esc: Escolhas, politicas: Politica[], copilotosAtivos = 0): Decisao {
  const alocacao: Partial<Record<Alavanca, number>> = {};
  const somar = (a: Alavanca, v: number) => {
    alocacao[a] = (alocacao[a] ?? 0) + v;
  };
  for (const id of Object.values(esc.porGap)) {
    const o = opcaoPorId(id);
    if (o) somar(o.alavanca, o.esforco);
  }
  const d: Decisao = { alocacao };
  for (const pid of esc.politicas) {
    const pol = politicas.find((x) => x.id === pid);
    if (!pol) continue;
    somar(pol.alavanca, pol.esforco);
    if (pid === "gpr") d.gestaoPorResultados = true;
  }
  if (copilotosAtivos > 0) somar("ia_copiloto", copilotosAtivos);
  return d;
}

/** Quantas famílias de copiloto a decisão deste turno licencia (para renovar depois). */
export function copilotosDaDecisao(esc: Escolhas): number {
  let n = 0;
  for (const id of Object.values(esc.porGap)) {
    const o = opcaoPorId(id);
    if (o?.alavanca === "ia_copiloto") n += o.esforco;
  }
  return n;
}
