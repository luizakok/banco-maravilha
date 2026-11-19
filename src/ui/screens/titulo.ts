import { getIdioma, setIdioma, t, type Idioma } from "../../i18n";
import { expressConcluido } from "../../game/state";
import { avatarAtual, setAvatar } from "../../game/avatar";
import { retratoUrl } from "../components/pixel";
import { el, limpar } from "../dom";
import { botaoSom } from "../som";

export function telaTitulo(raiz: HTMLElement, aoJogarExpress: () => void, aoJogarTradicional: () => void) {
  limpar(raiz);

  // controles: idioma + som
  const controles = el("div", "controles-topo");
  const selIdioma = el("select");
  selIdioma.setAttribute("aria-label", t("comum.idioma"));
  for (const [valor, rotulo] of [
    ["pt", "Português"],
    ["en", "English"],
  ] as const) {
    const opt = el("option", undefined, rotulo);
    opt.value = valor;
    if (getIdioma() === valor) opt.selected = true;
    selIdioma.append(opt);
  }
  selIdioma.addEventListener("change", () => {
    setIdioma(selIdioma.value as Idioma);
    document.title = t("banco.nome");
    telaTitulo(raiz, aoJogarExpress, aoJogarTradicional);
  });
  const btnSom = botaoSom();
  btnSom.setAttribute("aria-label", t("comum.som"));
  controles.append(selIdioma, btnSom);
  raiz.append(controles);

  raiz.append(el("div", "espaco"));
  raiz.append(el("h1", undefined, t("banco.nome")));
  raiz.append(el("p", "centro titulo", t("titulo.subtitulo")));
  const intro = el("p", "centro", t("titulo.intro"));
  intro.style.maxWidth = "560px";
  intro.style.margin = "12px auto";
  raiz.append(intro);

  // escolha do avatar da Diretoria
  const escolhaAvatar = el("div", "escolha-avatar");
  escolhaAvatar.append(el("p", "centro relogio", t("titulo.escolhaAvatar")));
  const linha = el("div", "avatares");
  for (const op of ["diretora", "diretor"] as const) {
    const b = el("button", "avatar-op");
    b.type = "button";
    const img = document.createElement("img");
    img.src = retratoUrl(op);
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.className = "retrato retrato-diretoria";
    b.append(img, el("span", undefined, t(`titulo.${op}`)));
    const ativo = avatarAtual() === op;
    if (ativo) b.classList.add("escolhida");
    b.setAttribute("aria-pressed", String(ativo));
    b.addEventListener("click", () => {
      setAvatar(op);
      telaTitulo(raiz, aoJogarExpress, aoJogarTradicional);
    });
    linha.append(b);
  }
  escolhaAvatar.append(linha);
  raiz.append(escolhaAvatar);

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
