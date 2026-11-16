import type { Estado } from "../../model/types";
import { t } from "../../i18n";

interface Def {
  campo: keyof Estado;
  fmt: (v: number) => string;
  bomQuandoSobe: boolean;
}

const DEFS: Def[] = [
  { campo: "engajamento", fmt: (v) => v.toFixed(0), bomQuandoSobe: true },
  { campo: "turnover", fmt: (v) => `${v.toFixed(1)}%`, bomQuandoSobe: false },
  { campo: "prontidao", fmt: (v) => `${v.toFixed(0)}%`, bomQuandoSobe: true },
  { campo: "custoPessoal", fmt: (v) => v.toFixed(0), bomQuandoSobe: false },
  { campo: "receita", fmt: (v) => v.toFixed(0), bomQuandoSobe: true },
  { campo: "eficiencia", fmt: (v) => v.toFixed(1), bomQuandoSobe: false },
  { campo: "nps", fmt: (v) => v.toFixed(0), bomQuandoSobe: true },
];

export function painelIndicadores(e: Estado, anterior?: Estado): HTMLElement {
  const grade = document.createElement("div");
  grade.className = "indicadores";
  for (const def of DEFS) {
    const v = e[def.campo] as number;
    const div = document.createElement("div");
    div.className = "indicador";
    const rotulo = document.createElement("span");
    rotulo.className = "rotulo";
    rotulo.textContent =
      t(`indicadores.${def.campo}`) +
      (def.campo === "eficiencia" ? ` (${t("indicadores.eficienciaDica")})` : "");
    const valor = document.createElement("span");
    valor.className = "valor";
    valor.textContent = def.fmt(v);
    div.append(rotulo, valor);
    if (anterior) {
      const delta = v - (anterior[def.campo] as number);
      if (Math.abs(delta) >= 0.05) {
        const s = document.createElement("span");
        const bom = def.bomQuandoSobe ? delta > 0 : delta < 0;
        s.className = bom ? "delta-pos" : "delta-neg";
        s.textContent = ` ${delta > 0 ? "▲" : "▼"}${Math.abs(delta).toFixed(1)}`;
        valor.append(s);
      }
    }
    grade.append(div);
  }
  // risco (categórico)
  const div = document.createElement("div");
  div.className = "indicador";
  div.innerHTML = `<span class="rotulo">${t("indicadores.risco")}</span><span class="valor">${t(
    `indicadores.risco${e.risco}`
  )}</span>`;
  grade.append(div);
  return grade;
}
