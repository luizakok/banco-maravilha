const CHAVE_EXPRESS = "bancomaravilha.expressConcluido";

export function expressConcluido(): boolean {
  try {
    return localStorage.getItem(CHAVE_EXPRESS) === "1";
  } catch {
    return false;
  }
}

export function marcarExpressConcluido() {
  try {
    localStorage.setItem(CHAVE_EXPRESS, "1");
  } catch {
    /* navegação privada: segue sem persistir */
  }
}
