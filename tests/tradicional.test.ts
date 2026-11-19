import { describe, expect, it } from "vitest";
import {
  acabou,
  aplicarEvento,
  DECISAO_EQUILIBRADA,
  eSe,
  EVENTOS,
  fecharTurno,
  jogarTurnoTrad,
  novaPartidaTrad,
  relacoesFortes,
  revelarIndicador,
  resumoTrad,
  TOTAL_TURNOS,
  TURNOS_CHEFAO,
  type PartidaTrad,
} from "../src/game/tradicional";
import { construirUrlFeedback, resumirDecisoes } from "../src/feedback";
import { FEEDBACK_FIELDS } from "../src/config";
import { estadoInicial, p } from "../src/model/simulate";
import { composicaoValor, valorDoBanco } from "../src/model/scoring";
import type { Decisao } from "../src/model/types";

function jogarPartida(seed: number, decisao: Decisao = DECISAO_EQUILIBRADA): PartidaTrad {
  const part = novaPartidaTrad(seed);
  while (!acabou(part)) {
    const ev = jogarTurnoTrad(part, decisao);
    if (ev) aplicarEvento(part, ev, 0);
    fecharTurno(part);
  }
  return part;
}

describe("modo Tradicional", () => {
  it("agenda eventos apenas em turnos sem chefão", () => {
    const part = novaPartidaTrad(123);
    for (const turno of part.agendaEventos.keys()) {
      expect(TURNOS_CHEFAO).not.toContain(turno);
      expect(turno).toBeGreaterThanOrEqual(1);
      expect(turno).toBeLessThanOrEqual(TOTAL_TURNOS);
    }
    expect(part.agendaEventos.size).toBe(TOTAL_TURNOS - TURNOS_CHEFAO.length);
  });

  it("a agenda de eventos é determinística para a mesma seed", () => {
    const a = novaPartidaTrad(77);
    const b = novaPartidaTrad(77);
    expect([...a.agendaEventos.entries()].map(([t, e]) => [t, e.id])).toEqual(
      [...b.agendaEventos.entries()].map(([t, e]) => [t, e.id])
    );
  });

  it("eSe com a mesma decisão reproduz o resultado da partida (determinismo do replay)", () => {
    const part = jogarPartida(42); // sem compras de inteligência
    const original = resumoTrad(part).valor;
    expect(eSe(part, 3, part.decisoes[2])).toBeCloseTo(original, 6);
  });

  it("eSe com decisão diferente devolve um valor (e não quebra)", () => {
    const part = jogarPartida(42, { alocacao: { ia_auto: 10 } });
    const alt = eSe(part, 1, DECISAO_EQUILIBRADA);
    expect(Number.isFinite(alt)).toBe(true);
  });

  it("revelar indicador cobra orçamento e dura 2 turnos", () => {
    const part = novaPartidaTrad(7);
    const antes = part.orcamento;
    const v = revelarIndicador(part, "engajamento");
    expect(v).not.toBeNull();
    expect(part.orcamento).toBe(antes - p("analytics.custoRevelarIndicador"));
    expect(part.reveladas.engajamento).toBe(2);
    jogarTurnoTrad(part, DECISAO_EQUILIBRADA);
    fecharTurno(part);
    expect(part.reveladas.engajamento).toBe(1);
    jogarTurnoTrad(part, DECISAO_EQUILIBRADA);
    fecharTurno(part);
    expect(part.reveladas.engajamento).toBe(0);
  });

  it("todas as opções de todos os eventos mantêm o estado dentro dos limites", () => {
    for (const ev of EVENTOS) {
      for (const opcao of [0, 1] as const) {
        const part = novaPartidaTrad(1);
        part.estado = estadoInicial();
        part.explicacoesPorTurno.push([]);
        aplicarEvento(part, ev, opcao);
        const e = part.estado;
        expect(e.engajamento).toBeGreaterThanOrEqual(0);
        expect(e.engajamento).toBeLessThanOrEqual(100);
        expect(e.prontidao).toBeGreaterThanOrEqual(0);
        expect(e.prontidao).toBeLessThanOrEqual(100);
        expect(e.turnover).toBeGreaterThanOrEqual(2);
        expect(e.turnover).toBeLessThanOrEqual(40);
        expect(e.receita).toBeGreaterThanOrEqual(20);
        expect(e.custoPessoal).toBeGreaterThanOrEqual(20);
        expect([0, 1, 2]).toContain(e.risco);
      }
    }
  });

  it("orçamento do turno nunca fica negativo após eventos", () => {
    const part = jogarPartida(99);
    expect(part.orcamento).toBeGreaterThanOrEqual(0);
  });
});

