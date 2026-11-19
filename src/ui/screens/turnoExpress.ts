import { t } from "../../i18n";
import type { CartaDef, PartidaExpress, TurnoDef } from "../../game/express";
import { TURNOS_EXPRESS } from "../../game/express";
import { avatarAtual } from "../../game/avatar";
import { caixaDialogo } from "../components/dialog";
import { painelIndicadores } from "../components/indicadores";
import { retratoUrl } from "../components/pixel";
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

  const cabecalho = el("div", "cabecalho-diretoria");
  const img = document.createElement("img");
  img.src = retratoUrl(avatarAtual());
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.className = "retrato retrato-diretoria";
  cabecalho.append(img);
  cabecalho.append(el("h3", undefined, t("comum.escolha")));
  raiz.append(cabecalho);

  let escolhida: CartaDef | null = null;
  const grade = el("div", "cartas");
  const acoes = el("div", "acoes");
  const assinar = el("button", "primario botao-assinar", `✒ ${t("decisao.assinar")}`);
  assinar.disabled = true;
  assinar.addEventListener("click", () => {
    if (escolhida) aoEscolher(escolhida);
  });

  for (const carta of def.cartas) {
    const btn = el("button", "carta");
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.append(
      el("span", "titulo", t(`cartas.${carta.id}.titulo`)),
      el("span", "descricao", t(`cartas.${carta.id}.descricao`))
    );
    btn.addEventListener("click", () => {
      escolhida = carta;
      for (const outro of grade.querySelectorAll("button")) {
        outro.classList.remove("escolhida");
        outro.setAttribute("aria-pressed", "false");
      }
      btn.classList.add("escolhida");
      btn.setAttribute("aria-pressed", "true");
      assinar.disabled = false;
    });
    grade.append(btn);
  }
  raiz.append(grade);
  acoes.append(assinar);
  raiz.append(acoes);
}
