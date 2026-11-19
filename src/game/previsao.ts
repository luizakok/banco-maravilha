import { criarRng } from "../model/rng";
import { p, simularTurno } from "../model/simulate";
import type { Decisao, Estado } from "../model/types";

export type CampoPrevisto = "engajamento" | "turnover" | "prontidao" | "custoPessoal" | "receita" | "nps";

export const CAMPOS_PREVISTOS: CampoPrevisto[] = [
  "engajamento",
  "turnover",
  "prontidao",
  "custoPessoal",
  "receita",
  "nps",
];

export type Confianca = "cega" | "direcao" | "precisa";

export interface LinhaPrevisao {
  campo: CampoPrevisto;
  /** null quando o jogador não tem dados suficientes */
  direcao: "sobe" | "desce" | "estavel" | null;
  /** extremos da faixa estimada, já na ordem menor→maior */
  faixa: [number, number] | null;
}

export function confiancaDe(analyticsAcumulado: number): Confianca {
  if (analyticsAcumulado >= p("previsao.analyticsParaPrecisao")) return "precisa";
  if (analyticsAcumulado >= p("previsao.analyticsParaDirecao")) return "direcao";
  return "cega";
}

/**
 * Projeta o próximo semestre com a decisão em construção.
 * Projeção pura: não toca no estado da partida nem no RNG dela, e ignora chefões
 * (o chefão é justamente o que a previsão não enxerga).
 */
export function preverTurno(estado: Estado, d: Decisao): LinhaPrevisao[] {
  const confianca = confiancaDe(estado.analyticsAcumulado);
  const proj = simularTurno(estado, d, criarRng(1), false).estado;
  const banda = confianca === "precisa" ? p("previsao.bandaEstreita") : p("previsao.bandaLarga");

  return CAMPOS_PREVISTOS.map((campo) => {
    if (confianca === "cega") return { campo, direcao: null, faixa: null };
    const delta = proj[campo] - estado[campo];
    const margem = Math.abs(delta) * banda;
    const faixa: [number, number] = [delta - margem, delta + margem];
    const direcao = Math.abs(delta) < 0.05 ? "estavel" : delta > 0 ? "sobe" : "desce";
    return { campo, direcao, faixa };
  });
}
