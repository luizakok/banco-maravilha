import { t } from "../../i18n";
import { faseDoTurno } from "../../game/fases";
import type { PartidaTrad } from "../../game/tradicional";
import { CAMPOS_NEVOA, relacoesFortes } from "../../game/tradicional";
import { painelIndicadores } from "../components/indicadores";
import { rodapeFontes } from "../components/fontes";
import { barraValorDoBanco, dashboardLinhas } from "../components/graficos";
import { el, limpar } from "../dom";

/** Rótulo de um motivo de explicação (decisões, encadeamentos ou eventos). */
export function rotuloMotivo(motivo: string): string {
  return motivo.startsWith("evento.") ? t(`porqueEvento.${motivo.slice("evento.".length)}`) : t(`porque.${motivo}`);
}

const fmt1 = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1).replace(".", ",")}`;

/** Motivos que vêm do que o jogador escolheu — e não da inércia do mercado, de encadeamentos ou do chefão. */
const PREFIXOS_DECISAO = ["contratar.", "interno.", "ld.", "ia.", "hibrido.", "flex.", "capacidade."];

/** Um ponto dourado por semestre em que o jogador decidiu algo, com a decisão no title. */
export function marcasDaPartida(part: PartidaTrad): Map<number, string> {
  const marcas = new Map<number, string>();
  part.explicacoesPorTurno.forEach((exps, i) => {
    const daDecisao = exps.filter((ex) => PREFIXOS_DECISAO.some((pre) => ex.motivo.startsWith(pre)));
    const principal = relacoesFortes(daDecisao, 1)[0];
    if (principal) marcas.set(i + 1, rotuloMotivo(principal.motivo));
  });
  return marcas;
}

/** Resultado do semestre (com névoa nos indicadores de pessoas não revelados). */
export function telaResultadoTrad(raiz: HTMLElement, part: PartidaTrad, aoContinuar: () => void) {
  limpar(raiz);
  const atual = part.estado;
  const anterior = part.historico.at(-1); // fecharTurno ainda não rodou
  const fase = faseDoTurno(atual.turno);
  raiz.classList.add(`fase-${fase}`);

  raiz.append(el("h2", undefined, t("resultado.tituloSemestre")));
  raiz.append(el("p", "faixa-ano", t(`resultado.fase${fase}`)));

  const ocultos = CAMPOS_NEVOA.filter((c) => part.reveladas[c] === 0);
  raiz.append(painelIndicadores(atual, anterior, { ocultos }));
  raiz.append(barraValorDoBanco(atual));

  // ── O que mais mexeu: as 1-2 relações causais mais fortes, em linguagem simples ──
  raiz.append(el("h3", "titulo-secao", t("resultado.causasTitulo")));
  const exps = part.explicacoesPorTurno.at(-1) ?? [];
  const fortes = relacoesFortes(exps);
  if (fortes.length === 0) {
    raiz.append(el("p", "relogio", t("resultado.causaSemNada")));
  } else {
    const causas = el("ul", "causas");
    for (const rel of fortes) {
      const li = el("li");
      li.append(el("strong", undefined, rotuloMotivo(rel.motivo)));
      const efeitos = rel.campos
        .slice(0, 3)
        .map((c) => `${t(`indicadores.${c.campo}`)} ${fmt1(c.delta)}`)
        .join(" · ");
      li.append(document.createTextNode(` — ${efeitos}`));
      causas.append(li);
    }
    raiz.append(causas);
  }

  // ── Mini dashboard: a linha de cada indicador desde 2027 ──
  raiz.append(el("h3", "titulo-secao", t("resultado.dashboardTitulo")));
  raiz.append(dashboardLinhas([...part.historico, atual], marcasDaPartida(part), ocultos));
  raiz.append(el("p", "relogio", t("resultado.dashboardNota")));

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
  const motivos = [...new Set(exps.map((ex) => ex.motivo))];
  for (const motivo of motivos) lista.append(el("li", undefined, rotuloMotivo(motivo)));
  porque.append(lista);
  raiz.append(porque);

  const acoes = el("div", "acoes");
  const btn = el("button", "primario", t("comum.continuar"));
  btn.addEventListener("click", aoContinuar);
  acoes.append(btn);
  raiz.append(acoes);

  raiz.append(rodapeFontes());
}
