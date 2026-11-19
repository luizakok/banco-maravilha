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

/** Qualquer botão de som desenhado na tela se redesenha ao ouvir isto. */
const EVENTO = "bancomaravilha:som";

export function alternarSom(): boolean {
  ligado = !ligado;
  localStorage.setItem(CHAVE, ligado ? "1" : "0");
  if (ligado) tocar("clique");
  else pararTema();
  window.dispatchEvent(new Event(EVENTO));
  return ligado;
}

/**
 * O PRESS START liga o som: o clique é o consentimento, e é o que faz o
 * jogo soar como videogame. Quem já mutou alguma vez continua mudo.
 */
export function ligarSomNoPrimeiroClique(): void {
  if (localStorage.getItem(CHAVE) === null) {
    ligado = true;
    localStorage.setItem(CHAVE, "1");
    window.dispatchEvent(new Event(EVENTO));
  }
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
    { freq: 98, dur: 0.3, atraso: 0.32, tipo: "triangle", vol: 0.09 },
    { freq: 233, dur: 0.14, atraso: 0.6, vol: 0.08 },
    { freq: 220, dur: 0.14, atraso: 0.76, vol: 0.08 },
    { freq: 233, dur: 0.4, atraso: 0.92, vol: 0.08 },
    { freq: 116, dur: 0.5, atraso: 0.92, tipo: "triangle", vol: 0.09 },
  ],
  // passagem de ano: uma escada subindo, como um relógio avançando
  transicao: [
    { freq: 392, dur: 0.1, atraso: 0 },
    { freq: 523, dur: 0.1, atraso: 0.11 },
    { freq: 659, dur: 0.1, atraso: 0.22 },
    { freq: 784, dur: 0.24, atraso: 0.33 },
    { freq: 131, dur: 0.5, atraso: 0.33, tipo: "triangle", vol: 0.07 },
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

// ── Tema: um loop de 6,4s em lá menor, melodia em onda quadrada e baixo em triângulo ──

const PASSO = 0.2;
const PASSOS = 32;
const LOOP = PASSOS * PASSO;

/** [passo, frequência, duração em passos] */
const MELODIA: [number, number, number][] = [
  [0, 440, 2],
  [2, 523, 2],
  [4, 659, 3],
  [7, 587, 1],
  [8, 523, 2],
  [10, 659, 2],
  [12, 880, 4],
  [16, 784, 2],
  [18, 659, 2],
  [20, 698, 3],
  [23, 659, 1],
  [24, 587, 2],
  [26, 523, 2],
  [28, 494, 2],
  [30, 330, 2],
];

const BAIXO = [110, 110, 87, 87, 131, 131, 98, 82];

let temaInicio = 0;
let relogioTema: number | null = null;

function agendarCompasso(ac: AudioContext) {
  const base = temaInicio - ac.currentTime;
  for (const [passo, freq, dur] of MELODIA) {
    nota(ac, { freq, dur: dur * PASSO * 0.9, atraso: base + passo * PASSO, vol: 0.035 });
  }
  BAIXO.forEach((freq, i) => {
    nota(ac, { freq, dur: PASSO * 3.6, atraso: base + i * 4 * PASSO, tipo: "triangle", vol: 0.05 });
  });
  temaInicio += LOOP;
}

/**
 * Toca o tema em loop. O agendamento é absoluto (temaInicio), e não relativo ao
 * tick do setInterval: assim o compasso seguinte encosta no anterior sem engasgo.
 */
export function tocarTema() {
  if (!ligado || relogioTema !== null) return;
  try {
    const ac = contexto();
    temaInicio = ac.currentTime + 0.1;
    agendarCompasso(ac);
    relogioTema = window.setInterval(() => {
      if (!ligado) return pararTema();
      if (temaInicio - ac.currentTime < LOOP) agendarCompasso(ac);
    }, 400);
  } catch {
    // áudio indisponível: segue sem som
  }
}

export function pararTema() {
  if (relogioTema !== null) {
    clearInterval(relogioTema);
    relogioTema = null;
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
    aoMudar?.();
  });
  window.addEventListener(EVENTO, render);
  render();
  return btn;
}
