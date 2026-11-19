import { t } from "../../i18n";
import { el } from "../dom";

/** A pesquisa que sustenta o modelo. As mesmas fontes citadas no params.json. */
export const PESQUISA: { chave: string; url: string }[] = [
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

function link(chave: string, url: string, texto: string): HTMLAnchorElement {
  const a = el("a", undefined, texto);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.title = t(`pesquisa.${chave}`);
  return a;
}

/** Rodapé de fontes em letra pequena, para as telas de resultado. */
export function rodapeFontes(): HTMLElement {
  const box = el("footer", "fontes");
  box.append(el("span", undefined, `${t("comum.fontes")}: `));
  PESQUISA.forEach((item, i) => {
    if (i > 0) box.append(document.createTextNode(" · "));
    box.append(link(item.chave, item.url, t(`pesquisaCurto.${item.chave}`)));
  });
  return box;
}

/** Lista completa das fontes, com o título do estudo (debrief). */
export function listaFontes(): HTMLElement {
  const ul = el("ul");
  for (const item of PESQUISA) {
    const li = el("li");
    li.append(link(item.chave, item.url, t(`pesquisa.${item.chave}`)));
    ul.append(li);
  }
  return ul;
}
