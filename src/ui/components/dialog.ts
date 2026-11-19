import { t } from "../../i18n";
import { retrato } from "./pixel";

/** "Vera Lins · CEO": o nome manda, o cargo explica de onde ela fala. */
export function nomeConselheiro(id: string): string {
  return `${t(`conselheiros.${id}`)} · ${t(`conselheiros.${id}Cargo`)}`;
}

/** Caixa de diálogo estilo RPG com retrato pixelado e máquina de escrever (pulável). */
export function caixaDialogo(falante: string, texto: string, conselheiroId?: string): HTMLElement {
  const caixa = document.createElement("div");
  caixa.className = "caixa-dialogo";
  if (conselheiroId) {
    const img = retrato(conselheiroId);
    if (img) caixa.append(img);
  }
  const conteudo = document.createElement("div");
  conteudo.className = "caixa-conteudo";
  const quem = document.createElement("span");
  quem.className = "falante";
  quem.textContent = falante;
  const corpo = document.createElement("p");
  corpo.style.margin = "0";
  conteudo.append(quem, corpo);
  caixa.append(conteudo);

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzir) {
    corpo.textContent = texto;
    return caixa;
  }

  let i = 0;
  let timer = 0;
  const escrever = () => {
    i += 1;
    corpo.textContent = texto.slice(0, i);
    if (i < texto.length) timer = window.setTimeout(escrever, 18);
  };
  escrever();
  caixa.addEventListener("click", () => {
    if (i < texto.length) {
      window.clearTimeout(timer);
      i = texto.length;
      corpo.textContent = texto;
    }
  });
  return caixa;
}
