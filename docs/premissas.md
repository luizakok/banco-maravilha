# Ficha de premissas — Banco Maravilha / The Amazing Bank

Unidades: 1 turno = 1 semestre (modo Tradicional, 8 turnos de 2027 a 2030).
Orçamento = **10 moedas/turno**. Efeitos "por moeda" escalam linearmente. pp = pontos percentuais.
Todos os valores vivem em `src/model/params.json`, cada um com `valor` e `fonte`.

## Estado inicial (2027)

| Coeficiente | Valor | Fonte |
|---|---|---|
| Engajamento | 62/100 | premissa de design |
| Turnover voluntário | 12%/ano | premissa de design |
| Prontidão de skills | 45% | premissa inspirada no WEF (39% das skills mudam até 2030) |
| Custo de pessoal (índice) | 100 | premissa de design |
| Receita (índice) | 100 | premissa de design |
| Índice de eficiência | 62 | premissa de design (faixa típica de bancos incumbentes) |
| NPS | 30 | premissa de design |
| Risco | Médio | premissa de design |
| Pressão competitiva (por turno) | receita −0,5; NPS −1 | premissa de design (bancos digitais) |

## Recrutamento e seleção

| Coeficiente | Valor | Fonte |
|---|---|---|
| Contratar fora: prontidão | +3 pp/moeda, imediato | premissa calibrada |
| Contratar fora: custo de pessoal | +2%/moeda (prêmio ~20%) | https://knowledge.wharton.upenn.edu/article/why-external-hires-get-paid-more-and-perform-worse-than-internal-staff/ |
| Externos: performance nos 4 primeiros turnos | 80% do ganho nominal (20% chega com lag de 4 turnos) | Bidwell/Wharton (pior avaliação nos 2 primeiros anos) |
| Externos: turnover | +0,3 pp/moeda por 4 turnos (~+25% relativo) | Bidwell/Wharton (saem mais) |
| Promover/mover interno: prontidão | +1,5 pp/moeda, lag 1 turno | premissa derivada de Bidwell (direção inversa) |
| Promover interno: engajamento | +2/moeda | premissa de design |

## L&D

| Coeficiente | Valor | Fonte |
|---|---|---|
| Requalificar no cargo: prontidão | +2 pp/moeda, lag 2 turnos | https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/ (29 de 100 no cargo) |
| Requalificar e realocar: prontidão | +3 pp/moeda, lag 3 turnos | WEF 2025 (19 de 100 realocados) |
| Custo imediato: receita do turno | −0,5%/moeda (horas em sala) | premissa de design |
| Engajamento por investir em L&D | +2/moeda, lag 1 turno | premissa de design |
| Cortar L&D: prontidão | −1,5 pp/turno a partir do 2º turno sem investir | premissa de design |
| Cortar L&D: penalidade em chefão | dano ×1,5 se prontidão <40% | premissa de design ("gap explode na crise") |

## IA

| Coeficiente | Valor | Fonte |
|---|---|---|
| Automatizar (2 moedas = 1 família): custo de pessoal | −4%/moeda, lag 1 turno | premissa de design |
| Automatizar SEM requalificar: engajamento | −8 por família | premissa de design |
| Automatizar SEM requalificar: turnover | +3 pp, lag 1 turno | premissa de design |
| Automatizar SEM requalificar: risco e prontidão | risco +1 nível; prontidão −2 pp | premissa de design |
| Automatizar COM requalificação no mesmo turno | efeitos negativos ÷2 | premissa de design |
| Copiloto: produtividade → receita da família | +14% média (≈ +0,55%/turno de receita por família, lag 1) | https://www.nber.org/papers/w31161 |
| Copiloto: bônus para novatos (contratação externa recente) | ×1,5 (direção dos +34% para novatos) | NBER w31161 |
| Copiloto: turnover | −0,3 pp por família, lag 2 turnos | NBER w31161 (retenção, direção) |
| Copiloto sem L&D nos últimos 2 turnos | ganhos ÷2 | premissa derivada do NBER |
| Licença do copiloto | 1 moeda/turno por família | premissa de design |

## Futuro do trabalho

| Coeficiente | Valor | Fonte |
|---|---|---|
| Híbrido: turnover | −33% relativo, lag 1 turno | https://pmc.ncbi.nlm.nih.gov/articles/PMC11208135/ (Bloom, Han e Liang, Nature 2024) |
| Híbrido: desempenho/receita | efeito zero | Bloom 2024 |
| Híbrido: custo | 2 moedas únicas COM gestão por resultados; 1 moeda SEM | premissa de design |
| Híbrido SEM gestão por resultados | engajamento −3/turno e metade do ganho de turnover | premissa de design |
| Força de trabalho flexível ("borrow") | prontidão +2 pp/moeda imediata, custo +1%/moeda | premissa de design |

