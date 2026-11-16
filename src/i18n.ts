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
  let no: unknown = dic;
  for (const parte of caminho.split(".")) {
    if (no == null || typeof no !== "object") return undefined;
    no = (no as Record<string, unknown>)[parte];
  }
  return typeof no === "string" ? no : undefined;
}

/** Traduz uma chave. Cai para PT e, por fim, para a própria chave. */
export function t(chave: string): string {
  return buscar(dicionarios[idiomaAtual], chave) ?? buscar(dicionarios.pt, chave) ?? chave;
}
