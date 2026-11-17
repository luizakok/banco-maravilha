import { t, tf } from "../../i18n";
import type { CampoNevoa, PartidaTrad } from "../../game/tradicional";
import {
  CAMPOS_NEVOA,
  ehTurnoChefao,
  preverTurnover,
  revelarIndicador,
  rodarPiloto,
  TOTAL_TURNOS,
  turnoAtual,
} from "../../game/tradicional";
import { p } from "../../model/simulate";
import { caixaDialogo } from "../components/dialog";
import { painelIndicadores } from "../components/indicadores";
import { el, limpar } from "../dom";

/** Briefing do semestre + compras de inteligência (névoa de guerra). */
export function telaBriefingTrad(raiz: HTMLElement, part: PartidaTrad, aoDecidir: () => void) {
  const turno = turnoAtual(part);
  // valores comprados neste turno (podem ser enganosos; substituem o real no painel)
  const mostrados: Partial<Record<CampoNevoa, number>> = {};
  const mensagens: string[] = [];
  let pilotoFeito = false;

  const render = () => {
    limpar(raiz);
    raiz.append(el("p", "tag-turno", `${t("tradicional.semestre")} ${turno} ${t("comum.de")} ${TOTAL_TURNOS}`));
    if (ehTurnoChefao(part)) raiz.append(el("h2", "centro", `⚠ ${t("tradicional.chefaoAviso")} ⚠`));
    raiz.append(el("div", "manchete", t(`tradicional.t${turno}.manchete`)));
    const conselheiro = t(`tradicional.t${turno}.conselheiro`);
    raiz.append(caixaDialogo(t(`conselheiros.${conselheiro}`), t(`tradicional.t${turno}.fala`), conselheiro));

    const ocultos = CAMPOS_NEVOA.filter((c) => part.reveladas[c] === 0);
    raiz.append(painelIndicadores(part.estado, part.historico.at(-2), { ocultos, substitutos: mostrados }));

    // ── Inteligência ──
    const sec = el("div", "painel-intel");
    sec.append(el("h3", undefined, t("inteligencia.titulo")));
    sec.append(el("p", "relogio", t("inteligencia.descricao")));
    const saldo = el("p", undefined, `${t("inteligencia.saldo")}: ${fmtMoedas(part.orcamento)} ${t("inteligencia.moedas")}`);
    saldo.className = "saldo-moedas";
    sec.append(saldo);

    const botoes = el("div", "acoes intel-acoes");
    const custoRev = p("analytics.custoRevelarIndicador");
    for (const campo of CAMPOS_NEVOA) {
      if (part.reveladas[campo] > 0) continue;
      const b = el(
        "button",
        undefined,
        `${t(`indicadores.${campo}`)}: ${t("inteligencia.revelar")} (${fmtMoedas(custoRev)})`
      );
      b.disabled = part.orcamento < custoRev;
      b.addEventListener("click", () => {
        const v = revelarIndicador(part, campo);
        if (v !== null) mostrados[campo] = v;
        render();
      });
      botoes.append(b);
    }

    const custoPrev = p("analytics.custoPrevisaoTurnover");
    const bPrev = el("button", undefined, `${t("inteligencia.previsao")} (${fmtMoedas(custoPrev)})`);
    bPrev.disabled = part.orcamento < custoPrev;
    bPrev.addEventListener("click", () => {
      const v = preverTurnover(part);
      if (v !== null) mensagens.push(tf("inteligencia.previsaoResultado", { v }));
      render();
    });
    botoes.append(bPrev);

    const custoPiloto = p("analytics.custoPiloto");
    const bPiloto = el("button", undefined, `${t("inteligencia.piloto")} (${fmtMoedas(custoPiloto)})`);
    bPiloto.disabled = pilotoFeito || part.orcamento < custoPiloto;
    bPiloto.addEventListener("click", () => {
      if (rodarPiloto(part)) {
        pilotoFeito = true;
        mensagens.push(t("inteligencia.pilotoResultado"));
      }
      render();
    });
    botoes.append(bPiloto);
    sec.append(botoes);

    for (const m of mensagens) sec.append(el("p", "intel-msg", `📊 ${m}`));
    if (Object.keys(mostrados).length > 0 || mensagens.length > 0)
      sec.append(el("p", "relogio", t("nevoa.enganoso")));
    raiz.append(sec);

    const acoes = el("div", "acoes");
    const btn = el("button", "primario", t("inteligencia.irDecisao"));
    btn.addEventListener("click", aoDecidir);
    acoes.append(btn);
    raiz.append(acoes);
  };

  render();
}

export function fmtMoedas(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
}