describe("feedback", () => {
  const dados = {
    modo: "tradicional" as const,
    idioma: "pt",
    final: "arquiteto",
    valorBanco: 87.3,
    notas: { curto: "E", medio: "A", longo: "A" },
    decisoesChave: "T3 Δ-5,2 chefao.ondaIA.nps; T5 Δ+3,1 ia.copilotoProdutividade; T7 Δ-2,0 chefao.auditoria.receita",
    decisoes: Array.from({ length: 8 }, () => ({
      alocacao: { ld_cargo: 3, interno: 3, ia_copiloto: 4 },
      gestaoPorResultados: true,
    })),
    idPartida: "deadbeef",
  };

  it("resumo compacto das decisões", () => {
    expect(resumirDecisoes([{ alocacao: { ld_cargo: 2, ia_copiloto: 1 } }])).toBe("T1:LD2,CO1");
  });

  it("URL fica abaixo de 2000 caracteres mesmo com dados longos", () => {
    // simula a URL com um formulário configurado
    const params = new URLSearchParams({ usp: "pp_url" });
    const base = "https://docs.google.com/forms/d/e/1FAIpQLSexemplo-com-id-bem-comprido-1234567890/viewform";
    const url = construirUrlFeedback(dados);
    // sem URL configurada, deve devolver null (botão escondido)
    expect(url).toBeNull();
    // com URL: monta na mão e confere o tamanho usando os mesmos campos
    for (const [campo, entry] of Object.entries(FEEDBACK_FIELDS)) params.set(entry, String(campo).repeat(5));
    expect(`${base}?${params.toString()}`.length).toBeLessThan(2000);
  });
});

describe("relações causais fortes do semestre", () => {
  it("agrupa por motivo e ordena pelo impacto relativo ao mercado do jogo", () => {
    // +3 de NPS (média 25) pesa mais que +3 de engajamento (média 60)
    const fortes = relacoesFortes([
      { motivo: "a", campo: "engajamento", delta: 3 },
      { motivo: "b", campo: "nps", delta: 3 },
    ]);
    expect(fortes.map((r) => r.motivo)).toEqual(["b", "a"]);
  });

  it("soma os deltas do mesmo motivo e campo, e descarta ruído", () => {
    const fortes = relacoesFortes([
      { motivo: "a", campo: "nps", delta: 2 },
      { motivo: "a", campo: "nps", delta: 1 },
      { motivo: "a", campo: "receita", delta: 0.01 },
    ]);
    expect(fortes).toHaveLength(1);
    expect(fortes[0].campos).toEqual([{ campo: "nps", delta: 3 }]);
  });

  it("devolve no máximo o número pedido e nada quando não houve efeito", () => {
    const exps = ["a", "b", "c"].map((motivo) => ({ motivo, campo: "nps" as const, delta: 2 }));
    expect(relacoesFortes(exps)).toHaveLength(2);
    expect(relacoesFortes(exps, 1)).toHaveLength(1);
    expect(relacoesFortes([])).toEqual([]);
  });
});

describe("composição do Valor do Banco", () => {
  it("as quatro partes somam exatamente o Valor do Banco", () => {
    const part = novaPartidaTrad(42);
    for (let i = 0; i < 3; i++) {
      jogarTurnoTrad(part, DECISAO_EQUILIBRADA);
      fecharTurno(part);
    }
    for (const e of part.historico) {
      const soma = composicaoValor(e).reduce((s, x) => s + x.pontos, 0);
      expect(soma).toBeCloseTo(valorDoBanco(e), 10);
    }
  });

  it("tem uma parte para receita, eficiência, NPS e risco", () => {
    expect(composicaoValor(estadoInicial()).map((x) => x.parte)).toEqual([
      "receita",
      "eficiencia",
      "nps",
      "risco",
    ]);
  });
});
