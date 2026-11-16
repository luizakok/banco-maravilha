import { simularPartida, valorDoBanco } from "../src/model/scoring";
import { equilibrada, soContratar, soIA, soTreinar } from "../tests/estrategias";
for (const [nome, decs] of [["equilibrada", equilibrada()], ["soContratar", soContratar()], ["soTreinar", soTreinar()], ["soIA", soIA()]] as const) {
  const r = simularPartida(decs, 42);
  console.log(`== ${nome} -> ${r.final} valor=${r.valorFinal.toFixed(1)} notas=${JSON.stringify(r.notas)}`);
  for (const e of r.historico) {
    console.log(`T${e.turno} eng=${e.engajamento.toFixed(0)} to=${e.turnover.toFixed(1)} pront=${e.prontidao.toFixed(0)} custo=${e.custoPessoal.toFixed(0)} rec=${e.receita.toFixed(0)} nps=${e.nps.toFixed(0)} risco=${e.risco} ef=${e.eficiencia.toFixed(1)} divida=${e.dividaAtiva} valor=${valorDoBanco(e).toFixed(1)}`);
  }
}
