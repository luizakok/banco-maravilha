import { describe, expect, it } from "vitest";
import { METAS, QUANTAS_METAS, metaAtingida, placarMetas, type MetaId } from "../src/game/metas";
import { equilibrada, soIA } from "./estrategias";
import {
  acabou,
  DECISAO_EQUILIBRADA,
  fecharTurno,
  jogarTurnoTrad,
  novaPartidaTrad,
  resumoTrad,
} from "../src/game/tradicional";
import { classificarFinal, valorDoBanco } from "../src/model/scoring";
import { estadoInicial, simularTurno, p } from "../src/model/simulate";
import { criarRng } from "../src/model/rng";
import type { Decisao, Estado } from "../src/model/types";

function jogar(decisoes: Decisao[], seed = 7): Estado[] {
  const rng = criarRng(seed);
  let e = estadoInicial();
  const historico = [e];
  for (const d of decisoes) {
    e = simularTurno(e, d, rng).estado;
    historico.push(e);
  }
  return historico;
}

describe("catálogo de metas", () => {
  it("oferece seis metas e pede três", () => {
    expect(METAS).toHaveLength(6);
    expect(QUANTAS_METAS).toBe(3);
  });

  it("metade das metas mora em indicador na névoa", () => {
    // a tensão do mandato é essa: aceitar ser cobrado por algo que você não vê
    expect(METAS.filter((m) => m.naNevoa !== null).map((m) => m.id)).toEqual([
      "engajamento",
      "prontidao",
      "retencao",
    ]);
  });

  it("todas as metas são alcançáveis, e nenhuma vem de graça", () => {
    // calibragem: o caminho equilibrado bate todas; o caminho só-IA não bate nenhuma
    const fimBom = jogar(equilibrada()).at(-1)!;
    const fimRuim = jogar(soIA()).at(-1)!;
    for (const m of METAS) {
      expect(metaAtingida(m.id, fimBom), `equilibrada deveria bater ${m.id}`).toBe(true);
      expect(metaAtingida(m.id, fimRuim), `só-IA não deveria bater ${m.id}`).toBe(false);
    }
  });

  it("o estado inicial não entrega nenhuma meta: todas exigem a partida", () => {
    const e = estadoInicial();
    expect(METAS.filter((m) => metaAtingida(m.id, e)).map((m) => m.id)).toEqual([]);
  });
});

describe("placar do mandato", () => {
  it("soma bônus só pelas metas batidas, e nunca penaliza", () => {
    const fim = jogar(soIA()).at(-1)!;
    const pl = placarMetas(["eficiencia", "engajamento", "risco"], fim);
    expect(pl.atingidas).toEqual([]);
    expect(pl.naoAtingidas).toHaveLength(3);
    expect(pl.bonus).toBe(0);
  });

  it("três metas batidas valem três vezes o bônus", () => {
    const fim = jogar(equilibrada()).at(-1)!;
    const metas: MetaId[] = ["eficiencia", "cliente", "risco"];
    expect(placarMetas(metas, fim).bonus).toBe(3 * p("metas.bonusPorMeta"));
  });

  it("o mandato cumprido pode ser o que decide o final de arquiteto", () => {
    // um limiar logo acima do valor entregue: sozinho não dá arquiteto, com uma
    // meta cumprida dá
    const historico = jogar(equilibrada());
    const bonus = p("metas.bonusPorMeta");
    const limiar = valorDoBanco(historico.at(-1)!) + bonus / 2;
    expect(classificarFinal(historico, limiar)).not.toBe("arquiteto");
    expect(classificarFinal(historico, limiar, bonus)).toBe("arquiteto");
  });
});

describe("mandato na partida", () => {
  it("resumoTrad separa o valor dos indicadores do bônus do mandato", () => {
    const part = novaPartidaTrad(5, ["eficiencia", "cliente", "risco"]);
    while (!acabou(part)) {
      jogarTurnoTrad(part, DECISAO_EQUILIBRADA);
      fecharTurno(part);
    }
    const r = resumoTrad(part);
    expect(r.valor).toBeCloseTo(r.valorBase + r.metas.bonus, 6);
    expect(r.metas.atingidas.length + r.metas.naoAtingidas.length).toBe(3);
  });

  it("partida sem metas escolhidas não ganha nem perde nada", () => {
    const part = novaPartidaTrad(5);
    while (!acabou(part)) {
      jogarTurnoTrad(part, DECISAO_EQUILIBRADA);
      fecharTurno(part);
    }
    const r = resumoTrad(part);
    expect(r.metas.bonus).toBe(0);
    expect(r.valor).toBe(r.valorBase);
  });
});
