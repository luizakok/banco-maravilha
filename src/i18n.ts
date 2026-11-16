import pt from "./content/i18n/pt.json";
import en from "./content/i18n/en.json";

export type Idioma = "pt" | "en";

const dicionarios: Record<Idioma, unknown> = { pt, en };

let idiomaAtual: Idioma = "pt";

export function setIdioma(id: Idioma) {
  idiomaAtual = id;
}

export function getIdioma(): Idioma {
  return idiomaAtual;
}

function buscar(dic: unknown, caminho: string): string | undefined {
  const partes = caminho.split(".");
  let no: unknown = dic;
  for (let i = 0; i < partes.length; i++) {
    if (no == null || typeof no !== "object") return undefined;
    const obj = no as Record<string, unknown>;
    // chaves podem conter pontos (ex.: porque["contratar.imediato"])
    const restante = partes.slice(i).join(".");
    if (typeof obj[restante] === "string") return obj[restante] as string;
    no = obj[partes[i]];
  }
  return typeof no === "string" ? no : undefined;
}

/** Traduz uma chave. Cai para PT e, por fim, para a própria chave. */
export function t(chave: string): string {
  return buscar(dicionarios[idiomaAtual], chave) ?? buscar(dicionarios.pt, chave) ?? chave;
}

/** Traduz com placeholders: tf("x", { v: 10 }) troca {v} por 10. */
export function tf(chave: string, vars: Record<string, string | number>): string {
  let s = t(chave);
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
