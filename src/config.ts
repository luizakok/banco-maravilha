/**
 * Feedback por Google Forms pré-preenchido (ver README).
 * Deixe FEEDBACK_FORM_URL vazio para esconder o botão de feedback.
 */
export const FEEDBACK_FORM_URL = "";

/** Mapa campo do jogo -> entry.XXXXXXX do formulário. Preencher depois. */
export const FEEDBACK_FIELDS: Record<string, string> = {
  modo: "entry.0000001",
  idioma: "entry.0000002",
  final: "entry.0000003",
  valorBanco: "entry.0000004",
  notaCurto: "entry.0000005",
  notaMedio: "entry.0000006",
  notaLongo: "entry.0000007",
  decisoesChave: "entry.0000008",
  resumoDecisoes: "entry.0000009",
  versaoModelo: "entry.0000010",
  idPartida: "entry.0000011",
};
