import { getIdioma, t, tf } from "../../i18n";
import type { PartidaTrad } from "../../game/tradicional";
import { DECISAO_EQUILIBRADA, decisoesChave, eSe, resumoTrad } from "../../game/tradicional";
import { valorDoBanco } from "../../model/scoring";
import { camposFeedback, construirUrlFeedback, type DadosFeedback } from "../../feedback";
import { painelIndicadores } from "../components/indicadores";
import { el, limpar } from "../dom";
import { rotuloMotivo } from "./resultadoTrad";

const PESQUISA: { chave: string; url: string }[] = [
  { chave: "nber", url: "https://www.nber.org/papers/w31161" },
  {
    chave: "bidwell",
    url: "https://knowledge.wharton.upenn.edu/article/why-external-hires-get-paid-more-and-perform-worse-than-internal-staff/",
  },
  { chave: "bloom", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11208135/" },
  { chave: "wef", url: "https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/" },
  { chave: "gallupQ12", url: "https://www.gallup.com/workplace/713024/employee-engagement-and-productivity.aspx" },
  { chave: "gallupCusto", url: "https://www.gallup.com/workplace/247391/fixable-problem-costs-businesses.aspx" },
];

const fmt1 = (v: number) => v.toFixed(1).replace(".", ",");

/** Debrief do modo Tradicional: final, timeline, top 3, E se?, pesquisa e feedback. */
export function telaDebriefTrad(
  raiz: HTMLElement,
  part: PartidaTrad,
  aoJogarDeNovo: () => void,
  aoVoltar: () => void
) {
  limpar(raiz);
  const r = resumoTrad(part);

  // ── Final ──
  const card = el("div", "final-card");
  card.append(el("h2", undefined, t(`finais.${r.final}.nome`)));
  card.append(el("p", undefined, t(`finais.${r.final}.texto`)));
  card.append(el("div", "valorzao", r.valor.toFixed(0)));
  card.append(el("p", "tag-turno", t("resultado.valorBanco") + " — 2030"));
  raiz.append(card);

  raiz.append(painelIndicadores(part.estado)); // sem névoa: o debrief revela tudo

  const notas = el("p", "centro");
  notas.textContent = `${t("debrief.notas")}: ${t("debrief.curto")} ${r.notas.curto} · ${t(
    "debrief.medio"
  )} ${r.notas.medio} · ${t("debrief.longo")} ${r.notas.longo}`;
  raiz.append(notas);

  // ── Valor do Banco semestre a semestre ──
  raiz.append(el("h3", undefined, t("debrief2.valorCaminho")));
  const valores = part.historico.map(valorDoBanco);
  const maxV = Math.max(...valores, 1);
  const grafico = el("div", "grafico-valor");
  valores.forEach((v, i) => {
    const col = el("div", "grafico-col");
    const barra = el("div", "grafico-barra");
    barra.style.height = `${Math.max(4, (v / maxV) * 72)}px`;
    barra.title = i === 0 ? `2027 (início): ${v.toFixed(0)}` : `${t("tradicional.semestre")} ${i}: ${v.toFixed(0)}`;
    col.append(el("span", "grafico-num", v.toFixed(0)), barra, el("span", "grafico-rotulo", i === 0 ? "·" : String(i)));
    grafico.append(col);
  });
  raiz.append(grafico);

  // ── Top 3 decisões + E se? ──
  raiz.append(el("h3", undefined, t("debrief2.decisoesChave")));
  raiz.append(el("p", "relogio", t("debrief2.eSeExplica")));
  const listaTop = el("div");
  for (const dc of decisoesChave(part)) {
    const item = el("div", "decisao-chave");
    const sinal = dc.deltaValor >= 0 ? "+" : "−";
    item.append(
      el(
        "p",
        undefined,
        `${t("tradicional.semestre")} ${dc.turno} — ${t("resultado.valorBanco")} ${sinal}${fmt1(
          Math.abs(dc.deltaValor)
        )}${dc.motivoPrincipal ? ` · ${rotuloMotivo(dc.motivoPrincipal)}` : ""}`
      )
    );
    const btn = el("button", undefined, tf("debrief2.eSeBotao", { t: dc.turno }));
    const resposta = el("p", "intel-msg");
    btn.addEventListener("click", () => {
      const alt = eSe(part, dc.turno, DECISAO_EQUILIBRADA);
      resposta.textContent = `🔁 ${tf("debrief2.eSeResultado", { v: alt.toFixed(0), v0: r.valor.toFixed(0) })}`;
      btn.disabled = true;
    });
    item.append(btn, resposta);
    listaTop.append(item);
  }
  raiz.append(listaTop);

  // ── Dados que enganaram você ──
  if (part.insightsEnganosos.length > 0) {
    raiz.append(el("h3", undefined, t("debrief2.insightsEnganosos")));
    const ul = el("ul");
    for (const ins of part.insightsEnganosos) {
      ul.append(
        el(
          "li",
          undefined,
          tf("debrief2.insightEnganosoItem", {
            t: ins.turno,
            campo: t(`indicadores.${ins.campo}`),
            mostrado: fmt1(ins.mostrado),
            real: fmt1(ins.real),
          })
        )
      );
    }
    raiz.append(ul);
  }

  // ── Pesquisa ──
  const detPesquisa = el("details", "porque");
  detPesquisa.append(el("summary", undefined, t("debrief2.pesquisa")));
  const ulP = el("ul");
  for (const item of PESQUISA) {
    const li = el("li");
    const a = el("a", undefined, t(`pesquisa.${item.chave}`));
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    li.append(a);
    ulP.append(li);
  }
  detPesquisa.append(ulP);
  raiz.append(detPesquisa);

  raiz.append(el("p", "centro manchete", t("debrief.pergunta")));

  // ── Feedback (só se configurado) ──
  const dados: DadosFeedback = {
    modo: "tradicional",
    idioma: getIdioma(),
    final: r.final,
    valorBanco: r.valor,
    notas: r.notas,
    decisoesChave: decisoesChave(part)
      .map((dc) => `T${dc.turno} Δ${fmt1(dc.deltaValor)} ${dc.motivoPrincipal}`)
      .join("; "),
    decisoes: part.decisoes,
    idPartida: part.seed.toString(16),
  };
  const url = construirUrlFeedback(dados);
  const blocoFeedback = el("div", "centro");
  if (url) {
    const btnFb = el("button", undefined, t("feedback.botao"));
    btnFb.addEventListener("click", () => {
      btnFb.disabled = true;
      const previa = el("div", "feedback-previa");
      previa.append(el("p", undefined, t("feedback.previaTitulo")));
      const ul = el("ul");
      for (const [campo, valor] of camposFeedback(dados)) ul.append(el("li", undefined, `${campo}: ${valor}`));
      previa.append(ul);
      previa.append(el("p", "relogio", t("feedback.previaAviso")));
      const acoesFb = el("div", "acoes");
      const abrir = el("button", "primario", t("feedback.abrir"));
      abrir.addEventListener("click", () => window.open(url, "_blank", "noopener"));
      const cancelar = el("button", undefined, t("feedback.cancelar"));
      cancelar.addEventListener("click", () => {
        previa.remove();
        btnFb.disabled = false;
      });
      acoesFb.append(abrir, cancelar);
      previa.append(acoesFb);
      blocoFeedback.append(previa);
    });
    blocoFeedback.append(btnFb);
  }
  raiz.append(blocoFeedback);

  // ── Replay em destaque ──
  const acoes = el("div", "acoes");
  const btnDeNovo = el("button", "primario", t("comum.jogarDeNovo"));
  btnDeNovo.addEventListener("click", aoJogarDeNovo);
  const btnVoltar = el("button", undefined, t("comum.voltarInicio"));
  btnVoltar.addEventListener("click", aoVoltar);
  acoes.append(btnDeNovo, btnVoltar);
  raiz.append(acoes);
}
