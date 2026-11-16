import { describe, expect, it } from "vitest";
import { simularPartida } from "../src/model/scoring";
import { aleatoria, equilibrada, soContratar, soIA, soTreinar } from "./estrategias";

const SEEDS = [7, 42, 2027];

describe("as 5 estratégias automáticas", () => {
  it("nenhuma extrema supera a equilibrada no Valor do Banco", () => {
    for (const seed of SEEDS) {
      const vEq = simularPartida(equilibrada(), seed).valorFinal;
      expect(simularPartida(soContratar(), seed).valorFinal).toBeLessThan(vEq);
      expect(simularPartida(soTreinar(), seed).valorFinal).toBeLessThan(vEq);
      expect(simularPartida(soIA(), seed).valorFinal).toBeLessThan(vEq);
    }
  });

  it("só contratar: custo explode -> Bombeiro ou Jardineiro", () => {
    for (const seed of SEEDS) {
      const r = simularPartida(soContratar(), seed);
      expect(r.historico.at(-1)!.custoPessoal).toBeGreaterThan(150);
      expect(["bombeiro", "jardineiro"]).toContain(r.final);
    }
  });

  it("só treinar: O Jardineiro", () => {
    for (const seed of SEEDS) expect(simularPartida(soTreinar(), seed).final).toBe("jardineiro");
  });

  it("só IA: O Apostador", () => {
    for (const seed of SEEDS) expect(simularPartida(soIA(), seed).final).toBe("apostador");
  });

  it("equilibrada: O Arquiteto", () => {
    for (const seed of SEEDS) {
      const r = simularPartida(equilibrada(), seed);
      expect(r.final).toBe("arquiteto");
      expect(r.valorFinal).toBeGreaterThanOrEqual(80);
    }
  });

  it("aleatória: termina sem erro, com um final válido", () => {
    for (const seed of [...SEEDS, 1, 999]) {
      const r = simularPartida(aleatoria(seed), seed);
      expect(["arquiteto", "bombeiro", "jardineiro", "apostador"]).toContain(r.final);
    }
  });
});
