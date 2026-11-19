import { describe, expect, it } from "vitest";
import { CHEFOES, chefaoDoTurno, respostasDisponiveis } from "../src/game/chefoes";
import {
  acabou,
  aplicarRespostaChefao,
  DECISAO_EQUILIBRADA,
  fecharTurno,
  jogarTurnoTrad,
  novaPartidaTrad,
  TURNOS_CHEFAO,
  type PartidaTrad,
} from "../src/game/tradicional";
import pt from "../src/content/i18n/pt.json";
import en from "../src/content/i18n/en.json";
import type { Decisao } from "../src/model/types";

const dic = (d: unknown, chave: string) => (d as Record<string, Record<string, string>>).chefoes[chave];

describe("catálogo de chefões", () => {
  it("cobre exatamente os semestres de chefão", () => {
    expect(CHEFOES.map((c) => c.turno)).toEqual(TURNOS_CHEFAO);
  });

  it("cada chefão tem três respostas e pelo menos uma sempre liberada", () => {
    for (const c of CHEFOES) {
      expect(c.respostas, c.id).toHaveLength(3);
      expect(c.respostas.some((r) => r.requisito === undefined), c.id).toBe(true);
    }
  });

  it("toda resposta travável explica o motivo do cadeado nos dois idiomas", () => {
    for (const c of CHEFOES) {
      for (const r of c.respostas) {
        for (const [nome, d] of [["pt", pt], ["en", en]] as const) {
          expect(dic(d, `${c.id}.${r.id}`), `${nome} ${c.id}.${r.id}`).toBeTruthy();
          expect(dic(d, `${c.id}.${r.id}Texto`), `${nome} ${c.id}.${r.id}Texto`).toBeTruthy();
          if (r.requisito)
            expect(dic(d, `${c.id}.${r.id}Travado`), `${nome} ${c.id}.${r.id}Travado`).toBeTruthy();
        }
      }
    }
  });

  it("chefaoDoTurno só responde nos semestres 3, 5 e 7", () => {
    for (let t = 1; t <= 8; t++) {
      expect(Boolean(chefaoDoTurno(t)), `semestre ${t}`).toBe(TURNOS_CHEFAO.includes(t));
    }
  });
});

/** Joga até o semestre de chefão pedido, com a decisão dada em todos os turnos. */
function jogarAte(turno: number, d: Decisao, seed = 3): PartidaTrad {
  const part = novaPartidaTrad(seed);
  while (part.estado.turno < turno - 1) {
    jogarTurnoTrad(part, d);
    fecharTurno(part);
  }
  jogarTurnoTrad(part, d);
  return part;
}

describe("preparo destrava respostas", () => {
  it("quem nunca investiu em IA nem em skills não pode escalar na Onda da IA", () => {
    const part = jogarAte(3, { alocacao: { contratar: 10 } });
    const escalar = respostasDisponiveis(chefaoDoTurno(3)!, part).find((x) => x.resposta.id === "escalar")!;
    expect(escalar.liberada).toBe(false);
  });

  it("quem já roda copiloto pode escalar na Onda da IA", () => {
    const part = jogarAte(3, { alocacao: { ia_copiloto: 3, ld_cargo: 4 } });
    const escalar = respostasDisponiveis(chefaoDoTurno(3)!, part).find((x) => x.resposta.id === "escalar")!;
    expect(escalar.liberada).toBe(true);
  });

  it("a trilha de carreira no Caça-Talentos exige base de evidência", () => {
    const sem = jogarAte(5, { alocacao: { ld_cargo: 10 } });
    const com = jogarAte(5, { alocacao: { ld_cargo: 8, analytics: 2 } });
    const trilha = (p: PartidaTrad) =>
      respostasDisponiveis(chefaoDoTurno(5)!, p).find((x) => x.resposta.id === "trilha")!.liberada;
    expect(trilha(sem)).toBe(false);
    expect(trilha(com)).toBe(true);
  });

  it("na Auditoria, sem analytics e sem gestão por resultados só resta a força-tarefa", () => {
    const part = jogarAte(7, { alocacao: { contratar: 10 } });
    const livres = respostasDisponiveis(chefaoDoTurno(7)!, part)
      .filter((x) => x.liberada)
      .map((x) => x.resposta.id);
    expect(livres).toEqual(["forcaTarefa"]);
  });

  it("na Auditoria, quem documentou chega com o dossiê e com a gestão por resultados", () => {
    const part = novaPartidaTrad(3);
    for (let t = 1; t <= 7; t++) {
      jogarTurnoTrad(
        part,
        t === 1
          ? { alocacao: { hibrido: 4, analytics: 4, ld_cargo: 2 }, gestaoPorResultados: true }
          : { alocacao: { ld_cargo: 6, analytics: 4 } }
      );
      if (t < 7) fecharTurno(part);
    }
    const livres = respostasDisponiveis(chefaoDoTurno(7)!, part)
      .filter((x) => x.liberada)
      .map((x) => x.resposta.id);
    expect(livres).toEqual(["dossie", "gpr", "forcaTarefa"]);
  });
});

describe("aplicar a resposta", () => {
  it("o dossiê derruba o risco e registra a escolha com explicação", () => {
    const part = jogarAte(7, { alocacao: { ld_cargo: 6, analytics: 4 } });
    part.estado = { ...part.estado, risco: 2 };
    const dossie = chefaoDoTurno(7)!.respostas.find((r) => r.id === "dossie")!;
    aplicarRespostaChefao(part, "auditoria", dossie);
    expect(part.estado.risco).toBe(1);
    expect(part.respostasChefao).toEqual([{ turno: 7, chefaoId: "auditoria", respostaId: "dossie" }]);
    expect(part.explicacoesPorTurno.at(-1)!.some((e) => e.motivo === "chefaoResposta.auditoria.dossie")).toBe(
      true
    );
  });

  it("a resposta que devolve moedas aparece no orçamento do semestre seguinte", () => {
    const part = jogarAte(3, { alocacao: { ld_cargo: 10 } });
    const adiar = chefaoDoTurno(3)!.respostas.find((r) => r.id === "adiar")!;
    const antes = part.orcamento;
    aplicarRespostaChefao(part, "ondaIA", adiar);
    fecharTurno(part);
    expect(part.orcamento).toBeGreaterThan(antes);
  });

  it("uma partida inteira responde a três chefões, um por semestre de chefão", () => {
    const part = novaPartidaTrad(21);
    while (!acabou(part)) {
      jogarTurnoTrad(part, DECISAO_EQUILIBRADA);
      const def = chefaoDoTurno(part.estado.turno);
      if (def) {
        const liberada = respostasDisponiveis(def, part).find((x) => x.liberada)!;
        aplicarRespostaChefao(part, def.id, liberada.resposta);
      }
      fecharTurno(part);
    }
    expect(part.respostasChefao.map((r) => r.turno)).toEqual(TURNOS_CHEFAO);
  });

  it("semestre de chefão não tem evento menor: nunca pede duas escolhas", () => {
    const part = novaPartidaTrad(9);
    while (!acabou(part)) {
      const evento = jogarTurnoTrad(part, DECISAO_EQUILIBRADA);
      const def = chefaoDoTurno(part.estado.turno);
      expect(Boolean(evento) && Boolean(def), `semestre ${part.estado.turno}`).toBe(false);
      fecharTurno(part);
    }
  });
});
