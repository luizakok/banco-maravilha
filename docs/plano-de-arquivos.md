# Plano de arquivos

```
banco-maravilha/
├── index.html
├── package.json / tsconfig.json / vite.config.ts   (base p/ GitHub Pages)
├── LICENSE                      (MIT)
├── README.md                    (rodar, ajustar params, Google Forms, publicar)
├── .github/workflows/deploy.yml (build + deploy no Pages)
├── public/fonts/                (fonte pixel p/ títulos + fonte legível p/ corpo, OFL, no repo)
├── docs/premissas.md            (esta ficha)
├── src/
│   ├── main.ts                  (bootstrap, roteia telas)
│   ├── config.ts                (FEEDBACK_FORM_URL, FEEDBACK_FIELDS — placeholders)
│   ├── feedback.ts              (URL pré-preenchida, prévia, hash do params.json)
│   ├── model/
│   │   ├── params.json          (todos os coeficientes: { valor, fonte })
│   │   ├── types.ts             (Estado, Decisão, EfeitoPendente, Resultado)
│   │   ├── rng.ts               (PRNG com seed — mulberry32)
│   │   ├── simulate.ts          (pura: (estado, decisões, seed) → novo estado + explicações)
│   │   └── scoring.ts           (Valor do Banco, notas por horizonte, dívida, finais)
│   ├── game/
│   │   ├── state.ts             (máquina de estados, save em localStorage)
│   │   ├── express.ts           (4 turnos, cartas, 1 chefão)
│   │   └── tradicional.ts       (8 turnos, orçamento, névoa, 3 chefões)
│   ├── content/
│   │   ├── i18n/pt.json, en.json  (inclui os nomes do banco)
│   │   ├── events.json / bosses.json / cards.json / advisors.json
│   ├── ui/
│   │   ├── screens/             (título, briefing, inteligência, decisão, resultado, debrief)
│   │   ├── components/          (dialogbox RPG, medidores, mapa-overworld, "Por quê?")
│   │   ├── pixelart.ts          (sprites em canvas, paleta própria)
│   │   └── audio.ts             (chiptune WebAudio, OFF por padrão)
│   └── styles/
└── tests/
    ├── simulate.test.ts         (determinismo, limites, efeitos da tabela do brief)
    └── strategies.test.ts       (5 estratégias e critérios)
```

Nota de modelagem: a alavanca "Workforce planning" (build/buy/borrow/bot) se expressa no motor
pela combinação das outras alavancas — build = L&D, buy = contratar, borrow = flex, bot = IA.
Na UI ela vira o mapa de skills por família que orienta essas escolhas.
