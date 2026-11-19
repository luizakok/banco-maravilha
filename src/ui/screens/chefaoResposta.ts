/**
 * A resposta ao chefão. Chega depois da decisão assinada, no lugar do evento
 * menor (semestres de chefão não têm evento). A opção travada fica na tela com
 * cadeado e motivo: a porta fechada ensina mais que a porta escondida.
 */
import { t } from "../../i18n";
import type { ChefaoDef, RespostaChefao } from "../../game/chefoes";
import { respostasDisponiveis } from "../../game/chefoes";
import type { PartidaTrad } from "../../game/tradicional";
import { chefao as retratoChefao } from "../components/pixel";
import { el, limpar } from "../dom";

export function telaChefaoResposta(
  raiz: HTMLElement,
  part: PartidaTrad,
  def: ChefaoDef,
  aoEscolher: (r: RespostaChefao) => void
) {
  limpar(raiz);

  const topo = el("div", "chefao-faixa");
  topo.append(el("div", "alarme"));
  const linha = el("div", "chefao-topo");
  const img = retratoChefao(def.id);
  if (img) linha.append(img);
  const texto = el("div", "chefao-texto");
  texto.append(el("p", "chefao-aviso", `⚠ ${t("chefaoResposta.rotulo")} ⚠`));
  texto.append(el("h2", "chefao-nome", t(`chefoes.${def.id}.nome`)));
  texto.append(el("p", "chefao-fala", t(`chefoes.${def.id}.cobranca`)));
  linha.append(texto);
  topo.append(linha);
  raiz.append(topo);

  raiz.append(el("p", "relogio centro", t("chefaoResposta.instrucao")));

  const grade = el("div", "cartas");
  for (const { resposta, liberada } of respostasDisponiveis(def, part)) {
    const btn = el("button", `carta carta-chefao${liberada ? "" : " travada"}`) as HTMLButtonElement;
    btn.append(
      el("span", "titulo", `${liberada ? "" : "🔒 "}${t(`chefoes.${def.id}.${resposta.id}`)}`)
    );
    btn.append(el("span", "descricao", t(`chefoes.${def.id}.${resposta.id}Texto`)));
    if (liberada) {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        btn.disabled = true;
        aoEscolher(resposta);
      });
    } else {
      btn.disabled = true;
      btn.append(el("span", "meta-alvo motivo-cadeado", t(`chefoes.${def.id}.${resposta.id}Travado`)));
    }
    grade.append(btn);
  }
  raiz.append(grade);
}
