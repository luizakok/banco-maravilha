import { describe, expect, it } from "vitest";
import { criarRng } from "../src/model/rng";
import { estadoInicial, simularTurno } from "../src/model/simulate";
import { simularPartida } from "../src/model/scoring";
import { aleatoria, equilibrada } from "./estrategias";
import type { Decisao, Estado } from "../src/model/types";

function rodar(decisoes: Decisao[], seed = 1): Estado {
  return simularPartida(decisoes, seed).historico.at(-1)!;
}

const vazio: Decisao = { alocacao: {} };

describe("determinismo e limites", () => {
  it("mesma seed e decisões dão o mesmo resultado", () => {
    const a = simularPartida(equilibrada(), 42);
    const b = simularPartida(equilibrada(), 42);
    expect(a).toEqual(b);
  });

  it("indicadores ficam dentro dos limites com decisões aleatórias", () => {
    for (const seed of [1, 2, 3, 99, 1234]) {
      const r = simularPartida(aleatoria(seed), seed);
      for (const e of r.historico) {
        expect(e.engajamento).toBeGreaterThanOrEqual(0);
        expect(e.engajamento).toBeLessThanOrEqual(100);
        expect(e.prontidao).toBeGreaterThanOrEqual(0);
        expect(e.prontidao).toBeLessThanOrEqual(100);
        expect(e.turnover).toBeGreaterThanOrEqual(2);
        expect(e.turnover).toBeLessThanOrEqual(40);
        expect([0, 1, 2]).toContain(e.risco);
        expect(Number.isFinite(e.receita)).toBe(true);
        expect(Number.isFinite(e.custoPessoal)).toBe(true);
      }
    }
  });

  it("não muta o estado de entrada", () => {
    const e0 = estadoInicial();
    const copia = structuredClone(e0);
    simularTurno(e0, { alocacao: { contratar: 5 } }, criarRng(1));
    expect(e0).toEqual(copia);
  });
});

describe("efeitos da tabela do brief (direção)", () => {
  it("contratar fora: capacidade imediata, custo alto, mais saídas", () => {
    const base = simularTurno(estadoInicial(), vazio, criarRng(1)).estado;
    const c = simularTurno(estadoInicial(), { alocacao: { contratar: 5 } }, criarRng(1)).estado;
    expect(c.prontidao).toBeGreaterThan(base.prontidao);
    expect(c.custoPessoal).toBeGreaterThan(base.custoPessoal);
    expect(c.turnover).toBeGreaterThan(base.turnover);
  });

  it("requalificar: custa agora, prontidão sobe depois, engajamento sobe", () => {
    const soLD: Decisao[] = Array.from({ length: 4 }, () => ({ alocacao: { ld_cargo: 5 } }));
    const nada: Decisao[] = Array.from({ length: 4 }, () => vazio);
    const hLD = simularPartida(soLD, 1).historico;
    const hNada = simularPartida(nada, 1).historico;
    expect(hLD[1].receita).toBeLessThan(hNada[1].receita); // custo imediato
    expect(hLD[4].prontidao).toBeGreaterThan(hNada[4].prontidao); // retorno com lag
    expect(hLD[4].engajamento).toBeGreaterThan(hNada[4].engajamento);
  });

  it("automatizar sem requalificar: custo cai, engajamento cai, turnover e risco sobem", () => {
    const decs: Decisao[] = [{ alocacao: { ia_auto: 6 } }, vazio, vazio];
    const h = simularPartida(decs, 1).historico;
    const hNada = simularPartida([vazio, vazio, vazio], 1).historico;
    expect(h[3].custoPessoal).toBeLessThan(hNada[3].custoPessoal);
    expect(h[1].engajamento).toBeLessThan(hNada[1].engajamento);
    expect(h[3].turnover).toBeGreaterThan(hNada[3].turnover);
    expect(h[1].risco).toBeGreaterThan(hNada[1].risco);
  });

  it("automatizar com requalificação atenua o dano", () => {
    const sem = simularTurno(estadoInicial(), { alocacao: { ia_auto: 6 } }, criarRng(1)).estado;
    const com = simularTurno(estadoInicial(), { alocacao: { ia_auto: 6, ld_cargo: 2 } }, criarRng(1)).estado;
    expect(com.engajamento).toBeGreaterThan(sem.engajamento);
    expect(com.risco).toBeLessThan(sem.risco);
  });

  it("copiloto com treinamento: receita sobe e turnover cai com lag", () => {
    const decs: Decisao[] = Array.from({ length: 4 }, () => ({ alocacao: { ia_copiloto: 3, ld_cargo: 2 } }));
    const nada: Decisao[] = Array.from({ length: 4 }, () => vazio);
    const h = simularPartida(decs, 1).historico;
    const hNada = simularPartida(nada, 1).historico;
    expect(h[4].receita).toBeGreaterThan(hNada[4].receita);
    expect(h[4].turnover).toBeLessThan(hNada[4].turnover);
  });

  it("híbrido com gestão por resultados reduz o turnover", () => {
    const decs: Decisao[] = [{ alocacao: { hibrido: 2 }, gestaoPorResultados: true }, vazio];
    const h = simularPartida(decs, 1).historico;
    const hNada = simularPartida([vazio, vazio], 1).historico;
    expect(h[2].turnover).toBeLessThan(hNada[2].turnover);
  });

  it("híbrido sem gestão por resultados derruba o engajamento", () => {
    const com: Decisao[] = [{ alocacao: { hibrido: 2 }, gestaoPorResultados: true }, vazio];
    const sem: Decisao[] = [{ alocacao: { hibrido: 1 } }, vazio];
    expect(rodar(sem.concat([vazio, vazio]), 1).engajamento).toBeLessThan(
      rodar(com.concat([vazio, vazio]), 1).engajamento
    );
  });

  it("cortar L&D: prontidão decai a partir do 2º turno sem investir", () => {
    const h = simularPartida([vazio, vazio, vazio], 1).historico;
    expect(h[2].prontidao).toBeLessThan(h[1].prontidao);
  });

  it("mais de 3 iniciativas derruba o engajamento", () => {
    const tres = simularTurno(
      estadoInicial(),
      { alocacao: { ld_cargo: 3, interno: 3, ia_copiloto: 4 } },
      criarRng(1)
    ).estado;
    const cinco = simularTurno(
      estadoInicial(),
      { alocacao: { ld_cargo: 2, interno: 2, ia_copiloto: 2, contratar: 2, flex: 2 } },
      criarRng(1)
    ).estado;
    expect(cinco.engajamento).toBeLessThan(tres.engajamento);
  });
});
