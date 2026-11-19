import { t, tf } from "../../i18n";
import { avatarAtual } from "../../game/avatar";
import {
  ABORDAGENS,
  custoTotal,
  gapsDoTurno,
  montarDecisao,
  opcoesDoGap,
  politicasDisponiveis,
  recorrenteTotal,
  type Abordagem,
  type Escolhas,
  type OpcaoGap,
  type Politica,
} from "../../game/gaps";
import { CAMPOS_PREVISTOS, confiancaDe, preverTurno } from "../../game/previsao";
import { recorrenteAtivo, TOTAL_TURNOS, turnoAtual, type PartidaTrad } from "../../game/tradicional";
import { p } from "../../model/simulate";
import type { Alavanca } from "../../model/types";
import { el, limpar } from "../dom";
import { icone, retratoUrl } from "../components/pixel";
import { tocar } from "../som";

const ICONE_AREA: Record<string, string> = {
  atendimentoIA: "atendimento",
  dadosSaida: "dados",
  legadoCredito: "credito",
  backoffice: "backoffice",
  squadIA: "tecnologia",
  comercialDigital: "comercial",
  governancaModelos: "risco",
  lideranca: "lideranca",
  sucessao: "sucessao",
};

const EMOJI_ETIQUETA: Record<string, string> = {
  rapido: "⚡",
  lento: "⏳",
  caro: "💰",
  arriscado: "🎲",
};

function rotuloOpcao(o: OpcaoGap): string {
  return tf(`gaps.${o.gapId}.${o.abordagem}`, {
    n: Math.round(o.esforco * 100),
    f: Math.round(o.esforco),
    tot: p("ia.totalFamilias"),
  });
}

function etiquetas(lista: string[]): HTMLElement {
  const box = el("div", "etiquetas");
  for (const e of lista) {
    const tag = el("span", "etiqueta", `${EMOJI_ETIQUETA[e]} ${t(`etiquetas.${e}`)}`);
    tag.title = t(`etiquetas.${e}Dica`);
    box.append(tag);
  }
  return box;
}

function precos(custo: number, recorrente: number): HTMLElement {
  const box = el("div", "precos");
  const unico = el("span", "preco", `🪙 ${custo}`);
  unico.title = t("decisao.custoUnico");
  box.append(unico);
  if (recorrente > 0) {
    const rec = el("span", "preco preco-recorrente", `🔄 ${recorrente}${t("decisao.porSemestre")}`);
    rec.title = t("decisao.custoRecorrente");
    box.append(rec);
  }
  return box;
}

/** Régua dos semestres restantes, marcando onde cada escolha deposita o efeito. */
function reguaDoTempo(turno: number, marcas: { lag: number; rotulo: string }[]): HTMLElement {
  const box = el("div", "regua");
  box.append(el("h3", undefined, t("decisao.reguaTitulo")));
  const linha = el("div", "regua-linha");
  for (let s = turno; s <= TOTAL_TURNOS; s++) {
    const cel = el("div", "regua-cel");
    cel.append(el("span", "regua-num", String(s)));
    const aqui = marcas.filter((m) => Math.min(TOTAL_TURNOS, turno + m.lag) === s);
    for (const m of aqui) {
      const marca = el("span", "regua-marca", m.lag === 0 ? "⚡" : "🌱");
      marca.title = m.rotulo;
      cel.append(marca);
    }
    if (s === turno) cel.classList.add("regua-agora");
    linha.append(cel);
  }
  box.append(linha);
  box.append(el("p", "relogio", t("decisao.reguaNota")));
  return box;
}