## People analytics

| Coeficiente | Valor | Fonte |
|---|---|---|
| Revelar 1 indicador por 2 turnos | 0,5 moeda | premissa de design |
| Previsão de turnover (alerta 1 turno antes) | 1 moeda | premissa de design |
| Piloto (revela o efeito real antes de escalar) | 1 moeda | premissa de design |
| Chance de insight enganoso (correlação ≠ causa) | 20%, revelado no debrief | premissa de design |
| Histórico de analytics ≥2 moedas | chefão A Auditoria 1 nível mais brando | premissa de design |

## Encadeamento pessoas → negócio (nenhuma alavanca age direto no negócio)

| Coeficiente | Valor | Fonte |
|---|---|---|
| Engajamento +10 → receita | +0,45%/turno, lag 3 (≈ +1,8% acumulado em 4 turnos) | https://www.gallup.com/workplace/713024/employee-engagement-and-productivity.aspx (+18% produtividade; correlação, uso conservador) |
| Engajamento +10 → NPS | +0,5/turno, lag 2 (≈ +2 acumulado) | Gallup Q12 2024 (+10% fidelidade) |
| Turnover: custo de reposição | custo +0,375%/turno por pp acima de 12% (≈ 1× salário anual) | https://www.gallup.com/workplace/247391/fixable-problem-costs-businesses.aspx (0,5×–2×) |
| Prontidão +10 pp → receita | +0,4%/turno, lag 3 | premissa de design |
| Prontidão <40% → risco | +1 nível | premissa de design |
| Risco melhora | −1 nível após 2 turnos com prontidão >55% e sem automação sem requalificação | premissa de design |
| Turnover >18% → prontidão | −2 pp/turno (perda de conhecimento) | premissa de design |
| Eficiência | derivada: 62 × custo ÷ receita | definição |

## Capacidade de mudança e dívida de pessoas

| Coeficiente | Valor | Fonte |
|---|---|---|
| Máx. iniciativas simultâneas (alavancas com moedas, exceto analytics) | 3 | premissa de design |
| Excesso | engajamento −5 por iniciativa acima de 3 | premissa de design |
| Gatilho de dívida | engajamento <45 ou prontidão <35 | premissa de design |
| Juros da dívida | receita −1%/turno e turnover +0,5 pp/turno; sana após 2 turnos seguidos acima dos gatilhos | premissa de design |

## Chefões (Tradicional) — premissas de design

| Chefão | Turno | Dano / mitigação |
|---|---|---|
| A Onda da IA | 3 | NPS −8 e receita −2; se ≥2 famílias com copiloto ou automação: NPS −2, receita 0 |
| O Caça-Talentos | 5 | prontidão −6 e turnover +2 pp; se híbrido ativo ou copiloto ou engajamento ≥65: prontidão −1 |
| A Auditoria | 7 | risco alto: receita −5, custo +3; médio: receita −2; baixo: 0; analytics ≥2 moedas no histórico melhora 1 nível |
| Penalidade geral | — | dano ×1,5 se prontidão <40% |

## Placar e finais — premissas de design

| Coeficiente | Valor |
|---|---|
| Valor do Banco | 40% receita + 30% nota de eficiência (ef 80→0, ef 45→100) + 20% NPS (0–100) + 10% risco (baixo 100, médio 50, alto 0) |
| Notas por horizonte | média do delta de Valor nos turnos 1–2 / 3–5 / 6–8, mapeada em A–E |
| O Apostador | ≥3 famílias automatizadas com prontidão <50% em qualquer momento |
| O Arquiteto | Valor do Banco final ≥ 100 e sem dívida ativa em 2030 |
| O Jardineiro | (engajamento ≥68 ou prontidão ≥70) e receita final <100 |
| O Bombeiro | os demais casos (ganhou no curto, chegou frágil) |

## Critérios de teste (Vitest)

5 estratégias automáticas, 3 seeds cada: só contratar, só treinar, só IA, equilibrada, aleatória.
- Nenhuma extrema supera a equilibrada no Valor do Banco.
- Só contratar → Bombeiro ou Jardineiro (custo explode). Só treinar → Jardineiro. Só IA → O Apostador. Equilibrada → O Arquiteto. Aleatória → termina sem erro, com qualquer final.
- Mesma seed + mesmas decisões → mesmo resultado (determinismo); indicadores sempre dentro dos limites.
