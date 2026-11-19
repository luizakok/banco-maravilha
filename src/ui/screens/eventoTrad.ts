import { t } from "../../i18n";
import type { EventoDef } from "../../game/tradicional";
import { caixaDialogo, nomeConselheiro } from "../components/dialog";
import { el, limpar } from "../dom";

/**
 * Evento menor do semestre: dois caminhos, nenhum de graça.
 *
 * O assunto chega pela boca de alguém — o mesmo tratamento do chefão —, e cada
 * caminho mostra o título e o que ele custa, para que a escolha não dependa de
 * ler a entrelinha.
 */
export function telaEventoTrad(raiz: HTMLElement, ev: EventoDef, aoEscolher: (opcao: 0 | 1) => void) {
  limpar(raiz);
  raiz.append(el("h2", undefined, t("eventos.titulo")));
  raiz.append(
    caixaDialogo(nomeConselheiro(ev.conselheiro), t(`eventos.${ev.id}.texto`), ev.conselheiro)
  );

  const grade = el("div", "cartas");
  (["a", "b"] as const).forEach((letra, i) => {
    const btn = el("button", "carta carta-evento") as HTMLButtonElement;
    btn.append(el("span", "titulo", t(`eventos.${ev.id}.${letra}`)));
    btn.append(el("span", "descricao", t(`eventos.${ev.id}.${letra}Texto`)));
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      aoEscolher(i as 0 | 1);
    });
    grade.append(btn);
  });
  raiz.append(grade);
}
