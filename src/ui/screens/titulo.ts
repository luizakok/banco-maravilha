import { t } from "../../i18n";
import { expressConcluido } from "../../game/state";
import { el, limpar } from "../dom";

export function telaTitulo(raiz: HTMLElement, aoJogarExpress: () => void, aoJogarTradicional: () => void) {
  limpar(raiz);
  raiz.append(el("div", "espaco"));
  raiz.append(el("h1", undefined, t("banco.nome")));
  raiz.append(el("p", "centro titulo", t("titulo.subtitulo")));
  const intro = el("p", "centro", t("titulo.intro"));
  intro.style.maxWidth = "560px";
  intro.style.margin = "12px auto";
  raiz.append(intro);

  const acoes = el("div", "acoes");
  const btnExpress = el("button", "primario", t("titulo.expressBotao"));
  btnExpress.addEventListener("click", aoJogarExpress);
  acoes.append(btnExpress);

  const btnTrad = el("button", undefined, t("titulo.tradicionalBotao"));
  if (!expressConcluido()) {
    btnTrad.disabled = true;
    btnTrad.title = t("titulo.tradicionalBloqueado");
    acoes.append(btnTrad, el("p", "centro relogio", t("titulo.tradicionalBloqueado")));
  } else {
    btnTrad.addEventListener("click", aoJogarTradicional);
    acoes.append(btnTrad);
  }
  raiz.append(acoes);
  raiz.append(el("p", "centro relogio", t("titulo.dica")));
  raiz.append(el("div", "espaco"));
}
