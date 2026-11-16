import cardsJson from "../content/cards.json";
import type { Alavanca, Decisao, Estado, Explicacao } from "../model/types";
import { criarRng, type Rng } from "../model/rng";
import { estadoInicial, p as param, simularTurno } from "../model/simulate";
import { classificarFinal, notasPorHorizonte, valorDoBanco } from "../model/scoring";

export interface CartaDef {
  id: string;
  alocacao: Partial<Record<Alavanca, number>>;
  gestaoPorResultados?: boolean;
}

export interface TurnoDef {
  mancheteKey: string;
  chefao?: boolean;
  falas: { conselheiro: string; key: string }[];
  cartas: CartaDef[];
}

export const TURNOS_EXPRESS = (cardsJson as { turnos: TurnoDef[] }).turnos;

export interface PartidaExpress {
  rng: Rng;
  estado: Estado;
  historico: Estado[];
  explicacoesPorTurno: Explicacao[][];
  cartasEscolhidas: string[];
}

export function novaPartidaExpress(seed = Date.now() >>> 0): PartidaExpress {
  const e = estadoInicial();
  return { rng: criarRng(seed), estado: e, historico: [e], explicacoesPorTurno: [], cartasEscolhidas: [] };
}

export function jogarCarta(p: PartidaExpress, carta: CartaDef): void {
  const d: Decisao = { alocacao: carta.alocacao, gestaoPorResultados: carta.gestaoPorResultados };
  const r = simularTurno(p.estado, d, p.rng);
  p.estado = r.estado;
  p.historico.push(r.estado);
  p.explicacoesPorTurno.push(r.explicacoes);
  p.cartasEscolhidas.push(carta.id);
}

export function resumoFinal(p: PartidaExpress) {
  return {
    valor: valorDoBanco(p.estado),
    notas: notasPorHorizonte(p.historico),
    final: classificarFinal(p.historico, param("placar.limiarArquitetoExpress")),
  };
}