function blocoPrevisao(part: PartidaTrad, decisao: ReturnType<typeof montarDecisao>): HTMLElement {
  const box = el("div", "previsao");
  box.append(el("h3", undefined, t("decisao.previsaoTitulo")));
  const conf = confiancaDe(part.estado.analyticsAcumulado);
  box.append(el("p", "relogio", t(`decisao.previsao${conf === "cega" ? "Cega" : conf === "direcao" ? "Direcao" : "Precisa"}`)));
  const grade = el("div", "previsao-grade");
  const linhas = preverTurno(part.estado, decisao);
  for (const campo of CAMPOS_PREVISTOS) {
    const l = linhas.find((x) => x.campo === campo)!;
    const cel = el("div", "previsao-cel");
    cel.append(el("span", "rotulo", t(`indicadores.${campo}`)));
    if (l.direcao === null || l.faixa === null) {
      cel.append(el("span", "previsao-valor na-nevoa", "?"));
    } else {
      const seta = l.direcao === "sobe" ? "↑" : l.direcao === "desce" ? "↓" : "→";
      const [a, b] = l.faixa;
      const faixa =
        l.direcao === "estavel"
          ? t("decisao.previsaoEstavel")
          : `${a > 0 ? "+" : ""}${a.toFixed(1)} … ${b > 0 ? "+" : ""}${b.toFixed(1)}`;
      cel.append(el("span", "previsao-valor", `${seta} ${faixa}`));
    }
    grade.append(cel);
  }
  box.append(grade);
  return box;
}

