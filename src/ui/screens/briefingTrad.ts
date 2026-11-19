import { t, tf } from "../../i18n";
import type { CampoNevoa, PartidaTrad } from "../../game/tradicional";
import {
  CAMPOS_NEVOA,
  ehTurnoChefao,
  preverTurnover,
  recorrenteAtivo,
  revelarIndicador,
  rodarPiloto,
  TOTAL_TURNOS,
  turnoAtual,
} from "../../game/tradicional";
import { p } from "../../model/simulate";
import { caixaDialogo } from "../components/dialog";
import { painelIndicadores } from "../components/indicadores";
import { el, limpar } from "../dom";
import { tocar } from "../som";

const TOTAL_MOTIVOS = 4;

/** Motivo narrativo (determinístico) para o indicador estar na névoa neste semestre. */
function motivoNevoa(turno: number, campo: CampoNevoa): string {
  const i = (turno + CAMPOS_NEVOA.indexOf(campo)) % TOTAL_MOTIVOS;
  return t(`nevoa.motivo${i}`);
}

interface Destaque {
  titulo: string;
  valor: string;
  fala: string;
}

/** Briefing do semestre + compras de inteligência (névoa de guerra). */
export function telaBriefingTrad(raiz: HTMLElement, part: PartidaTrad, aoDecidir: () => void) {
  const turno = turnoAtual(part);
  // valores comprados neste turno (podem ser enganosos; substituem o real no painel)
  const mostrados: Partial<Record<CampoNevoa, number>> = {};
  const destaques: Destaque[] = [];

  if (part.pilotoResultado !== null) {
    destaques.push({
      titulo: t("inteligencia.pilotoTitulo"),
      valor: `${part.pilotoResultado > 0 ? "+" : ""}${part.pilotoResultado.toFixed(2)}`,
      fala: t("inteligencia.pilotoFala"),
    });
  }

  const render = () => {
    limpar(raiz);
    raiz.append(el("p", "tag-turno", `${t("tradicional.semestre")} ${turno} ${t("comum.de")} ${TOTAL_TURNOS}`));

    // ── Dados revelados: sempre no topo, com destaque ──
    for (const d of destaques) {
      const card = el("div", "revelacao");
      card.append(el("p", "revelacao-titulo", d.titulo));
      card.append(el("p", "revelacao-valor", d.valor));
      card.append(el("p", "revelacao-fala", d.fala));
      raiz.append(card);
    }

    if (ehTurnoChefao(part)) raiz.append(el("h2", "centro", `⚠ ${t("tradicional.chefaoAviso")} ⚠`));
    raiz.append(el("div", "manchete", t(`tradicional.t${turno}.manchete`)));
    const conselheiro = t(`tradicional.t${turno}.conselheiro`);
    raiz.append(caixaDialogo(t(`conselheiros.${conselheiro}`), t(`tradicional.t${turno}.fala`), conselheiro));

    const ocultos = CAMPOS_NEVOA.filter((c) => part.reveladas[c] === 0);
    const motivos = Object.fromEntries(ocultos.map((c) => [c, motivoNevoa(turno, c)]));
    raiz.append(
      painelIndicadores(part.estado, part.historico.at(-2), { ocultos, substitutos: mostrados, motivos })
    );

    // ── Inteligência ──
    const sec = el("div", "painel-intel");
    sec.append(el("h3", undefined, t("inteligencia.titulo")));
    sec.append(el("p", "relogio", t("inteligencia.descricao")));
    const saldo = el("p", "saldo-moedas", `${t("inteligencia.saldo")}: 🪙 ${part.orcamento}`);
    sec.append(saldo);
    const rec = recorrenteAtivo(part);
    if (rec > 0)
      sec.append(el("p", "relogio", tf("inteligencia.compromissos", { v: rec, base: p("orcamentoPorTurno") })));

    const botoes = el("div", "acoes intel-acoes");
    const custoRev = p("analytics.custoRevelarIndicador");
    for (const campo of CAMPOS_NEVOA) {
      if (part.reveladas[campo] > 0) continue;
      const b = el("button", undefined, `${t(`indicadores.${campo}`)}: ${t("inteligencia.revelar")} (🪙 ${custoRev})`);
      b.disabled = part.orcamento < custoRev;
      b.addEventListener("click", () => {
        const v = revelarIndicador(part, campo);
        if (v !== null) {
          mostrados[campo] = v;
          tocar("bom");
          destaques.push({
            titulo: tf("inteligencia.reveladoTitulo", { campo: t(`indicadores.${campo}`) }),
            valor: String(v),
            fala: tf(`inteligencia.revelado.${campo}`, {
              v,
              media: p(`benchmark.${campo}`),
            }),
          });
        }
        render();
      });
      botoes.append(b);
    }

    const custoPrev = p("analytics.custoPrevisaoTurnover");
    const bPrev = el("button", undefined, `${t("inteligencia.previsao")} (🪙 ${custoPrev})`);
    bPrev.disabled = part.orcamento < custoPrev;
    bPrev.addEventListener("click", () => {
      const v = preverTurnover(part);
      if (v !== null) {
        tocar("bom");
        destaques.push({
          titulo: t("inteligencia.previsaoTitulo"),
          valor: `${v}%`,
          fala: tf("inteligencia.previsaoResultado", { v }),
        });
      }
      render();
    });
    botoes.append(bPrev);

    const custoPiloto = p("analytics.custoPiloto");
    const bPiloto = el("button", undefined, `${t("inteligencia.piloto")} (🪙 ${custoPiloto})`);
    bPiloto.disabled = part.pilotoPendente || part.orcamento < custoPiloto;
    bPiloto.addEventListener("click", () => {
      if (rodarPiloto(part)) {
        destaques.push({
          titulo: t("inteligencia.pilotoContratado"),
          valor: "🧪",
          fala: t("inteligencia.pilotoResultado"),
        });
      }
      render();
    });
    botoes.append(bPiloto);
    sec.append(botoes);

    if (Object.keys(mostrados).length > 0) sec.append(el("p", "relogio", t("nevoa.enganoso")));
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
