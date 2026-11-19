/**
 * Entrada do chefão: luz de alarme, tremor e o personagem do semestre.
 * O humor está no personagem, não na situação das pessoas.
 */
import { t } from "../../i18n";
import { chefao } from "./pixel";
import { el } from "../dom";

export function faixaChefao(id: string): HTMLElement {
  const box = el("div", "chefao-faixa");
  box.append(el("div", "alarme"));

  const topo = el("div", "chefao-topo");
  const img = chefao(id);
  if (img) topo.append(img);

  const texto = el("div", "chefao-texto");
  texto.append(el("p", "chefao-aviso", `⚠ ${t("tradicional.chefaoAviso")} ⚠`));
  texto.append(el("h2", "chefao-nome", t(`chefoes.${id}.nome`)));
  texto.append(el("p", "chefao-fala", t(`chefoes.${id}.entrada`)));
  topo.append(texto);

  box.append(topo);
  return box;
}

/** Sacode a tela por meio segundo. Respeita quem pediu menos movimento. */
export function tremor(raiz: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  raiz.classList.add("tremendo");
  window.setTimeout(() => raiz.classList.remove("tremendo"), 600);
}
