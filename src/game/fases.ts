/**
 * A partida vai de 2027 a 2030. Cada ano é uma fase, com seu escritório e sua
 * paleta: o banco muda de cara enquanto o jogador decide.
 */
export type Fase = 1 | 2 | 3 | 4;

/** Semestres 1-2 = fase 1 (2027), 3-4 = fase 2, e assim por diante. */
export function faseDoTurno(turno: number): Fase {
  return Math.min(4, Math.max(1, Math.ceil(turno / 2))) as Fase;
}

export function anoDoTurno(turno: number): number {
  return 2026 + faseDoTurno(turno);
}

/** Houve virada de ano entre o turno que fechou e o próximo? */
export function viraOAno(turnoAnterior: number, turnoNovo: number): boolean {
  return faseDoTurno(turnoNovo) > faseDoTurno(turnoAnterior);
}
