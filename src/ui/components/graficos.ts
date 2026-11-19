/**
 * Gráficos do debrief e do resultado do semestre, desenhados em SVG por código.
 * Nenhuma biblioteca: são poucas linhas e precisam combinar com a arte pixel.
 */
import { t, tf } from "../../i18n";
import { composicaoValor, valorDoBanco, type ParteValor } from "../../model/scoring";
import type { Estado } from "../../model/types";
import { el } from "../dom";

const SVG = "http://www.w3.org/2000/svg";

const CAMPOS_LINHA = [
  "engajamento",
  "turnover",
  "prontidao",
  "custoPessoal",
  "receita",
  "eficiencia",
  "nps",
] as const;
type CampoLinha = (typeof CAMPOS_LINHA)[number];

const CORES: Record<ParteValor, string> = {
  receita: "#6fe08a",
  eficiencia: "#7ab8ff",
  nps: "#ffd24a",
  risco: "#b98cff",
};

function svg(largura: number, altura: number, classe: string): SVGSVGElement {
  const s = document.createElementNS(SVG, "svg");
  s.setAttribute("viewBox", `0 0 ${largura} ${altura}`);
  s.setAttribute("preserveAspectRatio", "none");
  s.setAttribute("class", classe);
  s.setAttribute("aria-hidden", "true");
  return s;
}

function no(tag: string, attrs: Record<string, string | number>): SVGElement {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

const fmt = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1)).replace(".", ",");

/**
 * Uma linha por indicador ao longo dos semestres, com um ponto marcando
 * cada semestre em que o jogador decidiu algo (title = a decisão principal).
 */
export function dashboardLinhas(
  historico: Estado[],
  marcasPorTurno: Map<number, string> = new Map(),
  ocultos: readonly string[] = []
): HTMLElement {
  const box = el("div", "dashboard");
  const L = 100;
  const A = 36;
  for (const campo of CAMPOS_LINHA) {
    // a névoa vale aqui também: o histórico não pode entregar o que o jogador não comprou
    if (ocultos.includes(campo)) {
      const escondido = el("div", "dashboard-item oculto");
      const topoOculto = el("div", "dashboard-topo");
      topoOculto.append(el("span", "rotulo", t(`indicadores.${campo}`)), el("span", "delta-neutro", "?"));
      escondido.append(topoOculto, el("div", "sparkline-vazia"));
      box.append(escondido);
      continue;
    }
    const serie = historico.map((e) => e[campo as keyof Estado] as number);
    const min = Math.min(...serie);
    const max = Math.max(...serie);
    const faixa = max - min;
    const x = (i: number) => (serie.length === 1 ? L / 2 : (i / (serie.length - 1)) * L);
    // linha reta (indicador parado) fica no meio da caixa, não colada embaixo
    const y = (v: number) => (faixa === 0 ? A / 2 : A - 3 - ((v - min) / faixa) * (A - 6));

    const card = el("div", "dashboard-item");
    const topo = el("div", "dashboard-topo");
    topo.append(el("span", "rotulo", t(`indicadores.${campo}`)));
    const delta = serie[serie.length - 1] - serie[0];
    const parado = Math.abs(delta) < 0.05;
    const sobeEhBom = campo === "engajamento" || campo === "prontidao" || campo === "receita" || campo === "nps";
    const bom = sobeEhBom ? delta > 0 : delta < 0;
    const cor = parado ? "var(--muted)" : bom ? "var(--green)" : "var(--red)";
    topo.append(
      el(
        "span",
        parado ? "delta-neutro" : bom ? "delta-pos" : "delta-neg",
        parado
          ? `${fmt(serie[serie.length - 1])} (=)`
          : `${fmt(serie[serie.length - 1])} (${delta >= 0 ? "+" : "−"}${fmt(Math.abs(delta))})`
      )
    );
    card.append(topo);

    const g = svg(L, A, "sparkline");
    g.setAttribute("preserveAspectRatio", "none");
    g.append(
      no("polyline", {
        points: serie.map((v, i) => `${x(i)},${y(v)}`).join(" "),
        fill: "none",
        stroke: cor,
        "stroke-width": 1.5,
        "vector-effect": "non-scaling-stroke",
      })
    );
    for (const [turno, rotulo] of marcasPorTurno) {
      if (turno >= serie.length) continue;
      const ponto = no("circle", { cx: x(turno), cy: y(serie[turno]), r: 2, fill: "var(--gold)" });
      const titulo = document.createElementNS(SVG, "title");
      titulo.textContent = `${t("tradicional.semestre")} ${turno}: ${rotulo}`;
      ponto.append(titulo);
      g.append(ponto);
    }
    card.append(g);
    box.append(card);
  }
  return box;
}

/** Barra de composição do Valor do Banco: quanto vem de receita, eficiência, NPS e risco. */
export function barraValorDoBanco(e: Estado, aoLadoDoTitulo = true): HTMLElement {
  const box = el("div", "valor-composicao");
  const partes = composicaoValor(e);
  const total = valorDoBanco(e);

  const topo = el("div", "valor-topo");
  if (aoLadoDoTitulo) {
    topo.append(el("span", "valor-rotulo", t("resultado.valorBanco")));
    topo.append(el("span", "valor-numero", total.toFixed(0)));
  }
  const ajuda = el("p", "indicador-ajuda");
  ajuda.hidden = true;
  ajuda.textContent = t("resultado.valorBancoAjuda");
  const info = el("button", "btn-info", "i");
  info.type = "button";
  info.setAttribute("aria-expanded", "false");
  info.setAttribute("aria-label", tf("indicadores.ajudaSobre", { nome: t("resultado.valorBanco") }));
  info.addEventListener("click", () => {
    ajuda.hidden = !ajuda.hidden;
    info.setAttribute("aria-expanded", String(!ajuda.hidden));
  });
  topo.append(info);
  box.append(topo);

  const barra = el("div", "valor-barra");
  for (const { parte, pontos } of partes) {
    const pedaco = el("div", "valor-pedaco");
    pedaco.style.width = `${(pontos / Math.max(total, 1)) * 100}%`;
    pedaco.style.background = CORES[parte];
    pedaco.title = `${t(`valorPartes.${parte}`)}: ${pontos.toFixed(0)}`;
    barra.append(pedaco);
  }
  box.append(barra);

  const legenda = el("div", "valor-legenda");
  for (const { parte, pontos } of partes) {
    const item = el("span", "valor-legenda-item");
    const cor = el("span", "valor-ponto");
    cor.style.background = CORES[parte];
    item.append(cor, document.createTextNode(`${t(`valorPartes.${parte}`)} ${pontos.toFixed(0)}`));
    legenda.append(item);
  }
  box.append(legenda, ajuda);
  return box;
}
