/**
 * Feedback por Google Forms pré-preenchido (ver README).
 * Deixe FEEDBACK_FORM_URL vazio para esconder o botão de feedback.
 */
export const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdHfTW_Wj4wrZAE_OcXC999LW8J60LYOLa5fFLV4SFGWn2U6A/viewform";

/**
 * Mapa campo do jogo -> entry.XXXXXXX do formulário.
 *
 * Só entram aqui os campos que o jogo sabe responder sozinho. As perguntas que
 * são da pessoa — a nota de 0 a 10 e o texto aberto — ficam de fora de propósito:
 * campo pré-preenchido é campo que ninguém relê.
 */
export const FEEDBACK_FIELDS: Record<string, string> = {
  modo: "entry.1987672316",
  idioma: "entry.565191924",
  final: "entry.1823144255",
  valorBanco: "entry.1952246539",
  notaCurto: "entry.1914221259",
  notaMedio: "entry.1193267295",
  notaLongo: "entry.826145208",
  decisoesChave: "entry.255270642",
  resumoDecisoes: "entry.283685977",
  versaoModelo: "entry.1256154348",
  idPartida: "entry.1007661146",
};
