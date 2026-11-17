import { jogarCarta, novaPartidaExpress, TURNOS_EXPRESS, type PartidaExpress } from "./game/express";
import {
  acabou,
  aplicarEvento,
  ehTurnoChefao,
  fecharTurno,
  jogarTurnoTrad,
  novaPartidaTrad,
  type PartidaTrad,
} from "./game/tradicional";
import { tocar } from "./ui/som";
import { telaTitulo } from "./ui/screens/titulo";
import { telaTurnoExpress } from "./ui/screens/turnoExpress";
import { telaResultadoExpress } from "./ui/screens/resultadoExpress";
import { telaFinalExpress } from "./ui/screens/finalExpress";
import { telaBriefingTrad } from "./ui/screens/briefingTrad";
import { telaDecisaoTrad } from "./ui/screens/decisaoTrad";
import { telaEventoTrad } from "./ui/screens/eventoTrad";
import { telaResultadoTrad } from "./ui/screens/resultadoTrad";
import { telaDebriefTrad } from "./ui/screens/debriefTrad";

const app = document.getElementById("app")!;

// blip genérico em todo botão (o toggle de som cuida do próprio som)
app.addEventListener("click", (ev) => {
  const alvo = ev.target as HTMLElement;
  if (alvo.closest("button") && !alvo.closest(".btn-som")) tocar("clique");
});

function mostrarTitulo() {
  telaTitulo(app, iniciarExpress, iniciarTradicional);
}

// ── Express ──
function iniciarExpress() {
  const partida = novaPartidaExpress();
  mostrarTurno(partida, 0);
}

function mostrarTurno(p: PartidaExpress, indice: number) {
  if (TURNOS_EXPRESS[indice].chefao) tocar("chefao");
  telaTurnoExpress(app, p, indice, (carta) => {
    jogarCarta(p, carta);
    telaResultadoExpress(app, p, () => {
      const proximo = indice + 1;
      if (proximo < TURNOS_EXPRESS.length) mostrarTurno(p, proximo);
      else {
        tocar("final");
        telaFinalExpress(app, p, iniciarExpress, mostrarTitulo);
      }
    });
  });
}

// ── Tradicional ──
function iniciarTradicional() {
  const partida = novaPartidaTrad();
  mostrarSemestre(partida);
}

function mostrarSemestre(part: PartidaTrad) {
  if (ehTurnoChefao(part)) tocar("chefao");
  telaBriefingTrad(app, part, () => {
    telaDecisaoTrad(app, part, (d) => {
      const evento = jogarTurnoTrad(part, d);
      const aoResultado = () =>
        telaResultadoTrad(app, part, () => {
          fecharTurno(part);
          if (acabou(part)) {
            tocar("final");
            telaDebriefTrad(app, part, iniciarTradicional, mostrarTitulo);
          } else mostrarSemestre(part);
        });
      if (evento) {
        telaEventoTrad(app, evento, (opcao) => {
          aplicarEvento(part, evento, opcao);
          aoResultado();
        });
      } else {
        aoResultado();
      }
    });
  });
}

mostrarTitulo();
