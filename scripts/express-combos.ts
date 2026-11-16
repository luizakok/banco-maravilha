import { jogarCarta, novaPartidaExpress, resumoFinal, TURNOS_EXPRESS } from "../src/game/express";
const contagem: Record<string, number> = {};
let melhor = { valor: -1, caminho: "" };
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) {
  const p = novaPartidaExpress(1);
  [a, b, c, d].forEach((i, t) => jogarCarta(p, TURNOS_EXPRESS[t].cartas[i]));
  const r = resumoFinal(p);
  contagem[r.final] = (contagem[r.final] ?? 0) + 1;
  if (r.valor > melhor.valor) melhor = { valor: r.valor, caminho: p.cartasEscolhidas.join(",") + ` -> ${r.final}` };
}
console.log(contagem, "\nmelhor:", melhor.valor.toFixed(1), melhor.caminho);
