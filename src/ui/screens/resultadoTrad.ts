import { t } from "../../i18n";
import type { PartidaTrad } from "../../game/tradicional";
import { CAMPOS_NEVOA } from "../../game/tradicional";
import { valorDoBanco } from "../../model/scoring";
import { painelIndicadores } from "../components/indicadores";
import { el, limpar } from "../dom";

/** Rótulo de um motivo de explicação (decisões, encadeamentos ou eventos). */
export function rotuloMotivo(motivo: string): string {
  return motivo.startsWith("evento.") ? t(`porqueEvento.${motivo.slice("evento.".length)}`) : t(`porque.${motivo}`);
}

/** Resultado do semestre (com névoa nos indicadores de pessoas não revelados). */
export function telaResultadoTrad(raiz: HTMLElement, part: PartidaTrad, aoContinuar: () => void) {
  limpar(raiz);
  const atual = part.estado;
  const anterior = part.historico.at(-1); // fecharTurno ainda não rodou

  raiz.append(el("h2", undefined, t("resultado.tituloSemestre")));
  const ocultos = CAMPOS_NEVOA.filter((c) => part.reveladas[c] === 0);
  raiz.append(painelIndicadores(atual, anterior, { ocultos }));
  raiz.append(el("p", "centro titulo", `${t("resultado.valorBanco")}: ${valorDoBanco(atual).toFixed(0)}`));

  if (atual.pendentes.length > 0) {
    const pend = el("p", "relogio");
    const motivos = [...new Set(atual.pendentes.map((ef) => rotuloMotivo(ef.motivo)))];
    pend.textContent = `⏳ ${t("comum.emAndamento")}: ${motivos.length}`;
    pend.title = motivos.join("\n");
    raiz.append(pend);
  }

  const porque = el("details", "porque");
  porque.append(el("summary", undefined, t("comum.porque")));
  const lista = el("ul");
  const exps = part.explicacoesPorTurno.at(-1) ?? [];
  const motivos = [...new Set(exps.map((ex) => ex.motivo))];
  for (const motivo of motivos) lista.append(el("li", undefined, rotuloMotivo(motivo)));
  porque.append(lista);
  raiz.append(porque);

  const acoes = el("div", "acoes");
  const btn = el("button", "primario", t("comum.continuar"));
  btn.addEventListener("click", aoContinuar);
  acoes.append(btn);
  raiz.append(acoes);
}
