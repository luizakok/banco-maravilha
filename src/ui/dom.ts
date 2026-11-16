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
  raiz.scrollTop = 0;
  window.scrollTo(0, 0);
}
