/**
 * Tela de abertura. O primeiro clique é o que libera o áudio no navegador —
 * por isso é ele que liga o som e começa o tema, e não o carregamento da página.
 */
import { t } from "../../i18n";
import { el, limpar } from "../dom";
import { ligarSomNoPrimeiroClique, tocar, tocarTema } from "../som";

export function telaPressStart(raiz: HTMLElement, aoComecar: () => void) {
  limpar(raiz);
  raiz.classList.add("tela-abertura");

  const painel = el("div", "abertura");
  painel.append(el("h1", "abertura-nome", t("banco.nome")));
  painel.append(el("p", "centro titulo", t("titulo.subtitulo")));

  const btn = el("button", "press-start", t("titulo.pressStart"));
  btn.type = "button";
  painel.append(btn);
  painel.append(el("p", "centro relogio", t("titulo.pressStartDica")));
  raiz.append(painel);

  const comecar = () => {
    document.removeEventListener("keydown", porTecla);
    raiz.classList.remove("tela-abertura");
    ligarSomNoPrimeiroClique();
    tocar("confirmar");
    tocarTema();
    aoComecar();
  };
  const porTecla = (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") comecar();
  };

  btn.addEventListener("click", comecar);
  document.addEventListener("keydown", porTecla);
}
