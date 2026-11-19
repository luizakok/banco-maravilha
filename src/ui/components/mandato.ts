/**
 * O mandato de 2030 em uma faixa, sempre à vista durante a partida.
 *
 * Cada meta mostra o progresso só se o indicador dela estiver fora da névoa.
 * Meta em indicador escondido fica com "?" até o jogador comprar o dado — foi
 * ele quem escolheu ser cobrado por algo que não consegue ver.
 */
import { t } from "../../i18n";
import { metaPorId, metaAtingida, valorAtual, type MetaId } from "../../game/metas";
import type { Estado } from "../../model/types";
import { el } from "../dom";

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ","));

/** Dá para ler o progresso desta meta agora? */
function visivel(id: MetaId, reveladas: Record<string, number>): boolean {
  const m = metaPorId(id);
  return m.naNevoa === null || (reveladas[m.naNevoa] ?? 0) > 0;
}

export function faixaMandato(
  metas: MetaId[],
  estado: Estado,
  reveladas: Record<string, number>
): HTMLElement {
  const box = el("div", "mandato");
  box.append(el("span", "mandato-rotulo", t("metas.mandatoCurto")));
  const lista = el("div", "mandato-chips");
  for (const id of metas) {
    const m = metaPorId(id);
    const chip = el("span", "mandato-chip");
    const pode = visivel(id, reveladas);
    const ok = pode && metaAtingida(id, estado);
    if (pode) chip.classList.add(ok ? "ok" : "longe");
    else chip.classList.add("cego");
    const alvo = m.alvo === null ? t("indicadores.risco0") : fmt(m.alvo);
    const atual = pode
      ? m.alvo === null
        ? t(`indicadores.risco${estado.risco}`)
        : fmt(Math.round(valorAtual(id, estado) * 10) / 10)
      : "?";
    chip.textContent = `${ok ? "✓" : pode ? "·" : "?"} ${t(`metas.${id}.curto`)} ${atual}/${alvo}`;
    chip.title = pode ? t("metas.dicaVisivel") : t("metas.dicaCego");
    lista.append(chip);
  }
  box.append(lista);
  return box;
}
