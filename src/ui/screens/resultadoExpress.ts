import { t } from "../../i18n";
import type { PartidaExpress } from "../../game/express";
import { valorDoBanco } from "../../model/scoring";
import { painelIndicadores } from "../components/indicadores";
import { el, limpar } from "../dom";

export function telaResultadoExpress(raiz: HTMLElement, p: PartidaExpress, aoContinuar: () => void) {
  limpar(raiz);
  const atual = p.estado;
  const anterior = p.historico.at(-2);

  raiz.append(el("h2", undefined, t("resultado.titulo")));
  raiz.append(painelIndicadores(atual, anterior));
  raiz.append(
    el("p", "centro titulo", `${t("resultado.valorBanco")}: ${valorDoBanco(atual).toFixed(0)}`)
  );

  // Efeitos ainda em andamento (ícone de relógio)
  if (atual.pendentes.length > 0) {
    const pend = el("p", "relogio");
    const motivos = [...new Set(atual.pendentes.map((ef) => t(`porque.${ef.motivo}`)))];
    pend.textContent = `⏳ ${t("comum.emAndamento")}: ${motivos.length}`;
    pend.title = motivos.join("\n");
    raiz.append(pend);
  }

  // Por que isso aconteceu?
  const porque = el("details", "porque");
  porque.append(el("summary", undefined, t("comum.porque")));
  const lista = el("ul");
  const exps = p.explicacoesPorTurno.at(-1) ?? [];
  const agrupado = new Map<string, number>();
  for (const ex of exps) agrupado.set(ex.motivo, (agrupado.get(ex.motivo) ?? 0) + ex.delta);
  for (const [motivo] of agrupado) lista.append(el("li", undefined, t(`porque.${motivo}`)));
  porque.append(lista);
  raiz.append(porque);

  const acoes = el("div", "acoes");
  const btn = el("button", "primario", t("comum.continuar"));
  btn.addEventListener("click", aoContinuar);
  acoes.append(btn);
  raiz.append(acoes);
}
