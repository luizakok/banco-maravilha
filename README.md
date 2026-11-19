# Banco Maravilha / The Amazing Bank

Um jogo gratuito e aberto de **estratégia de pessoas**: você lidera o RH de um banco fictício entre 2027 e 2030 e descobre, na prática, que estratégia de gente **é** estratégia de negócio — e que cada decisão tem efeitos diferentes no curto, médio e longo prazo.

- 🎮 **Modo Expresso** (~5 min): 4 turnos anuais, uma carta por turno.
- 🏦 **Modo Tradicional** (~15 min): 8 semestres, orçamento por semestre, névoa de guerra sobre os indicadores de pessoas, três chefões e eventos.
- 🎯 **Mandato de 2030**: a CEO pede três metas no início, e é por elas que você é cobrado no fim. Metade mora em indicador na névoa — escolher uma é aceitar ser medido por algo que você só vê se pagar pelo dado.
- 🔒 **Preparo destrava respostas**: nos chefões, algumas saídas só existem se você se preparou semestres antes. As travadas ficam à vista, com o motivo.
- 🌐 Português e English.
- 🧾 100% estático: sem backend, sem login, sem cookies, sem analytics.

## Rodar localmente

```bash
npm install
npm run dev        # servidor local
npm run test       # testes (vitest)
npm run typecheck  # tsc --noEmit
npm run build      # build estático em dist/
```

Requisitos: Node 20+.

## Como o modelo funciona

Toda a simulação é **determinística e pura**: `(estado, decisões, seed) → novo estado + explicações`. Não há IA nem rede em tempo de execução.

Os números do modelo vivem em [`src/model/params.json`](src/model/params.json), sempre como pares `{ "valor": ..., "fonte": "..." }` — cada parâmetro cita a pesquisa que o inspirou (NBER w31161, Bidwell/Wharton, Bloom et al. (Nature, 2024), WEF Future of Jobs 2025, Gallup). Os links completos aparecem no debrief do jogo. Quer calibrar o jogo? Edite `params.json` e rode os testes.

Textos e nomes do banco ficam apenas em `src/content/i18n/pt.json` e `en.json` — o código não contém strings de conteúdo.

## Feedback via Google Forms (opcional)

O jogo pode mostrar, no debrief, um botão que abre um Google Forms **pré-preenchido** com o resumo da partida (o jogador vê os campos antes de abrir e nada é enviado automaticamente).

1. Crie um Google Form com campos de resposta curta para: modo, idioma, final, valor do banco, notas (curto/médio/longo), decisões-chave, resumo de decisões, versão do modelo e id da partida.
2. Em "Obter link pré-preenchido", preencha qualquer coisa em cada campo e copie a URL gerada — ela revela os códigos `entry.XXXXXXX` de cada campo.
3. Em [`src/config.ts`](src/config.ts), cole a URL base do formulário em `FEEDBACK_FORM_URL` e mapeie cada campo em `FEEDBACK_FIELDS`.

Se `FEEDBACK_FORM_URL` ficar vazio, o botão de feedback não aparece.

## Publicar no GitHub Pages

O repositório já inclui um workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) que builda e publica a cada push na `main`.

1. Crie um repositório no GitHub e faça push.
2. Em **Settings → Pages**, selecione **Source: GitHub Actions**.
3. Pronto — o jogo fica em `https://SEU_USUARIO.github.io/NOME_DO_REPO/`.

O build usa `base: "./"` (caminhos relativos), então funciona em qualquer subcaminho.

## Créditos e licenças

- Código: [MIT](LICENSE).
- Fontes: [VT323](https://fonts.google.com/specimen/VT323) e [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible), ambas sob [SIL Open Font License 1.1](public/fonts/OFL.txt), incluídas no repositório.
- Arte em pixel e sons: gerados por código neste repositório (nenhum asset de terceiros).
