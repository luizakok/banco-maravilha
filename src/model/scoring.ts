import type { Decisao, Estado, Final, ResultadoPartida } from "./types";
import { criarRng } from "./rng";
import { estadoInicial, p, simularTurno } from "./simulate";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function valorDoBanco(e: Estado): number {
  const efScore = clamp(
    ((p("placar.eficienciaPior") - e.eficiencia) /
      (p("placar.eficienciaPior") - p("placar.eficienciaMelhor"))) *
      100,
    0,
    100
  );
  const npsScore = clamp(e.nps, 0, 100);
  const riscoScore = e.risco === 0 ? 100 : e.risco === 1 ? 50 : 0;
  return (
    p("placar.pesoReceita") * e.receita +
    p("placar.pesoEficiencia") * efScore +
    p("placar.pesoNps") * npsScore +
    p("placar.pesoRisco") * riscoScore
  );
}

function notaDeDelta(deltaMedioPorTurno: number): string {
  if (deltaMedioPorTurno >= 2) return "A";
  if (deltaMedioPorTurno >= 0.5) return "B";
  if (deltaMedioPorTurno >= -0.5) return "C";
  if (deltaMedioPorTurno >= -2) return "D";
  return "E";
}

export function notasPorHorizonte(historico: Estado[]): { curto: string; medio: string; longo: string } {
  const v = historico.map(valorDoBanco);
  const media = (ini: number, fim: number) => (fim <= ini ? 0 : (v[fim] - v[ini]) / (fim - ini));
  return {
    curto: notaDeDelta(media(0, Math.min(2, v.length - 1))),
    medio: notaDeDelta(media(Math.min(2, v.length - 1), Math.min(5, v.length - 1))),
    longo: notaDeDelta(media(Math.min(5, v.length - 1), v.length - 1)),
  };
}

export function classificarFinal(historico: Estado[], limiarArquiteto = p("placar.limiarArquiteto")): Final {
  const fim = historico[historico.length - 1];
  if (fim.apostadorMarcado) return "apostador";
  if (valorDoBanco(fim) >= limiarArquiteto && !fim.dividaAtiva) return "arquiteto";
  if (
    (fim.engajamento >= p("placar.jardineiroEngajamento") ||
      fim.prontidao >= p("placar.jardineiroProntidao")) &&
    fim.receita < p("placar.jardineiroReceita")
  )
    return "jardineiro";
  return "bombeiro";
}

/** Roda uma partida completa do modo Tradicional. Determinística para (decisões, seed). */
export function simularPartida(decisoes: Decisao[], seed: number): ResultadoPartida {
  const rng = criarRng(seed);
  let e = estadoInicial();
  const historico: Estado[] = [e];
  for (const d of decisoes) {
    e = simularTurno(e, d, rng).estado;
    historico.push(e);
  }
  return {
    historico,
    valorFinal: valorDoBanco(e),
    notas: notasPorHorizonte(historico),
    final: classificarFinal(historico),
  };
}
