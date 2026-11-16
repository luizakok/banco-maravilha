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

export interface OpcoesNevoa {
  /** Campos escondidos: mostram "?" no lugar do valor. */
  ocultos?: string[];
  /** Valores a exibir no lugar do real (insight possivelmente enganoso). */
  substitutos?: Partial<Record<string, number>>;
}

export function painelIndicadores(e: Estado, anterior?: Estado, nevoa?: OpcoesNevoa): HTMLElement {
  const grade = document.createElement("div");
  grade.className = "indicadores";
  for (const def of DEFS) {
    const oculto = nevoa?.ocultos?.includes(def.campo) ?? false;
    const substituto = nevoa?.substitutos?.[def.campo];
    const v = substituto ?? (e[def.campo] as number);
    const div = document.createElement("div");
    div.className = "indicador";
    const rotulo = document.createElement("span");
    rotulo.className = "rotulo";
    rotulo.textContent =
      t(`indicadores.${def.campo}`) +
      (def.campo === "eficiencia" ? ` (${t("indicadores.eficienciaDica")})` : "");
    const valor = document.createElement("span");
    valor.className = "valor";
    if (oculto) {
      valor.textContent = "?";
      valor.title = t("nevoa.oculto");
      div.classList.add("na-nevoa");
      div.append(rotulo, valor);
      grade.append(div);
      continue;
    }
    valor.textContent = def.fmt(v);
    div.append(rotulo, valor);
    if (anterior && substituto === undefined) {
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
