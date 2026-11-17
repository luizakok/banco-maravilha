import { t } from "../../i18n";
import type { CartaDef, PartidaExpress, TurnoDef } from "../../game/express";
import { TURNOS_EXPRESS } from "../../game/express";
import { caixaDialogo } from "../components/dialog";
import { painelIndicadores } from "../components/indicadores";
import { el, limpar } from "../dom";

export function telaTurnoExpress(
  raiz: HTMLElement,
  p: PartidaExpress,
  indiceTurno: number,
  aoEscolher: (carta: CartaDef) => void
) {
  const def: TurnoDef = TURNOS_EXPRESS[indiceTurno];
  limpar(raiz);

  raiz.append(
    el("p", "tag-turno", `${t("comum.turno")} ${indiceTurno + 1} ${t("comum.de")} ${TURNOS_EXPRESS.length}`)
  );
  if (def.chefao) raiz.append(el("h2", "centro", `⚠ ${t("express.chefaoAviso")} ⚠`));
  raiz.append(el("div", "manchete", t(def.mancheteKey)));

  for (const fala of def.falas)
    raiz.append(caixaDialogo(t(`conselheiros.${fala.conselheiro}`), t(fala.key), fala.conselheiro));

  raiz.append(painelIndicadores(p.estado, p.historico.at(-2)));

  raiz.append(el("h3", undefined, t("comum.escolha")));
  const grade = el("div", "cartas");
  for (const carta of def.cartas) {
    const btn = el("button", "carta");
    btn.append(
      el("span", "titulo", t(`cartas.${carta.id}.titulo`)),
      el("span", "conselheiro", `— ${t(`conselheiros.${t(`cartas.${carta.id}.conselheiro`)}`)}`),
      el("span", "descricao", t(`cartas.${carta.id}.descricao`))
    );
    btn.addEventListener("click", () => aoEscolher(carta));
    grade.append(btn);
  }
  raiz.append(grade);
}
