import { jogarCarta, novaPartidaExpress, resumoFinal, TURNOS_EXPRESS } from "../src/game/express";
const todos: { valor: number; caminho: string; final: string; divida: boolean }[] = [];
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) for (let d = 0; d < 3; d++) {
  const p = novaPartidaExpress(1);
  [a, b, c, d].forEach((i, t) => jogarCarta(p, TURNOS_EXPRESS[t].cartas[i]));
  const r = resumoFinal(p);
  todos.push({ valor: r.valor, caminho: p.cartasEscolhidas.join(","), final: r.final, divida: p.estado.dividaAtiva });
}
todos.sort((x, y) => y.valor - x.valor);
for (const t of todos.slice(0, 12)) console.log(t.valor.toFixed(1), t.caminho, t.final, t.divida ? "DIVIDA" : "");
