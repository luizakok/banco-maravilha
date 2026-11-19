export type Alavanca =
  | "contratar"
  | "interno"
  | "ld_cargo"
  | "ld_realocar"
  | "ia_auto"
  | "ia_copiloto"
  | "hibrido"
  | "flex"
  | "analytics";

/** Campos numéricos do estado que efeitos pendentes podem alterar. */
export type CampoNum = "engajamento" | "turnover" | "prontidao" | "custoPessoal" | "receita" | "nps";

export interface EfeitoPendente {
  turnosRestantes: number;
  campo: CampoNum;
  /** Delta absoluto (pp/pontos) ou percentual quando percentual=true (receita/custo). */
  delta: number;
  percentual?: boolean;
  motivo: string;
}

export interface Decisao {
  alocacao: Partial<Record<Alavanca, number>>;
  /** Híbrido com gestão por resultados (só relevante no turno em que ativa o híbrido). */
  gestaoPorResultados?: boolean;
}

export interface Estado {
  turno: number; // último turno concluído (0 = início)
  engajamento: number;
  turnover: number;
  prontidao: number;
  custoPessoal: number;
  receita: number;
  nps: number;
  risco: 0 | 1 | 2;
  eficiencia: number;
  pendentes: EfeitoPendente[];
  // memória do modelo
  hibridoAtivo: boolean;
  hibridoComGPR: boolean;
  familiasAutomatizadas: number;
  familiasComCopiloto: number;
  turnosSemLD: number;
  turnosDesdeContratacaoExterna: number; // 99 = nunca
  turnosRiscoSaudavel: number;
  automatizouSemLD: boolean;
  analyticsAcumulado: number;
  dividaAtiva: boolean;
  turnosSaudaveisDivida: number;
  // marcas para os finais
  apostadorMarcado: boolean;
}

export interface Explicacao {
  motivo: string;
  campo: CampoNum;
  delta: number;
}

export interface ResultadoTurno {
  estado: Estado;
  explicacoes: Explicacao[];
}

export type Final = "arquiteto" | "bombeiro" | "jardineiro" | "apostador";

export interface ResultadoPartida {
  historico: Estado[]; // historico[0] = inicial, [t] = fim do turno t
  valorFinal: number;
  notas: { curto: string; medio: string; longo: string };
  final: Final;
}
