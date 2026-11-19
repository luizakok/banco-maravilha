export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  texto?: string
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (texto !== undefined) n.textContent = texto;
  return n;
}

export function limpar(raiz: HTMLElement) {
  raiz.replaceChildren();
  // o tema da fase pertence à tela: o da tela anterior não pode vazar
  for (const c of [...raiz.classList]) if (c.startsWith("fase-")) raiz.classList.remove(c);
  raiz.scrollTop = 0;
  window.scrollTo(0, 0);
}
