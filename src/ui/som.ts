/**
 * Som chiptune 100% gerado por código (WebAudio). Desligado por padrão.
 * Nenhum arquivo de áudio; apenas osciladores de onda quadrada/triângulo.
 */

const CHAVE = "bancomaravilha.som";

let ctx: AudioContext | null = null;
let ligado = localStorage.getItem(CHAVE) === "1";

export function somLigado(): boolean {
  return ligado;
}

export function alternarSom(): boolean {
  ligado = !ligado;
  localStorage.setItem(CHAVE, ligado ? "1" : "0");
  if (ligado) tocar("clique");
  return ligado;
}

function contexto(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface Nota {
  freq: number;
  dur: number;
  atraso: number;
  tipo?: OscillatorType;
  vol?: number;
}

function nota(ac: AudioContext, n: Nota) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = n.tipo ?? "square";
  osc.frequency.value = n.freq;
  const t0 = ac.currentTime + n.atraso;
  const vol = n.vol ?? 0.06;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + n.dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + n.dur + 0.02);
}

const EFEITOS: Record<string, Nota[]> = {
  clique: [{ freq: 880, dur: 0.06, atraso: 0 }],
  confirmar: [
    { freq: 523, dur: 0.08, atraso: 0 },
    { freq: 784, dur: 0.1, atraso: 0.08 },
  ],
  bom: [
    { freq: 523, dur: 0.08, atraso: 0 },
    { freq: 659, dur: 0.08, atraso: 0.09 },
    { freq: 784, dur: 0.14, atraso: 0.18 },
  ],
  ruim: [
    { freq: 392, dur: 0.1, atraso: 0, tipo: "triangle" },
    { freq: 311, dur: 0.18, atraso: 0.11, tipo: "triangle" },
  ],
  chefao: [
    { freq: 196, dur: 0.14, atraso: 0, vol: 0.08 },
    { freq: 185, dur: 0.14, atraso: 0.16, vol: 0.08 },
    { freq: 196, dur: 0.22, atraso: 0.32, vol: 0.08 },
  ],
  final: [
    { freq: 523, dur: 0.12, atraso: 0 },
    { freq: 659, dur: 0.12, atraso: 0.13 },
    { freq: 784, dur: 0.12, atraso: 0.26 },
    { freq: 1047, dur: 0.3, atraso: 0.39 },
  ],
};

export type Efeito = keyof typeof EFEITOS;

export function tocar(efeito: Efeito) {
  if (!ligado) return;
  try {
    const ac = contexto();
    for (const n of EFEITOS[efeito]) nota(ac, n);
  } catch {
    // áudio indisponível: segue sem som
  }
}

/** Botão de alternar som (🔊/🔇), para o canto das telas. */
export function botaoSom(aoMudar?: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "btn-som";
  const render = () => {
    btn.textContent = ligado ? "🔊" : "🔇";
    btn.setAttribute("aria-pressed", String(ligado));
  };
  btn.addEventListener("click", () => {
    alternarSom();
    render();
    aoMudar?.();
  });
  render();
  return btn;
}
