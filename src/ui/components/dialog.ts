/** Caixa de diálogo estilo RPG com efeito máquina de escrever (pulável). */
export function caixaDialogo(falante: string, texto: string): HTMLElement {
  const caixa = document.createElement("div");
  caixa.className = "caixa-dialogo";
  const quem = document.createElement("span");
  quem.className = "falante";
  quem.textContent = falante;
  const corpo = document.createElement("p");
  corpo.style.margin = "0";
  caixa.append(quem, corpo);

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzir) {
    corpo.textContent = texto;
    return caixa;
  }

  let i = 0;
  let timer = 0;
  const escrever = () => {
    i += 1;
    corpo.textContent = texto.slice(0, i);
    if (i < texto.length) timer = window.setTimeout(escrever, 18);
  };
  escrever();
  caixa.addEventListener("click", () => {
    if (i < texto.length) {
      window.clearTimeout(timer);
      i = texto.length;
      corpo.textContent = texto;
    }
  });
  return caixa;
}
