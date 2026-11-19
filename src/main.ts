import { jogarCarta, novaPartidaExpress, TURNOS_EXPRESS, type PartidaExpress } from "./game/express";
import {
  acabou,
  aplicarEvento,
  aplicarRespostaChefao,
  ehTurnoChefao,
  fecharTurno,
  jogarTurnoTrad,
  novaPartidaTrad,
  registrarEscolhas,
  turnoAtual,
  type PartidaTrad,
} from "./game/tradicional";
import { chefaoDoTurno } from "./game/chefoes";
import { montarDecisao, politicasDisponiveis } from "./game/gaps";
import { t } from "./i18n";
import { tocar } from "./ui/som";
import { montarControles } from "./ui/components/controles";
import { abrirBoasVindas, jaViuBoasVindas } from "./ui/components/boasVindas";
import { telaPressStart } from "./ui/screens/pressStart";
import { telaTitulo } from "./ui/screens/titulo";
import { telaTurnoExpress } from "./ui/screens/turnoExpress";
import { telaResultadoExpress } from "./ui/screens/resultadoExpress";
import { telaFinalExpress } from "./ui/screens/finalExpress";
import { telaMetasTrad } from "./ui/screens/metasTrad";
import { telaBriefingTrad } from "./ui/screens/briefingTrad";
import { telaChefaoResposta } from "./ui/screens/chefaoResposta";
import { telaDecisaoTrad } from "./ui/screens/decisaoTrad";
import { telaEventoTrad } from "./ui/screens/eventoTrad";
import { telaResultadoTrad } from "./ui/screens/resultadoTrad";
import { telaDebriefTrad } from "./ui/screens/debriefTrad";
import { telaPassagemAno } from "./ui/screens/passagemAno";
import { viraOAno } from "./game/fases";

const app = document.getElementById("app")!;

// blip genérico em todo botão (o toggle de som cuida do próprio som)
app.addEventListener("click", (ev) => {
  const alvo = ev.target as HTMLElement;
  if (alvo.closest("button") && !alvo.closest(".btn-som")) tocar("clique");
});

/**
 * Última tela pintada. Trocar de idioma repinta ela mesma: um reload perderia
 * a partida no meio.
 */
let ultimaTela: () => void = () => {};

function pintar(tela: () => void) {
  ultimaTela = tela;
  tela();
}

function mostrarAbertura() {
  pintar(() =>
    telaPressStart(app, () => {
      mostrarTitulo();
      if (!jaViuBoasVindas()) abrirBoasVindas(() => {});
    })
  );
}

function mostrarTitulo() {
  pintar(() => telaTitulo(app, iniciarExpress, iniciarTradicional));
}

// ── Express ──
function iniciarExpress() {
  const partida = novaPartidaExpress();
  mostrarTurno(partida, 0);
}

function mostrarTurno(p: PartidaExpress, indice: number) {
  if (TURNOS_EXPRESS[indice].chefao) tocar("chefao");
  pintar(() =>
    telaTurnoExpress(app, p, indice, (carta) => {
      jogarCarta(p, carta);
      pintar(() =>
        telaResultadoExpress(app, p, () => {
          const proximo = indice + 1;
          if (proximo < TURNOS_EXPRESS.length) mostrarTurno(p, proximo);
          else {
            tocar("final");
            pintar(() => telaFinalExpress(app, p, iniciarExpress, mostrarTitulo));
          }
        })
      );
    })
  );
}

// ── Tradicional ──
// a partida começa pelo mandato: a CEO pede três metas para 2030 antes do
// primeiro semestre, e é por elas que o jogador será cobrado no debrief
function iniciarTradicional() {
  pintar(() =>
    telaMetasTrad(app, (metas) => {
      const partida = novaPartidaTrad(undefined, metas);
      mostrarSemestre(partida);
    })
  );
}

function mostrarSemestre(part: PartidaTrad) {
  if (ehTurnoChefao(part)) tocar("chefao");
  pintar(() =>
    telaBriefingTrad(app, part, () => {
      pintar(() =>
        telaDecisaoTrad(app, part, (esc) => {
          const politicas = politicasDisponiveis(part.estado.hibridoAtivo);
          const d = montarDecisao(esc, politicas, part.copilotosAtivos);
          registrarEscolhas(part, esc);
          const evento = jogarTurnoTrad(part, d);
          const aoResultado = () =>
            pintar(() =>
              telaResultadoTrad(app, part, () => {
                // fecharTurno não mexe no contador: o turno que acabou de rodar
                // é o que está no estado, e o próximo é turnoAtual
                const jogado = part.estado.turno;
                fecharTurno(part);
                if (acabou(part)) {
                  tocar("final");
                  pintar(() => telaDebriefTrad(app, part, iniciarTradicional, mostrarTitulo));
                } else if (viraOAno(jogado, turnoAtual(part))) {
                  pintar(() => telaPassagemAno(app, part.estado, () => mostrarSemestre(part)));
                } else mostrarSemestre(part);
              })
            );
          // semestre de chefão não tem evento menor: ali o jogador responde ao
          // chefão, e algumas respostas só existem se ele se preparou antes
          const chefao = chefaoDoTurno(part.estado.turno);
          if (evento) {
            pintar(() =>
              telaEventoTrad(app, evento, (opcao) => {
                aplicarEvento(part, evento, opcao);
                aoResultado();
              })
            );
          } else if (chefao) {
            pintar(() =>
              telaChefaoResposta(app, part, chefao, (resposta) => {
                aplicarRespostaChefao(part, chefao.id, resposta);
                aoResultado();
              })
            );
          } else {
            aoResultado();
          }
        })
      );
    })
  );
}

montarControles(() => {
  document.title = t("banco.nome");
  ultimaTela();
});
mostrarAbertura();
