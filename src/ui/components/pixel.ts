/**
 * Arte pixel 100% gerada por código (nenhum asset externo).
 * Cada retrato é uma matriz 12x12 de índices numa paleta.
 */

type Paleta = Record<string, string>;

const BASE: Paleta = {
  ".": "transparent",
  "#": "#1a1c33", // contorno
  p: "#e8b88a", // pele
  P: "#a9765c", // pele escura
  b: "#f0eef8", // branco (olhos/camisa)
  o: "#23253f", // pupila
};

// 12 colunas x 12 linhas; letras extras definidas por retrato
const RETRATOS: Record<string, { paleta: Paleta; linhas: string[] }> = {
  ceo: {
    paleta: { ...BASE, c: "#8a8fa8", t: "#2d3561", g: "#ffd24a" },
    linhas: [
      "....####....",
      "...#cccc#...",
      "..#cccccc#..",
      "..#pppppp#..",
      "..#pbopbo#..",
      "..#pppppp#..",
      "..#p####p#..",
      "...#pppp#...",
      "..##tttt##..",
      ".#ttgttgtt#.",
      "#tttt##tttt#",
      "#ttt#..#ttt#",
    ],
  },
  cfo: {
    paleta: { ...BASE, c: "#5d4a66", t: "#3a3f6e", v: "#6fe08a" },
    linhas: [
      "....####....",
      "...#cccc#...",
      "..#cccccc#..",
      "..#PPPPPP#..",
      ".##Pbo#bo##.",
      ".##PPPPPP##.",
      "..#P####P#..",
      "...#PPPP#...",
      "..##tttt##..",
      ".#tvvtvvtt#.",
      "#tttt##tttt#",
      "#ttt#..#ttt#",
    ],
  },
  cto: {
    paleta: { ...BASE, c: "#d8773a", t: "#24564f", z: "#7ab8ff" },
    linhas: [
      "....####....",
      "...#cccc#...",
      "..#cccccc#..",
      "..#pppppp#..",
      ".#zzzzzzzz#.",
      "..#pbopbo#..",
      "..#pppppp#..",
      "...#pppp#...",
      "..##tttt##..",
      ".#tttttttt#.",
      "#tttt##tttt#",
      "#ttt#..#ttt#",
    ],
  },
  voz: {
    paleta: { ...BASE, c: "#3c2f2a", t: "#8c3f6e", f: "#ffd24a" },
    linhas: [
      "...######...",
      "..#cccccc#..",
      ".#cccccccc#.",
      ".#cPPPPPPc#.",
      ".#cPboPboc#.",
      ".#cPPPPPPc#.",
      ".#cP####Pc#.",
      "..#cPPPPc#..",
      "..##tttt##..",
      ".#tftttft#..",
      "#tttt##tttt#",
      "#ttt#..#ttt#",
    ],
  },
};

const cache = new Map<string, string>();

/** Devolve um data: URL SVG com o retrato pixelado do conselheiro. */
export function retratoUrl(conselheiro: string): string {
  const def = RETRATOS[conselheiro];
  if (!def) return "";
  const memo = cache.get(conselheiro);
  if (memo) return memo;
  let rects = "";
  def.linhas.forEach((linha, y) => {
    [...linha].forEach((ch, x) => {
      const cor = def.paleta[ch];
      if (!cor || cor === "transparent") return;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${cor}"/>`;
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" shape-rendering="crispEdges">${rects}</svg>`;
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  cache.set(conselheiro, url);
  return url;
}

/** Cria o <img> do retrato (decorativo; o nome do falante está ao lado). */
export function retrato(conselheiro: string): HTMLImageElement | null {
  const url = retratoUrl(conselheiro);
  if (!url) return null;
  const img = document.createElement("img");
  img.src = url;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.className = "retrato";
  return img;
}
