import { describe, expect, it } from "vitest";
import {
  CATALOGO,
  custoTotal,
  copilotosDaDecisao,
  gapsDoTurno,
  montarDecisao,
  opcaoPorId,
  opcoesDoGap,
  politicasDisponiveis,
  recorrenteTotal,
  type Escolhas,
} from "../src/game/gaps";
import { CAMPOS_PREVISTOS, confiancaDe, preverTurno } from "../src/game/previsao";
import {
  fecharTurno,
  novaPartidaTrad,
  recorrenteAtivo,
  registrarEscolhas,
  TOTAL_TURNOS,
} from "../src/game/tradicional";
import { estadoInicial, p } from "../src/model/simulate";

describe("catálogo de gaps", () => {
  it("todo turno tem de 2 a 3 gaps conhecidos", () => {
    for (let turno = 1; turno <= TOTAL_TURNOS; turno++) {
      const gaps = gapsDoTurno(turno);
      expect(gaps.length).toBeGreaterThanOrEqual(2);
      expect(gaps.length).toBeLessThanOrEqual(3);
    }
  });

  it("toda opção tem custo inteiro, id resolvível e etiquetas coerentes", () => {
    for (const gap of CATALOGO) {
      const opcoes = opcoesDoGap(gap);
      expect(opcoes.length).toBeGreaterThan(0);
      for (const o of opcoes) {
        expect(Number.isInteger(o.custo)).toBe(true);
        expect(Number.isInteger(o.recorrente)).toBe(true);
        expect(o.custo).toBeGreaterThan(0);
        expect(opcaoPorId(o.id)?.id).toBe(o.id);
        // ⚡ e ⏳ são excludentes; lag 0 é sempre ⚡ e lag >= 2 é sempre ⏳
        expect(o.etiquetas.includes("rapido") && o.etiquetas.includes("lento")).toBe(false);
        expect(o.etiquetas.includes("rapido")).toBe(o.lag === 0);
        expect(o.etiquetas.includes("lento")).toBe(o.lag >= 2);
      }
    }
  });

  it("copiloto vem em famílias inteiras e automação em passos do modelo", () => {
    const passo = p("ia.moedasPorFamiliaAuto");
    for (const gap of CATALOGO) {
      for (const o of opcoesDoGap(gap)) {
        if (o.alavanca === "ia_copiloto") expect(Number.isInteger(o.esforco)).toBe(true);
        if (o.alavanca === "ia_auto") expect(o.esforco % passo).toBe(0);
      }
    }
  });

  it("dá para fechar todos os gaps do turno com o orçamento de um semestre", () => {
    const politicas = politicasDisponiveis(false);
    for (let turno = 1; turno <= TOTAL_TURNOS; turno++) {
      const esc: Escolhas = { porGap: {}, politicas: [] };
      for (const gap of gapsDoTurno(turno)) {
        const maisBarata = opcoesDoGap(gap).reduce((a, b) => (b.custo < a.custo ? b : a));
        esc.porGap[gap.id] = maisBarata.id;
      }
      expect(custoTotal(esc, politicas)).toBeLessThanOrEqual(p("orcamentoPorTurno"));
    }
  });

  it("a opção mais cara de um gap não estoura sozinha o orçamento", () => {
    for (const gap of CATALOGO) {
      const maisCara = opcoesDoGap(gap).reduce((a, b) => (b.custo > a.custo ? b : a));
      expect(maisCara.custo).toBeLessThan(p("orcamentoPorTurno"));
    }
  });

  it("build não tem custo recorrente; buy, borrow e bot têm", () => {
    for (const gap of CATALOGO) {
      for (const o of opcoesDoGap(gap)) {
        if (o.abordagem === "build") expect(o.recorrente).toBe(0);
        else expect(o.recorrente).toBeGreaterThan(0);
      }
    }
  });

  it("montarDecisao soma esforços e renova os copilotos já pagos", () => {
    const gap = CATALOGO.find((g) => g.id === "atendimentoIA")!;
    const bot = opcoesDoGap(gap).find((o) => o.abordagem === "bot")!;
    const esc: Escolhas = { porGap: { [gap.id]: bot.id }, politicas: ["gpr"] };
    const politicas = politicasDisponiveis(false);
    const d = montarDecisao(esc, politicas, 3);
    expect(d.alocacao.ia_copiloto).toBe(bot.esforco + 3);
    expect(d.gestaoPorResultados).toBe(true);
    expect(copilotosDaDecisao(esc)).toBe(bot.esforco);
    expect(custoTotal(esc, politicas)).toBe(bot.custo + politicas.find((x) => x.id === "gpr")!.custo);
    expect(recorrenteTotal(esc)).toBe(bot.recorrente);
  });
});

