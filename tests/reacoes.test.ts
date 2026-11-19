import { describe, expect, it } from "vitest";
import pt from "../src/content/i18n/pt.json";
import en from "../src/content/i18n/en.json";
import { acabou, aplicarEvento, fecharTurno, jogarTurnoTrad, novaPartidaTrad, registrarEscolhas } from "../src/game/tradicional";
import { montarDecisao, opcoesDoGap, gapsDoTurno, politicasDisponiveis, type Escolhas } from "../src/game/gaps";
import { reacaoDoSemestre } from "../src/game/reacoes";
import { criarRng } from "../src/model/rng";

const FALAS = pt.reacoes as Record<string, string>;
const FALAS_EN = en.reacoes as Record<string, string>;

/** Uma partida com escolhas pseudoaleatórias, para passar por muitas regras diferentes. */
function jogar(seed: number, aoFecharTurno: (part: ReturnType<typeof novaPartidaTrad>) => void) {
  const part = novaPartidaTrad(seed);
  const rng = criarRng(seed ^ 0xabcdef);
  while (!acabou(part)) {
    const esc: Escolhas = { porGap: {}, politicas: [] };
    for (const gap of gapsDoTurno(part.estado.turno + 1)) {
      const ops = opcoesDoGap(gap);
      if (rng() < 0.6) {
        const o = ops[Math.floor(rng() * ops.length)];
        esc.porGap[gap.id] = o.id;
      }
    }
    const pols = politicasDisponiveis(part.estado.hibridoAtivo);
    for (const pol of pols) if (rng() < 0.3) esc.politicas.push(pol.id);

    registrarEscolhas(part, esc);
    const ev = jogarTurnoTrad(part, montarDecisao(esc, pols, part.copilotosAtivos));
    if (ev) aplicarEvento(part, ev, rng() < 0.5 ? 0 : 1);
    aoFecharTurno(part);
    fecharTurno(part);
  }
  return part;
}

describe("reações dos conselheiros", () => {
  it("toda fala alcançável existe em PT e EN, sem placeholder sobrando", () => {
    const vistas = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      jogar(seed, (part) => {
        const r = reacaoDoSemestre(part);
        if (!r) return;
        vistas.add(r.chave);
        expect(FALAS[r.chave], `falta reacoes.${r.chave} em pt.json`).toBeTypeOf("string");
        expect(FALAS_EN[r.chave], `falta reacoes.${r.chave} em en.json`).toBeTypeOf("string");
        for (const texto of [FALAS[r.chave], FALAS_EN[r.chave]]) {
          const restante = texto.replace(/\{(\w+)\}/g, (m, k: string) => (k in r.vars ? r.vars[k] : m));
          expect(restante, `reacoes.${r.chave} ficou com placeholder`).not.toMatch(/\{\w+\}/);
        }
      });
    }
    // se o motor só conseguisse uma ou duas falas, o comitê seria um papagaio
    expect(vistas.size).toBeGreaterThan(8);
  });

  it("os quatro conselheiros aparecem ao longo das partidas", () => {
    const quem = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      jogar(seed, (part) => {
        const r = reacaoDoSemestre(part);
        if (r) quem.add(r.conselheiro);
      });
    }
    expect([...quem].sort()).toEqual(["ceo", "cfo", "cto", "voz"]);
  });

  it("a reação do semestre é estável: repintar a tela não troca o conselheiro", () => {
    const part = novaPartidaTrad(7);
    jogarTurnoTrad(part, { alocacao: { interno: 4 } });
    const primeira = reacaoDoSemestre(part);
    expect(reacaoDoSemestre(part)).toBe(primeira);
    expect(reacaoDoSemestre(part)).toBe(primeira);
  });

  it("ninguém fala antes do primeiro semestre ser jogado", () => {
    expect(reacaoDoSemestre(novaPartidaTrad(3))).toBeNull();
  });
});
