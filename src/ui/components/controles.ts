/**
 * Barra de controles (idioma + som) fixa no canto, montada uma única vez no
 * body: as telas repintam #app inteiro, e o mudo precisa sobreviver a isso.
 *
 * As bandeiras são SVG desenhado por código — emoji de bandeira vira duas
 * letras no Windows, e aqui ninguém pode ficar sem saber onde troca o idioma.
 */
import { getIdioma, setIdioma, t, type Idioma } from "../../i18n";
import { el } from "../dom";
import { botaoSom } from "../som";

const BANDEIRAS: Record<Idioma, string> = {
  pt:
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 20">` +
    `<rect width="28" height="20" fill="#009739"/>` +
    `<path d="M14 2.5 26 10 14 17.5 2 10Z" fill="#fedd00"/>` +
    `<circle cx="14" cy="10" r="4.2" fill="#012169"/></svg>`,
  en:
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 20">` +
    `<rect width="28" height="20" fill="#f7f7f7"/>` +
    [0, 1, 2, 3, 4, 5, 6]
      .map((i) => `<rect y="${(i * 20) / 6.5}" width="28" height="1.54" fill="#b22234"/>`)
      .join("") +
    `<rect width="11.2" height="10.8" fill="#3c3b6e"/></svg>`,
};

const NOMES: Record<Idioma, string> = { pt: "Português", en: "English" };

function bandeira(id: Idioma): HTMLImageElement {
  const img = document.createElement("img");
  img.src = `data:image/svg+xml,${encodeURIComponent(BANDEIRAS[id])}`;
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.className = "bandeira";
  return img;
}

let barra: HTMLElement | null = null;
let som: HTMLButtonElement | null = null;

/** Monta a barra na primeira chamada; depois só refaz as bandeiras e os rótulos. */
export function montarControles(aoTrocarIdioma: () => void): void {
  if (!barra) {
    barra = el("div", "barra-controles");
    document.body.append(barra);
  }
  // o botão de som nasce uma vez só: ele escuta o estado do áudio e se redesenha
  if (!som) som = botaoSom();
  som.setAttribute("aria-label", t("comum.som"));
  som.title = t("comum.som");
  barra.replaceChildren();

  const idiomas = el("div", "grupo-idioma");
  idiomas.setAttribute("role", "group");
  idiomas.setAttribute("aria-label", t("comum.idioma"));
  for (const id of ["pt", "en"] as const) {
    const b = el("button", "btn-bandeira");
    b.type = "button";
    b.append(bandeira(id));
    const ativo = getIdioma() === id;
    if (ativo) b.classList.add("escolhida");
    b.setAttribute("aria-pressed", String(ativo));
    b.title = NOMES[id];
    b.setAttribute("aria-label", NOMES[id]);
    b.addEventListener("click", () => {
      if (getIdioma() === id) return;
      setIdioma(id);
      montarControles(aoTrocarIdioma);
      aoTrocarIdioma();
    });
    idiomas.append(b);
  }

  barra.append(idiomas, som);
}