/** Decisão do semestre: fechar os gaps de workforce planning do turno. */
export function telaDecisaoTrad(
  raiz: HTMLElement,
  part: PartidaTrad,
  aoConfirmar: (esc: Escolhas) => void
) {
  const turno = turnoAtual(part);
  const gaps = gapsDoTurno(turno);
  const politicas = politicasDisponiveis(part.estado.hibridoAtivo);
  const esc: Escolhas = { porGap: {}, politicas: [] };
  /** abordagem expandida por gap (passo 2 da escolha) */
  const abertoPorGap: Record<string, Abordagem | null> = {};

  const opcoesPorGap = new Map(gaps.map((g) => [g.id, opcoesDoGap(g)]));
  const selecionadas = (): OpcaoGap[] =>
    Object.values(esc.porGap)
      .map((id) => [...opcoesPorGap.values()].flat().find((o) => o.id === id))
      .filter((o): o is OpcaoGap => !!o);

  const gasto = () => custoTotal(esc, politicas);
  const restante = () => part.orcamento - gasto();

  const iniciativas = () => {
    const d = montarDecisao(esc, politicas, part.copilotosAtivos);
    return (Object.keys(d.alocacao) as Alavanca[]).filter(
      (a) => a !== "analytics" && (d.alocacao[a] ?? 0) > 0
    ).length;
  };

  const render = () => {
    limpar(raiz);
    raiz.append(
      el("p", "tag-turno", `${t("tradicional.semestre")} ${turno} ${t("comum.de")} ${TOTAL_TURNOS}`)
    );

    const cabecalho = el("div", "cabecalho-diretoria");
    const img = document.createElement("img");
    img.src = retratoUrl(avatarAtual());
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.className = "retrato retrato-diretoria";
    cabecalho.append(img);
    const txt = el("div");
    txt.append(el("h2", undefined, t("decisao.titulo")));
    txt.append(el("p", "relogio", t("decisao.subtitulo")));
    cabecalho.append(txt);
    raiz.append(cabecalho);

    // ── Orçamento ──
    const barra = el("div", "barra-orcamento");
    barra.append(el("span", "saldo-moedas", `🪙 ${restante()} / ${part.orcamento}`));
    const rec = recorrenteAtivo(part) + recorrenteTotal(esc);
    if (rec > 0) {
      const chip = el("span", "chip-recorrente", `🔄 ${rec}${t("decisao.porSemestre")}`);
      chip.title = t("decisao.compromissosDica");
      barra.append(chip);
    }
    const max = p("capacidade.maxIniciativas");
    const chipIni = el("span", "chip-iniciativas", `${t("decisao.iniciativas")}: ${iniciativas()}/${max}`);
    barra.append(chipIni);
    raiz.append(barra);
    if (iniciativas() > max) raiz.append(el("p", "centro aviso", `⚠ ${tf("decisao.avisoCapacidade", { max })}`));

    // ── Gaps ──
    raiz.append(el("h3", "titulo-secao", t("decisao.gapsTitulo")));
    for (const gap of gaps) {
      const card = el("div", "gap");
      const topo = el("div", "gap-topo");
      const ic = icone(ICONE_AREA[gap.id] ?? "backoffice", "icone-pixel icone-area");
      if (ic) topo.append(ic);
      const tit = el("div");
      tit.append(el("h4", undefined, t(`gaps.${gap.id}.titulo`)));
      tit.append(el("p", "gap-contexto", t(`gaps.${gap.id}.contexto`)));
      topo.append(tit);
      card.append(topo);

      // Passo 1: a abordagem (build/buy/borrow/bot). Passo 2: o tamanho do pacote.
      const todas = opcoesPorGap.get(gap.id)!;
      const escolhida = todas.find((o) => o.id === esc.porGap[gap.id]);
      const aberta = abertoPorGap[gap.id] ?? escolhida?.abordagem ?? null;

      const grade = el("div", "gap-opcoes");
      for (const abordagem of ABORDAGENS) {
        const daAbordagem = todas.filter((o) => o.abordagem === abordagem);
        if (daAbordagem.length === 0) continue;
        const b = el("button", "opcao-gap opcao-abordagem-btn");
        b.type = "button";
        const ativa = aberta === abordagem;
        const temEscolha = escolhida?.abordagem === abordagem;
        if (temEscolha) b.classList.add("escolhida");
        if (ativa) b.classList.add("aberta");
        b.setAttribute("aria-pressed", String(temEscolha));
        b.setAttribute("aria-expanded", String(ativa));
        const cabeca = el("div", "opcao-cabeca");
        const ia = icone(abordagem, "icone-pixel");
        if (ia) cabeca.append(ia);
        cabeca.append(el("span", "opcao-abordagem", t(`abordagens.${abordagem}`)));
        b.append(cabeca);
        const faixa = daAbordagem.map((o) => o.custo);
        b.append(el("span", "opcao-faixa", `🪙 ${Math.min(...faixa)}–${Math.max(...faixa)}`));
        b.append(etiquetas(daAbordagem[0].etiquetas));
        b.addEventListener("click", () => {
          abertoPorGap[gap.id] = aberta === abordagem ? null : abordagem;
          render();
        });
        grade.append(b);
      }
      const nada = el("button", "opcao-gap opcao-nada");
      nada.type = "button";
      nada.textContent = t("decisao.naoAgir");
      if (!escolhida) nada.classList.add("escolhida");
      nada.setAttribute("aria-pressed", String(!escolhida));
      nada.addEventListener("click", () => {
        delete esc.porGap[gap.id];
        abertoPorGap[gap.id] = null;
        render();
      });
      grade.append(nada);
      card.append(grade);

      if (aberta) {
        const tams = el("div", "gap-tamanhos");
        tams.append(el("p", "gap-tamanhos-titulo", t("decisao.escolhaTamanho")));
        for (const o of todas.filter((x) => x.abordagem === aberta)) {
          const b = el("button", "opcao-gap opcao-tamanho-btn");
          b.type = "button";
          const sel = esc.porGap[gap.id] === o.id;
          if (sel) b.classList.add("escolhida");
          b.setAttribute("aria-pressed", String(sel));
          const cabeca = el("div", "opcao-cabeca");
          cabeca.append(el("span", "tamanho", o.tamanho));
          cabeca.append(precos(o.custo, o.recorrente));
          b.append(cabeca);
          b.append(el("span", "opcao-texto", rotuloOpcao(o)));
          b.disabled = !sel && restante() + (escolhida?.custo ?? 0) < o.custo;
          b.addEventListener("click", () => {
            if (sel) delete esc.porGap[gap.id];
            else esc.porGap[gap.id] = o.id;
            render();
          });
          tams.append(b);
        }
        card.append(tams);
      }
      raiz.append(card);
    }

    // ── Políticas ──
    raiz.append(el("h3", "titulo-secao", t("decisao.politicasTitulo")));
    const grid = el("div", "politicas");
    for (const pol of politicas) {
      const card = el("div", "politica");
      const b = el("button", "opcao-gap");
      b.type = "button";
      const ligada = esc.politicas.includes(pol.id);
      if (ligada) b.classList.add("escolhida");
      b.setAttribute("aria-pressed", String(ligada));
      b.append(el("span", "opcao-texto", t(`politicas.${pol.id}`)));
      b.append(precos(pol.custo, pol.recorrente));
      b.disabled = !ligada && restante() < pol.custo;
      b.addEventListener("click", () => {
        if (ligada) esc.politicas = esc.politicas.filter((x) => x !== pol.id);
        else {
          // híbrido e híbrido-com-GPR são a mesma ativação: escolher um troca o outro
          if (pol.id === "hibrido") esc.politicas = esc.politicas.filter((x) => x !== "gpr");
          if (pol.id === "gpr") esc.politicas = esc.politicas.filter((x) => x !== "hibrido");
          esc.politicas.push(pol.id);
        }
        render();
      });
      const ajuda = el("p", "indicador-ajuda");
      ajuda.hidden = true;
      ajuda.textContent = t(`politicas.${pol.id}Ajuda`);
      const info = el("button", "btn-info", "i");
      info.type = "button";
      info.setAttribute("aria-expanded", "false");
      info.setAttribute("aria-label", tf("indicadores.ajudaSobre", { nome: t(`politicas.${pol.id}`) }));
      info.addEventListener("click", () => {
        ajuda.hidden = !ajuda.hidden;
        info.setAttribute("aria-expanded", String(!ajuda.hidden));
      });
      const linha = el("div", "politica-linha");
      linha.append(b, info);
      card.append(linha, ajuda);
      grid.append(card);
    }
    raiz.append(grid);

    // ── Régua + previsão ──
    const marcas = selecionadas().map((o) => ({ lag: o.lag, rotulo: rotuloOpcao(o) }));
    for (const pid of esc.politicas) {
      const pol = politicas.find((x) => x.id === pid);
      if (pol) marcas.push({ lag: pol.lag, rotulo: t(`politicas.${pol.id}`) });
    }
    raiz.append(reguaDoTempo(turno, marcas));
    raiz.append(blocoPrevisao(part, montarDecisao(esc, politicas, part.copilotosAtivos)));

    // ── Assinar ──
    const acoes = el("div", "acoes");
    const btn = el("button", "primario botao-assinar", `✒ ${t("decisao.assinar")}`);
    btn.addEventListener("click", () => assinar(raiz, () => aoConfirmar(esc)));
    acoes.append(btn);
    raiz.append(acoes);
  };

  render();
}

/** Animação de assinatura: o avatar assina a decisão do semestre. */
function assinar(raiz: HTMLElement, pronto: () => void) {
  const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (reduzido) {
    pronto();
    return;
  }
  tocar("confirmar");
  const capa = el("div", "assinatura");
  const papel = el("div", "assinatura-papel");
  const img = document.createElement("img");
  img.src = retratoUrl(avatarAtual());
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.className = "retrato retrato-diretoria";
  papel.append(img);
  papel.append(el("p", undefined, t("decisao.assinando")));
  const traco = el("div", "assinatura-traco");
  const caneta = icone("caneta", "icone-pixel caneta");
  if (caneta) traco.append(caneta);
  papel.append(traco);
  capa.append(papel);
  raiz.append(capa);

  let feito = false;
  const concluir = () => {
    if (feito) return;
    feito = true;
    pronto();
  };
  capa.addEventListener("click", concluir);
  setTimeout(concluir, 900);
}
