import { t } from "../../i18n";
import type { EventoDef } from "../../game/tradicional";
import { el, limpar } from "../dom";

/** Evento menor do semestre: dois caminhos, nenhum de graça. */
export function telaEventoTrad(raiz: HTMLElement, ev: EventoDef, aoEscolher: (opcao: 0 | 1) => void) {
  limpar(raiz);
  raiz.append(el("h2", undefined, t("eventos.titulo")));
  raiz.append(el("div", "manchete", t(`eventos.${ev.id}.texto`)));

  const grade = el("div", "cartas");
  (["a", "b"] as const).forEach((letra, i) => {
    const btn = el("button", "carta");
    btn.append(el("span", "descricao", t(`eventos.${ev.id}.${letra}`)));
    btn.addEventListener("click", () => aoEscolher(i as 0 | 1));
    grade.append(btn);
  });
  raiz.append(grade);
}
