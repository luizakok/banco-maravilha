import { jogarCarta, novaPartidaExpress, TURNOS_EXPRESS, type PartidaExpress } from "./game/express";
import { telaTitulo } from "./ui/screens/titulo";
import { telaTurnoExpress } from "./ui/screens/turnoExpress";
import { telaResultadoExpress } from "./ui/screens/resultadoExpress";
import { telaFinalExpress } from "./ui/screens/finalExpress";

const app = document.getElementById("app")!;

function mostrarTitulo() {
  telaTitulo(app, iniciarExpress);
}

function iniciarExpress() {
  const partida = novaPartidaExpress();
  mostrarTurno(partida, 0);
}

function mostrarTurno(p: PartidaExpress, indice: number) {
  telaTurnoExpress(app, p, indice, (carta) => {
    jogarCarta(p, carta);
    telaResultadoExpress(app, p, () => {
      const proximo = indice + 1;
      if (proximo < TURNOS_EXPRESS.length) mostrarTurno(p, proximo);
      else telaFinalExpress(app, p, iniciarExpress, mostrarTitulo);
    });
  });
}

mostrarTitulo();
