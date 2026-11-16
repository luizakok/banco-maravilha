import paramsJson from "./model/params.json";
import type { Decisao } from "./model/types";
import { FEEDBACK_FIELDS, FEEDBACK_FORM_URL } from "./config";

export interface DadosFeedback {
  modo: "express" | "tradicional";
  idioma: string;
  final: string;
  valorBanco: number;
  notas: { curto: string; medio: string; longo: string };
  /** Resumo textual das decisões mais importantes, ex.: "T3 Δ-5,2 chefao.ondaIA.nps". */
  decisoesChave: string;
  decisoes: Decisao[];
  idPartida: string;
}

const ABREV: Record<string, string> = {
  contratar: "CT",
  interno: "IN",
  ld_cargo: "LD",
  ld_realocar: "LR",
  ia_auto: "AU",
  ia_copiloto: "CO",
  hibrido: "HB",
  flex: "FX",
  analytics: "AN",
};

/** Resumo compacto das decisões: "T1:LD2,CO4|T2:CT3|..." */
export function resumirDecisoes(decisoes: Decisao[]): string {
  return decisoes
    .map((d, i) => {
      const partes = Object.entries(d.alocacao)
        .filter(([, v]) => (v ?? 0) > 0)
        .map(([a, v]) => `${ABREV[a] ?? a}${v}`);
      if (d.gestaoPorResultados) partes.push("GPR");
      return `T${i + 1}:${partes.join(",") || "-"}`;
    })
    .join("|");
}

/** Hash curto (FNV-1a) do params.json: identifica a versão do modelo. */
export function versaoModelo(): string {
  const s = JSON.stringify(paramsJson);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Pares campo->valor que serão enviados (para a prévia e para a URL). */
export function camposFeedback(d: DadosFeedback): [string, string][] {
  return [
    ["modo", d.modo],
    ["idioma", d.idioma],
    ["final", d.final],
    ["valorBanco", d.valorBanco.toFixed(1)],
    ["notaCurto", d.notas.curto],
    ["notaMedio", d.notas.medio],
    ["notaLongo", d.notas.longo],
    ["decisoesChave", d.decisoesChave],
    ["resumoDecisoes", resumirDecisoes(d.decisoes)],
    ["versaoModelo", versaoModelo()],
    ["idPartida", d.idPartida],
  ];
}

/** Monta a URL pré-preenchida do Google Forms. null se não configurado. */
export function construirUrlFeedback(d: DadosFeedback): string | null {
  if (!FEEDBACK_FORM_URL) return null;
  const params = new URLSearchParams({ usp: "pp_url" });
  for (const [campo, valor] of camposFeedback(d)) {
    const entry = FEEDBACK_FIELDS[campo];
    if (entry) params.set(entry, valor);
  }
  let url = `${FEEDBACK_FORM_URL}?${params.toString()}`;
  // Garante URL < 2000 caracteres cortando o campo mais longo (resumo)
  if (url.length >= 2000) {
    const excesso = url.length - 1999;
    const entry = FEEDBACK_FIELDS.resumoDecisoes;
    const resumo = resumirDecisoes(d.decisoes);
    params.set(entry, resumo.slice(0, Math.max(0, resumo.length - excesso)));
    url = `${FEEDBACK_FORM_URL}?${params.toString()}`;
  }
  return url;
}
