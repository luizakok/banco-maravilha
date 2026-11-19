export type Avatar = "diretora" | "diretor";

const CHAVE = "bancomaravilha.avatar";

let atual: Avatar =
  typeof localStorage !== "undefined" && localStorage.getItem(CHAVE) === "diretor" ? "diretor" : "diretora";

export function avatarAtual(): Avatar {
  return atual;
}

export function setAvatar(a: Avatar) {
  atual = a;
  if (typeof localStorage !== "undefined") localStorage.setItem(CHAVE, a);
}
