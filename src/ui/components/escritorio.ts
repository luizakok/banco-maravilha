/**
 * O escritório do banco, desenhado em SVG por código. Muda de década a cada
 * fase e reflete o estado do time sem mostrar um número sequer:
 *
 *  - engajamento baixo → mesas vazias e cor lavada
 *  - prontidão alta    → telas de IA acesas
 *  - turnover alto     → caixas de mudança na porta
 */
import { t, tf } from "../../i18n";
import type { Fase } from "../../game/fases";
import { anoDoTurno } from "../../game/fases";
import type { Estado } from "../../model/types";

const SVG = "http://www.w3.org/2000/svg";
const MESAS = 4;

interface Paleta {
  parede: string;
  piso: string;
  mesa: string;
  cadeira: string;
  tela: string;
  acento: string;
}

const PALETAS: Record<Fase, Paleta> = {
  1: { parede: "#2e2746", piso: "#3a3356", mesa: "#6b5a8c", cadeira: "#4a4068", tela: "#1d1b2e", acento: "#e8c87a" },
  2: { parede: "#243156", piso: "#2c3b66", mesa: "#4a6a9c", cadeira: "#39507e", tela: "#161f38", acento: "#7ab8ff" },
  3: { parede: "#1f3b46", piso: "#275059", mesa: "#3f7d8c", cadeira: "#2f5f6b", tela: "#122730", acento: "#6fe0d0" },
  4: { parede: "#2a2050", piso: "#352a66", mesa: "#7a5ac0", cadeira: "#4f3a8e", tela: "#191238", acento: "#b98cff" },
};

const PELE = ["#e8b88a", "#a9765c", "#c99070", "#8a5f48"];

