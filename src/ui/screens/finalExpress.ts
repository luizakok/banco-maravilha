import { t } from "../../i18n";
import type { PartidaExpress } from "../../game/express";
import { resumoFinal } from "../../game/express";
import { marcarExpressConcluido } from "../../game/state";
import { painelIndicadores } from "../components/indicadores";
import { rodapeFontes } from "../components/fontes";
import { dashboardLinhas } from "../components/graficos";
import { persona } from "../components/pixel";
import { el, limpar } from "../dom";

export function telaFinalExpress(
  raiz: HTMLElement,
  p: PartidaExpress,
  aoJogarDeNovo: () => void,
  aoVoltar: () => void
) {
  limpar(raiz);
  marcarExpressConcluido();
  const r = resumoFinal(p);

  const card = el("div", "final-card");
  const retrato = persona(r.final);
  if (retrato) card.append(retrato);
  card.append(el("h2", undefined, t(`finais.${r.final}.nome`)));
  card.append(el("p", undefined, t(`finais.${r.final}.texto`)));
  card.append(el("div", "valorzao", r.valor.toFixed(0)));
  card.append(el("p", "tag-turno", t("resultado.valorBanco") + " — 2030"));
  raiz.append(card);

  raiz.append(painelIndicadores(p.estado));

  const notas = el("p", "centro");
  notas.textContent = `${t("debrief.notas")}: ${t("debrief.curto")} ${r.notas.curto} · ${t(
    "debrief.medio"
  )} ${r.notas.medio} · ${t("debrief.longo")} ${r.notas.longo}`;
  raiz.append(notas);

  raiz.append(el("h3", "titulo-secao", t("resultado.dashboardTitulo")));
  raiz.append(dashboardLinhas(p.historico));

  const pergunta = el("p", "centro manchete", t("debrief.pergunta"));
  raiz.append(pergunta);
  raiz.append(el("p", "centro relogio", `🔓 ${t("debrief.desbloqueio")}`));

  const acoes = el("div", "acoes");
  const btnDeNovo = el("button", "primario", t("comum.jogarDeNovo"));
  btnDeNovo.addEventListener("click", aoJogarDeNovo);
  const btnVoltar = el("button", undefined, t("comum.voltarInicio"));
  btnVoltar.addEventListener("click", aoVoltar);
  acoes.append(btnDeNovo, btnVoltar);
  raiz.append(acoes);

  raiz.append(rodapeFontes());
}
