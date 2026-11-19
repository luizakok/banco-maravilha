/**
 * Arte pixel 100% gerada por código (nenhum asset externo).
 * Cada sprite é uma matriz quadrada de caracteres indexando uma paleta.
 */

type Paleta = Record<string, string>;
interface Sprite {
  paleta: Paleta;
  linhas: string[];
}

const BASE: Paleta = {
  ".": "transparent",
  "#": "#1a1c33", // contorno
  p: "#e8b88a", // pele
  P: "#a9765c", // pele escura
  b: "#f0eef8", // branco (olhos/camisa)
  o: "#23253f", // pupila
};

// Cores de interface reaproveitadas pelos ícones
const UI: Paleta = {
  ".": "transparent",
  "#": "#1a1c33",
  a: "#ffd24a", // âmbar
  z: "#7ab8ff", // azul
  v: "#6fe08a", // verde
  r: "#ff7a7a", // vermelho
  c: "#8a8fa8", // cinza
  b: "#f0eef8",
  m: "#b98cff", // roxo
};

// 12x12
const RETRATOS: Record<string, Sprite> = {
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
  diretora: {
    paleta: { ...BASE, c: "#6b3f8f", t: "#2a3f7a", g: "#ffd24a" },
    linhas: [
      "...######...",
      "..#cccccc#..",
      ".#cccccccc#.",
      ".#cppppppc#.",
      ".#cpbopboc#.",
      ".#cppppppc#.",
      ".#cp####pc#.",
      "..#cppppc#..",
      "..##tttt##..",
      ".#tgttttgt#.",
      "#tttt##tttt#",
      "#ttt#..#ttt#",
    ],
  },
  diretor: {
    paleta: { ...BASE, c: "#3f3a66", t: "#2a3f7a", g: "#ffd24a" },
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
};

// 16x16 — as quatro personas do final
const PERSONAS: Record<string, Sprite> = {
  // Capacete de bombeiro e faixa refletiva: quem passou a partida apagando incêndio.
  bombeiro: {
    paleta: { ...BASE, r: "#e04a4a", a: "#ffd24a", t: "#2b2f52" },
    linhas: [
      "................",
      "....########....",
      "...#rrrrrrrr#...",
      "..#rrrr##rrrr#..",
      "..#rrr#aa#rrr#..",
      ".##############.",
      "....#pppppp#....",
      "....#pbopbo#....",
      "....#pppppp#....",
      "....#p####p#....",
      ".....#pppp#.....",
      "...##tttttt##...",
      "..#ttaattaatt#..",
      "..#tttttttttt#..",
      "..#tttt##tttt#..",
      "..####....####..",
    ],
  },
  // Chapéu de palha e uma muda nas mãos: cuidou das pessoas, esqueceu a receita.
  jardineiro: {
    paleta: { ...BASE, a: "#e8c87a", v: "#6fe08a", t: "#3a5a3f" },
    linhas: [
      "................",
      ".....######.....",
      "....#aaaaaa#....",
      "..##aaaaaaaa##..",
      ".#aaaaaaaaaaaa#.",
      "..############..",
      "....#pppppp#....",
      "....#pbopbo#....",
      "....#pppppp#....",
      "....#p####p#....",
      ".....#pppp#.....",
      "...##tttttt##...",
      "..#tt#vvvv#tt#..",
      "..#tt#vvvv#tt#..",
      "..#tttt##tttt#..",
      "..####....####..",
    ],
  },
  // Capacete de obra e uma planta na mão: construiu curto e longo prazo juntos.
  arquiteto: {
    paleta: { ...BASE, a: "#ffd24a", z: "#7ab8ff", t: "#2a3f7a" },
    linhas: [
      "................",
      ".....######.....",
      "....#aaaaaa#....",
      "...#aaaaaaaa#...",
      "..############..",
      "....#pppppp#....",
      "....#pbopbo#....",
      "....#pppppp#....",
      "....#p####p#....",
      ".....#pppp#.....",
      "...##tttttt##...",
      "..#tt#bbbb#tt#..",
      "..#tt#bzzb#tt#..",
      "..#tt#bbbb#tt#..",
      "..#tttt##tttt#..",
      "..####....####..",
    ],
  },
  // Viseira de cassino e um dado: apostou tudo em uma carta só.
  apostador: {
    paleta: { ...BASE, m: "#b98cff", t: "#4a2f6e" },
    linhas: [
      "................",
      "....########....",
      "...#mmmmmmmm#...",
      "...##########...",
      "....#pppppp#....",
      "....#pbopbo#....",
      "....#pppppp#....",
      "....#p####p#....",
      ".....#pppp#.....",
      "...##tttttt##...",
      "..#tt######tt#..",
      "..#tt#b##b#tt#..",
      "..#tt##bb##tt#..",
      "..#tt#b##b#tt#..",
      "..#tttt##tttt#..",
      "..####....####..",
    ],
  },
};

// 8x8 — ícones de abordagem e de área
const ICONES: Record<string, Sprite> = {
  // abordagens
  build: {
    paleta: UI,
    linhas: [
      "...##...",
      "..#aa#..",
      ".#aaaa#.",
      "#aaaaaa#",
      "..#zz#..",
      "..#zz#..",
      ".#zzzz#.",
      "..####..",
    ],
  },
  buy: {
    paleta: UI,
    linhas: [
      "..####..",
      ".#cccc#.",
      "########",
      "#aaaaaa#",
      "#aa##aa#",
      "#aaaaaa#",
      "#aaaaaa#",
      "########",
    ],
  },
  borrow: {
    paleta: UI,
    linhas: [
      "..####..",
      ".#vvvv#.",
      "#vv##vv#",
      "#vv#cvv#",
      "#vv#cvv#",
      "#vvccvv#",
      ".#vvvv#.",
      "..####..",
    ],
  },
  bot: {
    paleta: UI,
    linhas: [
      "...##...",
      "..#zz#..",
      ".######.",
      "#zbzzbz#",
      "#zzzzzz#",
      "#z####z#",
      ".######.",
      "..#..#..",
    ],
  },
  // áreas
  atendimento: {
    paleta: UI,
    linhas: [
      "..####..",
      ".#cccc#.",
      "#cc##cc#",
      "#c#..#c#",
      "#c#..#c#",
      "#c#..#c#",
      ".#....#.",
      "..#aa#..",
    ],
  },
  dados: {
    paleta: UI,
    linhas: [
      "#......#",
      "#.....z#",
      "#...zzz#",
      "#..vzzz#",
      "#.avzzz#",
      "#.avzzz#",
      "#aavzzz#",
      "########",
    ],
  },
  credito: {
    paleta: UI,
    linhas: [
      "########",
      "#cccccc#",
      "#c#aa#c#",
      "#ca##ac#",
      "#c#aa#c#",
      "#cccccc#",
      "#c#..#c#",
      "########",
    ],
  },
  backoffice: {
    paleta: UI,
    linhas: [
      ".######.",
      ".#bbbb#.",
      ".#cccb#.",
      ".#bbbb#.",
      ".#cccb#.",
      ".#bbbb#.",
      ".#ccbb#.",
      ".######.",
    ],
  },
  tecnologia: {
    paleta: UI,
    linhas: [
      "..#..#..",
      ".######.",
      "#mmmmmm#",
      "#mm##mm#",
      "#m#zz#m#",
      "#mm##mm#",
      ".######.",
      "..#..#..",
    ],
  },
  comercial: {
    paleta: UI,
    linhas: [
      "#......#",
      "#....vv#",
      "#...vv.#",
      "#..vv..#",
      "#.vv.a.#",
      "#vv..aa#",
      "#...aaa#",
      "########",
    ],
  },
  risco: {
    paleta: UI,
    linhas: [
      "..####..",
      ".#zzzz#.",
      "#zzzzzz#",
      "#zz##zz#",
      "#z#aa#z#",
      "#zz##zz#",
      ".#zzzz#.",
      "..####..",
    ],
  },
  lideranca: {
    paleta: UI,
    linhas: [
      "#..##..#",
      "#a.##.a#",
      "#aa##aa#",
      "#aaaaaa#",
      "#a#aa#a#",
      "#aaaaaa#",
      "########",
      "..####..",
    ],
  },
  sucessao: {
    paleta: UI,
    linhas: [
      "########",
      ".#aaaa#.",
      "..#aa#..",
      "...##...",
      "...##...",
      "..#aa#..",
      ".#aaaa#.",
      "########",
    ],
  },
  caneta: {
    paleta: UI,
    linhas: [
      ".....##.",
      "....#a#.",
      "...#aa#.",
      "..#aa#..",
      ".#aa#...",
      "#aa#....",
      "#b#.....",
      "##......",
    ],
  },
};

const cache = new Map<string, string>();

function urlDe(chave: string, sprite: Sprite | undefined): string {
  if (!sprite) return "";
  const memo = cache.get(chave);
  if (memo) return memo;
  const n = sprite.linhas.length;
  let rects = "";
  sprite.linhas.forEach((linha, y) => {
    [...linha].forEach((ch, x) => {
      const cor = sprite.paleta[ch];
      if (!cor || cor === "transparent") return;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${cor}"/>`;
    });
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges">${rects}</svg>`;
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  cache.set(chave, url);
  return url;
}

/** Devolve um data: URL SVG com o retrato pixelado (conselheiros e avatares). */
export function retratoUrl(nome: string): string {
  return urlDe(`r:${nome}`, RETRATOS[nome]);
}

export function iconeUrl(nome: string): string {
  return urlDe(`i:${nome}`, ICONES[nome]);
}

/** Retrato grande da persona final (bombeiro, jardineiro, arquiteto, apostador). */
export function personaUrl(nome: string): string {
  return urlDe(`q:${nome}`, PERSONAS[nome]);
}

export function persona(nome: string): HTMLImageElement | null {
  return imagem(personaUrl(nome), "persona-pixel");
}

function imagem(url: string, classe: string): HTMLImageElement | null {
  if (!url) return null;
  const img = document.createElement("img");
  img.src = url;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.className = classe;
  return img;
}

/** Cria o <img> do retrato (decorativo; o nome do falante está ao lado). */
export function retrato(nome: string): HTMLImageElement | null {
  return imagem(retratoUrl(nome), "retrato");
}

/** Ícone pixel decorativo (o rótulo em texto acompanha). */
export function icone(nome: string, classe = "icone-pixel"): HTMLImageElement | null {
  return imagem(iconeUrl(nome), classe);
}