describe("previsão com incerteza", () => {
  it("as faixas de confiança seguem o analytics acumulado", () => {
    expect(confiancaDe(0)).toBe("cega");
    expect(confiancaDe(p("previsao.analyticsParaDirecao"))).toBe("direcao");
    expect(confiancaDe(p("previsao.analyticsParaPrecisao"))).toBe("precisa");
  });

  it("sem analytics a previsão é toda '?'", () => {
    const linhas = preverTurno(estadoInicial(), { alocacao: {} });
    expect(linhas).toHaveLength(CAMPOS_PREVISTOS.length);
    for (const l of linhas) {
      expect(l.direcao).toBeNull();
      expect(l.faixa).toBeNull();
    }
  });

  it("com analytics preciso a faixa é mais estreita que com direção", () => {
    const base = estadoInicial();
    const largura = (acc: number) => {
      const e = { ...base, analyticsAcumulado: acc };
      const l = preverTurno(e, { alocacao: { contratar: 2 } }).find((x) => x.campo === "custoPessoal")!;
      return l.faixa![1] - l.faixa![0];
    };
    expect(largura(p("previsao.analyticsParaPrecisao"))).toBeLessThan(
      largura(p("previsao.analyticsParaDirecao"))
    );
  });

  it("prever não altera o estado da partida", () => {
    const part = novaPartidaTrad(5);
    const antes = JSON.stringify(part.estado);
    preverTurno(part.estado, { alocacao: { ld_cargo: 3, contratar: 2 } });
    expect(JSON.stringify(part.estado)).toBe(antes);
  });
});

describe("compromissos recorrentes", () => {
  it("buy cobra todo semestre e borrow expira", () => {
    const part = novaPartidaTrad(11);
    const gap = CATALOGO.find((g) => g.id === "atendimentoIA")!;
    const buy = opcoesDoGap(gap).find((o) => o.abordagem === "buy")!;
    const borrow = opcoesDoGap(gap).find((o) => o.abordagem === "borrow")!;
    registrarEscolhas(part, { porGap: { a: buy.id, b: borrow.id }, politicas: [] });
    expect(recorrenteAtivo(part)).toBe(buy.recorrente + borrow.recorrente);

    const vistos: number[] = [];
    for (let i = 0; i < p("economia.duracaoRecorrenteBorrow") + 1; i++) {
      fecharTurno(part);
      vistos.push(recorrenteAtivo(part));
    }
    // o borrow sai da conta; o buy (folha) fica
    expect(vistos.at(-1)).toBe(buy.recorrente);
  });

  it("o orçamento do semestre nunca cai abaixo do teto de recorrência", () => {
    const part = novaPartidaTrad(3);
    const caras = CATALOGO.flatMap((g) => opcoesDoGap(g)).filter((o) => o.recorrente > 0);
    for (const [i, o] of caras.entries()) registrarEscolhas(part, { porGap: { [`g${i}`]: o.id }, politicas: [] });
    expect(recorrenteAtivo(part)).toBe(p("economia.tetoRecorrente"));
    fecharTurno(part);
    expect(part.orcamento).toBe(p("orcamentoPorTurno") - p("economia.tetoRecorrente"));
    expect(part.orcamento).toBeGreaterThan(0);
  });
});