function no(tag: string, attrs: Record<string, string | number>): SVGElement {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

const entre = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Quantas mesas têm gente: engajamento 30 esvazia a sala, 90 lota. */
export function mesasOcupadas(engajamento: number): number {
  return entre(Math.round((engajamento - 30) / 15), 0, MESAS);
}

/** Quantas caixas de mudança estão na porta: 8% de turnover não deixa nenhuma. */
export function caixasNaPorta(turnover: number): number {
  return entre(Math.round((turnover - 8) / 4), 0, 3);
}

/** Quantas das telas ocupadas estão rodando IA. */
export function telasDeIA(prontidao: number, ocupadas: number): number {
  return entre(Math.round((prontidao / 100) * ocupadas), 0, ocupadas);
}

const ROUPAS = ["#4a6a9c", "#8c3f6e", "#3f6e4a", "#6b5a8c"];

function pessoa(g: SVGElement, x: number, i: number, p: Paleta) {
  // encosto da cadeira atrás de quem está sentado
  g.append(no("rect", { x: x + 1, y: 22, width: 8, height: 9, rx: 1.5, fill: p.cadeira }));
  g.append(no("rect", { x: x + 1.8, y: 24.5, width: 6.4, height: 6, rx: 2, fill: ROUPAS[i % ROUPAS.length] }));
  g.append(no("circle", { cx: x + 5, cy: 21.4, r: 3, fill: PELE[i % PELE.length] }));
  g.append(no("path", { d: `M${x + 2} 21.4 a3 3 0 0 1 6 0 z`, fill: "#2a2438" }));
}

function cadeiraVazia(g: SVGElement, x: number, p: Paleta) {
  // encosto virado de lado: a cadeira vazia tem que parecer abandonada, não arrumada
  g.append(no("rect", { x: x + 6.6, y: 22, width: 2.4, height: 9, rx: 1, fill: p.cadeira, opacity: 0.65 }));
  g.append(no("rect", { x: x + 1.6, y: 27.2, width: 7, height: 1.8, rx: 0.8, fill: p.cadeira, opacity: 0.65 }));
}

function estacao(g: SVGElement, x: number, i: number, fase: Fase, p: Paleta, ocupada: boolean, comIA: boolean) {
  if (fase === 1) {
    // baias: cada um no seu quadrado
    g.append(no("rect", { x: x - 3, y: 16, width: 1.6, height: 21, fill: p.cadeira }));
    g.append(no("rect", { x: x + 21.4, y: 16, width: 1.6, height: 21, fill: p.cadeira }));
  }

  if (ocupada) pessoa(g, x, i, p);
  else cadeiraVazia(g, x, p);

  // monitor na metade direita da bancada
  g.append(no("rect", { x: x + 11, y: 21, width: 8, height: 6, rx: fase === 4 ? 1.5 : 0.4, fill: p.tela, stroke: "#14162a", "stroke-width": 0.7 }));
  if (comIA) {
    g.append(no("rect", { x: x + 12, y: 22.2, width: 6, height: 0.9, fill: p.acento }));
    g.append(no("rect", { x: x + 12, y: 23.8, width: 3.8, height: 0.9, fill: p.acento, opacity: 0.8 }));
    g.append(no("rect", { x: x + 12, y: 25.4, width: 5, height: 0.9, fill: p.acento, opacity: 0.6 }));
    // faísca em cima da tela: o copiloto está ligado
    g.append(no("circle", { cx: x + 20, cy: 19.6, r: 1.2, fill: p.acento }));
    g.append(no("circle", { cx: x + 21.6, cy: 21.8, r: 0.7, fill: p.acento, opacity: 0.7 }));
  } else if (ocupada) {
    g.append(no("rect", { x: x + 12, y: 22.2, width: 4.4, height: 0.9, fill: p.cadeira }));
    g.append(no("rect", { x: x + 12, y: 23.8, width: 2.8, height: 0.9, fill: p.cadeira }));
  }
  g.append(no("rect", { x: x + 14, y: 27, width: 2, height: 2, fill: p.cadeira }));

  g.append(no("rect", { x, y: 29, width: 20, height: 2, rx: fase === 4 ? 1 : 0, fill: p.mesa }));
  if (fase !== 2) {
    // no open space a bancada é corrida e dispensa pé a pé
    g.append(no("rect", { x: x + 1.5, y: 31, width: 1.5, height: 6, fill: p.mesa, opacity: 0.8 }));
    g.append(no("rect", { x: x + 17, y: 31, width: 1.5, height: 6, fill: p.mesa, opacity: 0.8 }));
  }
}

function parede(g: SVGElement, fase: Fase, p: Paleta) {
  g.append(no("rect", { x: 0, y: 0, width: 160, height: 37, fill: p.parede }));
  g.append(no("rect", { x: 0, y: 37, width: 160, height: 7, fill: p.piso }));

  if (fase === 1) {
    // janelinhas e um quadro torto: a década dos armários de aço
    for (const x of [44, 72, 100]) {
      g.append(no("rect", { x, y: 5, width: 14, height: 9, fill: "#141a2e", stroke: p.cadeira, "stroke-width": 0.8 }));
    }
    g.append(no("rect", { x: 126, y: 5, width: 10, height: 8, fill: p.cadeira }));
  } else if (fase === 2) {
    // vidro de ponta a ponta
    g.append(no("rect", { x: 36, y: 3, width: 104, height: 12, fill: "#141f38", stroke: p.cadeira, "stroke-width": 0.8 }));
    for (const x of [62, 88, 114]) g.append(no("rect", { x, y: 3, width: 0.8, height: 12, fill: p.cadeira }));
  } else if (fase === 3) {
    // uma tela de chamada: metade do time está em casa
    g.append(no("rect", { x: 56, y: 3, width: 48, height: 13, rx: 1.5, fill: "#122730", stroke: p.acento, "stroke-width": 0.8 }));
    for (let i = 0; i < 4; i++) {
      const bx = 59 + i * 11.5;
      g.append(no("rect", { x: bx, y: 5.5, width: 9, height: 8, fill: p.cadeira }));
      g.append(no("circle", { cx: bx + 4.5, cy: 8.6, r: 1.6, fill: PELE[i % PELE.length] }));
    }
  } else {
    // 2030: a parede virou painel
    g.append(no("rect", { x: 30, y: 3, width: 116, height: 12, rx: 3, fill: "#1a1238", stroke: p.acento, "stroke-width": 0.8 }));
    for (let i = 0; i < 9; i++) {
      g.append(no("rect", { x: 36 + i * 12, y: 13 - (2 + ((i * 3) % 8)), width: 6, height: 2 + ((i * 3) % 8), fill: p.acento, opacity: 0.75 }));
    }
  }
}

function porta(g: SVGElement, p: Paleta, caixas: number) {
  g.append(no("rect", { x: 5, y: 13, width: 15, height: 24, fill: "#141628", stroke: p.cadeira, "stroke-width": 1 }));
  g.append(no("circle", { cx: 17, cy: 26, r: 0.9, fill: p.acento }));
  const posicoes = [
    [22, 31],
    [22, 25.6],
    [29, 31],
  ];
  for (let i = 0; i < caixas; i++) {
    const [x, y] = posicoes[i];
    g.append(no("rect", { x, y, width: 6.4, height: 6, fill: "#9c7b4e", stroke: "#14162a", "stroke-width": 0.6 }));
    g.append(no("rect", { x, y: y + 2.4, width: 6.4, height: 1, fill: "#14162a", opacity: 0.5 }));
  }
}

function planta(g: SVGElement, x: number, p: Paleta) {
  g.append(no("rect", { x, y: 31, width: 7, height: 6, fill: "#7a5a3c" }));
  g.append(no("circle", { cx: x + 3.5, cy: 28.5, r: 3.6, fill: "#4f8f5f" }));
  g.append(no("circle", { cx: x + 1, cy: 30, r: 2.4, fill: "#3f7a4e" }));
  g.append(no("circle", { cx: x + 6, cy: 30, r: 2.4, fill: "#5fa06c" }));
  void p;
}

/**
 * Cena do escritório para o estado atual. É decorativa, mas carrega informação:
 * por isso vai com role="img" e uma descrição em palavras, não em números.
 */
export function cenaEscritorio(e: Estado, fase: Fase): HTMLElement {
  const p = PALETAS[fase];
  const ocupadas = mesasOcupadas(e.engajamento);
  const caixas = caixasNaPorta(e.turnover);
  const comIA = telasDeIA(e.prontidao, ocupadas);

  const box = document.createElement("div");
  box.className = "escritorio";

  const s = document.createElementNS(SVG, "svg");
  s.setAttribute("viewBox", "0 0 160 44");
  s.setAttribute("class", "escritorio-svg");
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", descricao(e, fase, ocupadas, caixas, comIA));
  // sala vazia também fica sem cor: o desânimo tem que dar para ver
  s.style.filter = `saturate(${(0.4 + (ocupadas / MESAS) * 0.8).toFixed(2)})`;

  parede(s, fase, p);
  porta(s, p, caixas);
  for (let i = 0; i < MESAS; i++) {
    estacao(s, 40 + i * 26, i, fase, p, i < ocupadas, i < comIA);
  }
  planta(s, 148, p);

  box.append(s);
  return box;
}

function descricao(e: Estado, fase: Fase, ocupadas: number, caixas: number, comIA: number): string {
  const partes = [
    tf("escritorio.sala", { ano: String(anoDoTurno(e.turno)), estilo: t(`escritorio.estilo${fase}`) }),
    tf("escritorio.mesas", { ocupadas: String(ocupadas), total: String(MESAS) }),
  ];
  if (comIA > 0) partes.push(comIA === 1 ? t("escritorio.telasIA1") : tf("escritorio.telasIA", { n: String(comIA) }));
  if (caixas > 0) partes.push(caixas === 1 ? t("escritorio.caixas1") : tf("escritorio.caixas", { n: String(caixas) }));
  return partes.join(" ");
}
