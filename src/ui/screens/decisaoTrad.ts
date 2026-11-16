import { t } from "../../i18n";
import type { Alavanca, Decisao } from "../../model/types";
import type { PartidaTrad } from "../../game/tradicional";
import { TOTAL_TURNOS, turnoAtual } from "../../game/tradicional";
import { p } from "../../model/simulate";
import { el, limpar } from "../dom";
import { fmtMoedas } from "./briefingTrad";

const GRUPOS: { chave: string; alavancas: Alavanca[] }[] = [
  { chave: "recrutamento", alavancas: ["contratar", "interno"] },
  { chave: "ld", alavancas: ["ld_cargo", "ld_realocar"] },
  { chave: "ia", alavancas: ["ia_auto", "ia_copiloto"] },
  { chave: "futuro", alavancas: ["hibrido", "flex"] },
];

/** Decisão do semestre: distribuir moedas entre as alavancas. */
export function telaDecisaoTrad(raiz: HTMLElement, part: PartidaTrad, aoConfirmar: (d: Decisao) => void) {
  const alocacao: Partial<Record<Alavanca, number>> = {};
  let gpr = false;

  const gasto = () => Object.values(alocacao).reduce((s, v) => s + (v ?? 0), 0);
  const restante = () => part.orcamento - gasto();
  const iniciativas = () =>
    (Object.keys(alocacao) as Alavanca[]).filter((a) => a !== "analytics" && (alocacao[a] ?? 0) > 0).length;

  const render = () => {
    limpar(raiz);
    raiz.append(
      el("p", "tag-turno", `${t("tradicional.semestre")} ${turnoAtual(part)} ${t("comum.de")} ${TOTAL_TURNOS}`)
    );
    raiz.append(el("h2", undefined, t("decisao.titulo")));
    raiz.append(el("p", "relogio centro", t("grupos.nota")));

    const barra = el("p", "centro saldo-moedas");
    barra.textContent = `${t("decisao.orcamentoRestante")}: ${fmtMoedas(restante())} ${t(
      "inteligencia.moedas"
    )} · ${t("decisao.iniciativas")}: ${iniciativas()}/${p("capacidade.maxIniciativas")}`;
    raiz.append(barra);
    if (iniciativas() > p("capacidade.maxIniciativas"))
      raiz.append(el("p", "centro aviso", `⚠ ${t("decisao.avisoCapacidade")}`));

    for (const grupo of GRUPOS) {
      const bloco = el("div", "grupo-alavancas");
      bloco.append(el("h3", undefined, t(`grupos.${grupo.chave}`)));
      for (const a of grupo.alavancas) {
        const linha = el("div", "alavanca");
        const info = el("div", "alavanca-info");
        info.append(el("span", "alavanca-nome", t(`alavancas.${a}`)));
        info.append(el("span", "alavanca-dica", t(`alavancas.${a}Dica`)));
        linha.append(info);

        const hibridoJaAtivo = a === "hibrido" && part.estado.hibridoAtivo;
        const stepper = el("div", "stepper");
        const menos = el("button", "passo", "−");
        const valor = el("span", "stepper-valor", String(alocacao[a] ?? 0));
        const mais = el("button", "passo", "+");
        menos.setAttribute("aria-label", `${t(`alavancas.${a}`)} −1`);
        mais.setAttribute("aria-label", `${t(`alavancas.${a}`)} +1`);
        menos.disabled = (alocacao[a] ?? 0) <= 0;
        mais.disabled = restante() < 1 || hibridoJaAtivo || (a === "hibrido" && (alocacao[a] ?? 0) >= 2);
        menos.addEventListener("click", () => {
          alocacao[a] = Math.max(0, (alocacao[a] ?? 0) - 1);
          if (alocacao[a] === 0) delete alocacao[a];
          render();
        });
        mais.addEventListener("click", () => {
          alocacao[a] = (alocacao[a] ?? 0) + 1;
          render();
        });
        stepper.append(menos, valor, mais);
        linha.append(stepper);

        if (a === "hibrido" && !hibridoJaAtivo) {
          const lab = el("label", "gpr");
          const chk = el("input");
          chk.type = "checkbox";
          chk.checked = gpr;
          chk.disabled = (alocacao.hibrido ?? 0) < p("futuroTrabalho.hibridoCustoComGPR");
          chk.addEventListener("change", () => {
            gpr = chk.checked;
          });
          lab.append(chk, document.createTextNode(` ${t("decisao.gpr")}`));
          linha.append(lab);
        }
        bloco.append(linha);
      }
      raiz.append(bloco);
    }

    const acoes = el("div", "acoes");
    const btn = el("button", "primario", t("decisao.confirmar"));
    btn.addEventListener("click", () => {
      const d: Decisao = { alocacao: { ...alocacao } };
      if ((alocacao.hibrido ?? 0) >= p("futuroTrabalho.hibridoCustoComGPR") && gpr) d.gestaoPorResultados = true;
      aoConfirmar(d);
    });
    acoes.append(btn);
    raiz.append(acoes);
  };

  render();
}
