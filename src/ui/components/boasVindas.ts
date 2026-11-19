/**
 * Pop-up de boas-vindas depois do PRESS START. Aparece uma vez por navegador:
 * quem já jogou não precisa reler as regras toda vez que abre o jogo.
 */
import { t } from "../../i18n";
import { el } from "../dom";

const CHAVE = "bancomaravilha.boasvindas";
const PASSOS = ["moeda", "tempo", "nevoa"] as const;

export function jaViuBoasVindas(): boolean {
  return localStorage.getItem(CHAVE) === "1";
}

export function abrirBoasVindas(aoFechar: () => void): void {
  const fundo = el("div", "modal-fundo");
  const caixa = el("div", "modal");
  caixa.setAttribute("role", "dialog");
  caixa.setAttribute("aria-modal", "true");
  caixa.setAttribute("aria-label", t("boasVindas.titulo"));

  const fechar = () => {
    localStorage.setItem(CHAVE, "1");
    document.removeEventListener("keydown", porTecla);
    fundo.remove();
    aoFechar();
  };
  const porTecla = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") fechar();
  };

  /** Um painel do tutorial por vez: três telas curtas, com voltar e avançar. */
  const tutorial = (i: number) => {
    caixa.replaceChildren();
    const passo = PASSOS[i];
    caixa.append(el("p", "modal-passo", `${i + 1}/${PASSOS.length}`));
    caixa.append(el("h2", undefined, t(`boasVindas.${passo}Titulo`)));
    caixa.append(el("p", undefined, t(`boasVindas.${passo}Texto`)));

    const acoes = el("div", "acoes");
    if (i > 0) {
      const voltar = el("button", undefined, t("comum.voltar"));
      voltar.addEventListener("click", () => tutorial(i - 1));
      acoes.append(voltar);
    }
    const ultimo = i === PASSOS.length - 1;
    const seguir = el("button", "primario", ultimo ? t("boasVindas.comecar") : t("comum.continuar"));
    seguir.addEventListener("click", () => (ultimo ? fechar() : tutorial(i + 1)));
    acoes.append(seguir);
    caixa.append(acoes);
    seguir.focus();
  };

  const abertura = () => {
    caixa.replaceChildren();
    caixa.append(el("h2", undefined, t("boasVindas.titulo")));
    caixa.append(el("p", undefined, t("boasVindas.texto")));

    const acoes = el("div", "acoes");
    const verTutorial = el("button", "primario", t("boasVindas.verTutorial"));
    verTutorial.addEventListener("click", () => tutorial(0));
    const pular = el("button", undefined, t("boasVindas.pular"));
    pular.addEventListener("click", fechar);
    acoes.append(verTutorial, pular);
    caixa.append(acoes);
    verTutorial.focus();
  };

  abertura();
  fundo.append(caixa);
  document.body.append(fundo);
  document.addEventListener("keydown", porTecla);
}
