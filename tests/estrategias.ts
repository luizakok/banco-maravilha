import type { Alavanca, Decisao } from "../src/model/types";
import { criarRng } from "../src/model/rng";

const T = 8;

export function soContratar(): Decisao[] {
  return Array.from({ length: T }, () => ({ alocacao: { contratar: 10 } }));
}

export function soTreinar(): Decisao[] {
  return Array.from({ length: T }, () => ({ alocacao: { ld_cargo: 6, ld_realocar: 4 } }));
}

export function soIA(): Decisao[] {
  return Array.from({ length: T }, () => ({ alocacao: { ia_auto: 6, ia_copiloto: 4 } }));
}

export function equilibrada(): Decisao[] {
  return [
    { alocacao: { ld_cargo: 4, interno: 3, hibrido: 2, analytics: 1 }, gestaoPorResultados: true },
    { alocacao: { ld_cargo: 4, interno: 3, ia_copiloto: 2, analytics: 1 } },
    { alocacao: { ld_cargo: 4, contratar: 3, ia_copiloto: 3 } },
    { alocacao: { ld_cargo: 3, ia_auto: 4, ia_copiloto: 3 } },
    { alocacao: { ld_cargo: 3, interno: 3, ia_copiloto: 4 } },
    { alocacao: { ld_cargo: 3, ia_auto: 2, ia_copiloto: 4, analytics: 1 } },
    { alocacao: { ld_cargo: 3, interno: 2, ia_copiloto: 4, analytics: 1 } },
    { alocacao: { ld_cargo: 2, interno: 3, ia_copiloto: 5 } },
  ];
}

const ALAVANCAS: Alavanca[] = [
  "contratar",
  "interno",
  "ld_cargo",
  "ld_realocar",
  "ia_auto",
  "ia_copiloto",
  "hibrido",
  "flex",
  "analytics",
];

export function aleatoria(seed: number): Decisao[] {
  const rng = criarRng(seed);
  return Array.from({ length: T }, () => {
    const alocacao: Partial<Record<Alavanca, number>> = {};
    let resto = 10;
    while (resto > 0) {
      const a = ALAVANCAS[Math.floor(rng() * ALAVANCAS.length)];
      const m = Math.min(resto, 1 + Math.floor(rng() * 4));
      alocacao[a] = (alocacao[a] ?? 0) + m;
      resto -= m;
    }
    return { alocacao, gestaoPorResultados: rng() > 0.5 };
  });
}
