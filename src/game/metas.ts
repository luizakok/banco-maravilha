/**
 * O mandato de 2030. Antes do primeiro semestre a CEO pede três metas, e o
 * jogador escolhe quais. Elas não mexem na simulação — mexem no que conta como
 * sucesso no fim, o que é justamente a aula: estratégia de pessoas é escolher
 * em que você vai ser cobrado.
 *
 * Três metas moram em indicadores escondidos pela névoa (engajamento,
 * prontidão, turnover) e três em indicadores sempre visíveis (eficiência, NPS,
 * risco). Quem escolhe meta na névoa aceita decidir sem placar.
 */
import type { CampoNevoa } from "./tradicional";
import { p } from "../model/simulate";
import type { Estado } from "../model/types";

export type MetaId = "eficiencia" | "engajamento" | "prontidao" | "retencao" | "cliente" | "risco";

export interface MetaDef {
  id: MetaId;
  /** indicador que a meta observa; null = risco, que não tem campo numérico */
  campo: "eficiencia" | "engajamento" | "prontidao" | "turnover" | "nps" | null;
  /** o indicador fica na névoa? define se o progresso aparece durante a partida */
  naNevoa: CampoNevoa | null;
  /** valor-alvo (null para risco, que é alvo zero por definição) */
  alvo: number | null;
  /** o alvo é um teto (menor é melhor) ou um piso? */
  sentido: "teto" | "piso";
}

export const METAS: MetaDef[] = [
  { id: "eficiencia", campo: "eficiencia", naNevoa: null, alvo: p("metas.alvoEficiencia"), sentido: "teto" },
  { id: "engajamento", campo: "engajamento", naNevoa: "engajamento", alvo: p("metas.alvoEngajamento"), sentido: "piso" },
  { id: "prontidao", campo: "prontidao", naNevoa: "prontidao", alvo: p("metas.alvoProntidao"), sentido: "piso" },
  { id: "retencao", campo: "turnover", naNevoa: "turnover", alvo: p("metas.alvoTurnover"), sentido: "teto" },
  { id: "cliente", campo: "nps", naNevoa: null, alvo: p("metas.alvoNps"), sentido: "piso" },
  { id: "risco", campo: null, naNevoa: null, alvo: null, sentido: "teto" },
];

export const QUANTAS_METAS = p("metas.quantas");

export function metaPorId(id: MetaId): MetaDef {
  const m = METAS.find((x) => x.id === id);
  if (!m) throw new Error(`Meta desconhecida: ${id}`);
  return m;
}

/** A meta foi batida neste estado? */
export function metaAtingida(id: MetaId, e: Estado): boolean {
  const m = metaPorId(id);
  if (m.campo === null) return e.risco === 0;
  const v = e[m.campo];
  return m.sentido === "teto" ? v <= m.alvo! : v >= m.alvo!;
}

/** Valor atual do indicador da meta, para mostrar "42 / 52" na tela. */
export function valorAtual(id: MetaId, e: Estado): number {
  const m = metaPorId(id);
  return m.campo === null ? e.risco : e[m.campo];
}

export interface PlacarMetas {
  atingidas: MetaId[];
  naoAtingidas: MetaId[];
  bonus: number;
}

/**
 * Quanto o mandato cumprido soma ao Valor do Banco no fim. É um bônus, nunca
 * uma penalidade: a meta que você não escolheu não te pune, só não te ajuda.
 */
export function placarMetas(metas: MetaId[], fim: Estado): PlacarMetas {
  const atingidas = metas.filter((id) => metaAtingida(id, fim));
  return {
    atingidas,
    naoAtingidas: metas.filter((id) => !metaAtingida(id, fim)),
    bonus: atingidas.length * p("metas.bonusPorMeta"),
  };
}
