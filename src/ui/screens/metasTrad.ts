/**
 * A CEO pede o mandato de 2030: seis metas na mesa, o jogador escolhe três.
 * É a primeira decisão da partida e a mais barata de todas — e é a que define
 * em que ele vai ser cobrado no fim.
 */
import { t, tf } from "../../i18n";
import { METAS, QUANTAS_METAS, type MetaId } from "../../game/metas";
import { caixaDialogo, nomeConselheiro } from "../components/dialog";
import { el, limpar } from "../dom";
import { tocar } from "../som";

export function telaMetasTrad(raiz: HTMLElement, aoConfirmar: (metas: MetaId[]) => void) {
  const escolhidas: MetaId[] = [];
  // a fala é montada uma vez só: re-anexar o mesmo nó move o elemento sem
  // recomeçar a máquina de escrever a cada meta marcada
  const fala = caixaDialogo(nomeConselheiro("ceo"), t("metas.fala"), "ceo");

  const render = () => {
    limpar(raiz);
    raiz.classList.add("fase-1");
    raiz.append(el("p", "tag-turno", t("metas.rotulo")));
    raiz.append(el("h2", undefined, t("metas.titulo")));
    raiz.append(fala);
    raiz.append(
      el("p", "relogio centro", tf("metas.contador", { n: escolhidas.length, total: QUANTAS_METAS }))
    );

    const grade = el("div", "metas-grade");
    for (const m of METAS) {
      const marcada = escolhidas.includes(m.id);
      const btn = el("button", `carta meta-carta${marcada ? " escolhida" : ""}`) as HTMLButtonElement;
      btn.setAttribute("aria-pressed", String(marcada));
      btn.append(el("span", "titulo", `${marcada ? "★" : "☆"} ${t(`metas.${m.id}.nome`)}`));
      btn.append(el("span", "meta-alvo", alvoEmPalavras(m.id)));
      btn.append(el("span", "descricao", t(`metas.${m.id}.texto`)));
      btn.append(
        el("span", "etiqueta", m.naNevoa ? t("metas.etiquetaNevoa") : t("metas.etiquetaVisivel"))
      );
      // cheio e não marcada: deixa claro que falta desmarcar alguma
      btn.disabled = !marcada && escolhidas.length >= QUANTAS_METAS;
      btn.addEventListener("click", () => {
        const i = escolhidas.indexOf(m.id);
        if (i >= 0) escolhidas.splice(i, 1);
        else escolhidas.push(m.id);
        tocar("clique");
        render();
      });
      grade.append(btn);
    }
    raiz.append(grade);

    const acoes = el("div", "acoes");
    const btn = el("button", "primario", t("metas.assumir")) as HTMLButtonElement;
    btn.disabled = escolhidas.length !== QUANTAS_METAS;
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      btn.disabled = true;
      tocar("bom");
      aoConfirmar([...escolhidas]);
    });
    acoes.append(btn);
    raiz.append(acoes);
  };

  render();
}

/** "Eficiência em 52 ou menos", em palavras, com o alvo visível antes de escolher. */
export function alvoEmPalavras(id: MetaId): string {
  const m = METAS.find((x) => x.id === id)!;
  if (m.alvo === null) return t("metas.risco.alvo");
  return tf(`metas.${m.sentido}`, { indicador: t(`indicadores.${m.campo}`), alvo: String(m.alvo) });
}
