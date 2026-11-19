/**
 * Como o jogador responde a um chefão.
 *
 * O chefão já tinha efeito na simulação (simulate.ts mitiga pelo preparo do
 * banco). O que faltava era a resposta: no semestre 3, 5 e 7, depois de assinar
 * a decisão, o jogador escolhe como enfrenta a crise — e algumas respostas só
 * existem se ele se preparou semestres antes. A opção travada continua na tela,
 * com cadeado e o motivo: o aprendizado está em ver a porta que você fechou.
 *
 * Fica em TypeScript, e não em JSON como os eventos menores, porque o requisito
 * é uma pergunta sobre o estado e não dá para escrever em dados.
 */
import type { EfeitoEvento, PartidaTrad } from "./tradicional";
import { p } from "../model/simulate";

export interface RespostaChefao {
  /** sufixo estável; a chave i18n é chefoes.<chefao>.<id> */
  id: string;
  efeitos: EfeitoEvento[];
  /** moedas a mais (ou a menos) no orçamento do próximo semestre */
  orcamentoDelta?: number;
  /** o que precisa estar verdadeiro para a resposta estar disponível */
  requisito?: (part: PartidaTrad) => boolean;
}

export interface ChefaoDef {
  id: string;
  turno: number;
  respostas: RespostaChefao[];
}

export const CHEFOES: ChefaoDef[] = [
  {
    id: "ondaIA",
    turno: p("chefoes.ondaIA.turno"),
    respostas: [
      {
        // só quem já tem IA rodando aqui dentro pode prometer escala sem mentir;
        // prontidão alta não basta, porque skill no papel não é IA em produção
        id: "escalar",
        efeitos: [
          { campo: "receita", delta: 3, percentual: true },
          { campo: "prontidao", delta: 3 },
        ],
        requisito: (part) =>
          part.estado.familiasComCopiloto + part.estado.familiasAutomatizadas >=
          p("chefoes.ondaIA.familiasParaMitigar"),
      },
      {
        id: "medir",
        efeitos: [{ analyticsDelta: 1 }, { campo: "prontidao", delta: 2 }],
        orcamentoDelta: -10,
      },
      {
        id: "adiar",
        efeitos: [
          { campo: "prontidao", delta: -4 },
          { campo: "engajamento", delta: -2 },
        ],
        orcamentoDelta: 10,
      },
    ],
  },
  {
    id: "cacaTalentos",
    turno: p("chefoes.cacaTalentos.turno"),
    respostas: [
      {
        // sem base de evidência você não sabe quem o mercado está sondando
        id: "trilha",
        efeitos: [
          { campo: "turnover", delta: -2.5 },
          { campo: "engajamento", delta: 4 },
        ],
        orcamentoDelta: -5,
        requisito: (part) => part.estado.analyticsAcumulado >= 2,
      },
      {
        id: "contraproposta",
        efeitos: [
          { campo: "turnover", delta: -3 },
          { campo: "custoPessoal", delta: 3, percentual: true },
        ],
        orcamentoDelta: -15,
      },
      {
        id: "aguentar",
        efeitos: [
          { campo: "turnover", delta: 2.5 },
          { campo: "engajamento", delta: -2 },
        ],
        orcamentoDelta: 10,
      },
    ],
  },
  {
    id: "auditoria",
    turno: p("chefoes.auditoria.turno"),
    respostas: [
      {
        // a auditoria quer trilha de evidência, não boa vontade
        id: "dossie",
        efeitos: [{ riscoDelta: -1 }, { campo: "nps", delta: 3 }],
        requisito: (part) => part.estado.analyticsAcumulado >= 4,
      },
      {
        // gestão por resultados é o controle que a auditoria aceita ler
        id: "gpr",
        efeitos: [{ riscoDelta: -1 }, { campo: "engajamento", delta: 3 }],
        requisito: (part) => part.estado.hibridoComGPR,
      },
      {
        id: "forcaTarefa",
        efeitos: [{ riscoDelta: -1 }, { campo: "engajamento", delta: -3 }],
        orcamentoDelta: -20,
      },
    ],
  },
];

export function chefaoDoTurno(turno: number): ChefaoDef | undefined {
  return CHEFOES.find((c) => c.turno === turno);
}

export interface RespostaNaTela {
  resposta: RespostaChefao;
  liberada: boolean;
}

/** As respostas do chefão na ordem da tela, já com o cadeado resolvido. */
export function respostasDisponiveis(chefao: ChefaoDef, part: PartidaTrad): RespostaNaTela[] {
  return chefao.respostas.map((resposta) => ({
    resposta,
    liberada: resposta.requisito === undefined || resposta.requisito(part),
  }));
}
