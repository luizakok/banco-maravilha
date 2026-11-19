import type { Estado } from "../../model/types";
import { t, tf } from "../../i18n";
import { p } from "../../model/simulate";

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
  /** Motivo narrativo da névoa, por campo. */
  motivos?: Partial<Record<string, string>>;
}

/** Botão "i" que abre a explicação do indicador e a referência do jogo. */
function botaoAjuda(campo: string, texto: string): { botao: HTMLButtonElement; ajuda: HTMLParagraphElement } {
  const ajuda = document.createElement("p");
  ajuda.className = "indicador-ajuda";
  ajuda.hidden = true;
  ajuda.textContent = texto;

  const botao = document.createElement("button");
  botao.className = "btn-info";
  botao.type = "button";
  botao.textContent = "i";
  botao.setAttribute("aria-expanded", "false");
  botao.setAttribute("aria-label", tf("indicadores.ajudaSobre", { nome: t(`indicadores.${campo}`) }));
  botao.addEventListener("click", () => {
    ajuda.hidden = !ajuda.hidden;
    botao.setAttribute("aria-expanded", String(!ajuda.hidden));
  });
  return { botao, ajuda };
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

    const topo = document.createElement("div");
    topo.className = "indicador-topo";
    const rotulo = document.createElement("span");
    rotulo.className = "rotulo";
    rotulo.textContent =
      t(`indicadores.${def.campo}`) +
      (def.campo === "eficiencia" ? ` (${t("indicadores.eficienciaDica")})` : "");
    const referencia = tf("indicadores.referencia", {
      valor: def.fmt(p(`benchmark.${def.campo}`)),
    });
    const { botao, ajuda } = botaoAjuda(
      def.campo,
      `${t(`indicadores.ajuda.${def.campo}`)} ${referencia}`
    );
    topo.append(rotulo, botao);

    const valor = document.createElement("span");
    valor.className = "valor";
    if (oculto) {
      valor.textContent = "?";
      div.classList.add("na-nevoa");
      div.append(topo, valor);
      const motivo = nevoa?.motivos?.[def.campo];
      if (motivo) div.append(Object.assign(document.createElement("p"), { className: "nevoa-motivo", textContent: motivo }));
      else valor.title = t("nevoa.oculto");
      div.append(ajuda);
      grade.append(div);
      continue;
    }
    valor.textContent = def.fmt(v);
    div.append(topo, valor);
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
    div.append(ajuda);
    grade.append(div);
  }

  // risco (categórico, sem média de mercado)
  const div = document.createElement("div");
  div.className = "indicador";
  const topo = document.createElement("div");
  topo.className = "indicador-topo";
  const rotulo = document.createElement("span");
  rotulo.className = "rotulo";
  rotulo.textContent = t("indicadores.risco");
  const { botao, ajuda } = botaoAjuda("risco", t("indicadores.ajuda.risco"));
  topo.append(rotulo, botao);
  const valor = document.createElement("span");
  valor.className = "valor";
  valor.textContent = t(`indicadores.risco${e.risco}`);
  div.append(topo, valor, ajuda);
  grade.append(div);
  return grade;
}
