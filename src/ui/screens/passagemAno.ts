/**
 * Virada de ano: o ano novo entra na tela, o escritório muda de década e um
 * jingle curto marca a passagem. Dura ~1,8s e não pede clique — quem quiser
 * pular, clica.
 */
import { t, tf } from "../../i18n";
import { anoDoTurno, faseDoTurno, type Fase } from "../../game/fases";
import type { Estado } from "../../model/types";
import { cenaEscritorio } from "../components/escritorio";
import { el, limpar } from "../dom";
import { tocar } from "../som";

const DURACAO = 1800;

export function telaPassagemAno(raiz: HTMLElement, estado: Estado, aoTerminar: () => void) {
  limpar(raiz);
  // estado.turno é o semestre que acabou de fechar; esta tela anuncia o que
  // começa agora, então tudo aqui olha para o turno seguinte
  const proximo = estado.turno + 1;
  const fase = faseDoTurno(proximo) as Fase;
  raiz.classList.add(`fase-${fase}`);

  const painel = el("div", "passagem");
  painel.append(el("p", "passagem-rotulo", t("passagem.rotulo")));
  painel.append(el("h2", "passagem-ano", String(anoDoTurno(proximo))));
  painel.append(cenaEscritorio(estado, fase));
  painel.append(el("p", "centro relogio", tf("passagem.legenda", { estilo: t(`escritorio.estilo${fase}`) })));
  raiz.append(painel);

  tocar("transicao");

  let fechado = false;
  const seguir = () => {
    if (fechado) return;
    fechado = true;
    clearTimeout(relogio);
    clearTimeout(armar);
    raiz.removeEventListener("click", seguir);
    aoTerminar();
  };
  const relogio = window.setTimeout(seguir, DURACAO);
  // o clique que trouxe a gente para cá ainda está subindo pelo DOM: se o
  // listener entrar agora, a passagem some no mesmo clique que a abriu
  const armar = window.setTimeout(() => raiz.addEventListener("click", seguir), 0);
}
