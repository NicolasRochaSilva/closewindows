# closeWindows v2 — design

Data: 2026-10-21 · Autor da visão: Bruno (brunooutcore) · Base: fork do repo do Nicolas (`NicolasRochaSilva/closewindows`, commit `39329df`).

Documento-fonte para todas as sessões que constroem a v2. Quem implementa uma peça lê isto antes.

---

## 1. Visão

Um jogo de fases em que **toda fase é fechar uma janela** — e **cada fase é um mundo à parte**: arte, técnica e temática próprias (pixel art, 3D, low-poly, 2D, shader...). O que amarra o jogo não é um estilo visual, é a **casca** (console): login, parede de janelas, cronômetro, placar.

Decisões fechadas no brainstorm:

| Tema | Decisão |
|---|---|
| Relação com o repo do Nicolas | **Fork** (`brunooutcore/closewindows`), deploy e banco próprios; mostrar pronto e debater |
| Direção visual | **Híbrida**: cada fase/mundo com arte única. A casca é neutra para destacar a variedade |
| Casca | **Parede de janelas vivas** (não é um lugar físico) |
| Variante guardada | Casca medieval pixel (estilo Nicolas) para experimentar depois |
| Progressão | **Mundos** com desbloqueio em sequência; campanha + selecionar fase |
| Placar | **Pontuação única** por fase (tempo + tentativas); geral = soma das melhores |
| Tentativa | **Cada erro conta** (a fase avisa `erro()`); sem game over obrigatório |
| Cronômetro | Começa quando a fase termina de aparecer; para quando a janela trava |
| Falas | **Personagens de cada fase**, só texto (sem narrador global, sem voz). Efeitos sonoros continuam |
| Telas | **Celular e computador no mesmo nível** — toda fase jogável com o dedo |
| Conta | Usuário + senha, cadastro exige **código do time** |
| Fase como unidade | **Cartucho**: módulo isolado com contrato; o console executa |
| Isolamento | **Módulo na mesma página** (não iframe), com renderizador 3D compartilhado |
| Console | **Next.js + React Three Fiber** (+ drei), Prisma + Postgres |
| Extra | **Janela do dia** |

---

## 2. Caminho do jogador

1. **Fase 0 — login.** A tela é uma janela aberta em 3D; o formulário fica no vidro. Errou senha/código: a janela debocha. Entrou: a folha **fecha de verdade** (batida, trinco, poeira) e revela a parede.
2. **Parede de janelas.** Fundo neutro. Cada **mundo** é uma fileira; cada **fase** é uma janela com a **prévia ao vivo** da sua arte. Embaixo: melhor nota e melhor tempo. Fase trancada = janela fechada e escura. Topo: **Iniciar campanha** · **Janela do dia** · **Placar**.
3. **Dentro da fase.** A janela cresce até a tela inteira. HUD mínimo do console: cronômetro, tentativas, sair. Personagens falam em balões.
4. **Resultado.** Tempo, tentativas, nota, recorde? A janela encolhe de volta na parede, agora fechada. Campanha oferece a próxima.
5. **Janela do dia.** Uma fase sorteada por dia (meia-noite, `America/Sao_Paulo`), igual para todos, ignora desbloqueio. Ranking do dia + painel **quem fechou hoje / quem está devendo**.
6. **Placar.** Geral (soma das melhores notas), por fase (melhores tempos), do dia.

---

## 3. Arquitetura

```
src/
  app/                 Next.js: page.tsx monta o console; api/ (auth, tentativas, placar, progresso)
  console/             a casca — o "videogame"
    contrato.ts        tipos do cartucho (FaseMeta, FaseApi, Cartucho)
    Console.tsx        máquina de telas: login → parede → fase → resultado
    Palco3D.tsx        o <Canvas> único (R3F) + <View.Port/>, fixo em tela cheia
    Fase0Login.tsx     a janela de login (3D)
    Parede.tsx         parede de janelas vivas
    Runner.tsx         executa um cartucho: cronômetro, erros, falas, HUD, fechamento
    Resultado.tsx, Placar.tsx, JanelaDoDia.tsx, Balao.tsx, qualidade.ts
  fases/
    registro.ts        catálogo: mundos + metadados de cada fase + import preguiçoso
    <id>/              UM cartucho (pasta isolada)
  lib/                 sessão, prisma, pontuação, dia, sfx, motion (herdados/novos)
```

### 3.1 Contrato do cartucho

```ts
type Qualidade = "alta" | "media" | "baixa";

type FaseMeta = {
  id: string;            // kebab-case = nome da pasta, imutável
  mundo: string;         // id do mundo
  ordem: number;         // ordem global da campanha
  nome: string;
  autor: string;
  tempoAlvo: number;     // segundos; acima disso desconta
  tipo: "dom" | "three"; // onde o console monta o cartucho
};

type FaseApi = {
  erro(): void;                       // +1 tentativa (o console conta e mostra)
  fechou(): void;                     // venceu: chame UMA vez, no fim da animação de fechar
  fala(texto: string, quem?: string): void;  // balão de texto do personagem
  qualidade: Qualidade;               // celular/fraco → "baixa"
  reduzirMovimento: boolean;
  jaFechou: boolean;                  // o jogador já fechou essa fase antes
};

type Cartucho = {
  Jogo: ComponentType<{ api: FaseApi }>;
  Previa: ComponentType<{ qualidade: Qualidade }>;  // leve, roda na parede
};
```

- **`tipo: "dom"`** — `Jogo`/`Previa` são componentes DOM comuns (CSS, SVG, canvas 2D, PixiJS, Phaser, three.js em canvas próprio — o que o autor quiser). O console os monta numa caixa que ocupa a área da janela.
- **`tipo: "three"`** — `Jogo`/`Previa` são **conteúdo de cena R3F**. O console os monta dentro de um `<View>` do drei: **um único canvas WebGL** para o jogo todo (login, prévias e fase), cada view recortada no retângulo do seu elemento DOM. Isso é o "renderizador compartilhado": um contexto WebGL só, mesmo com 10 prévias 3D na parede.
- Código framework-agnóstico entra por `tipo: "dom"` com um `useEffect(() => mount(el), [])`.

### 3.2 Regras de isolamento (garantidas por convenção + revisão)

1. Uma versão de cada lib compartilhada (`three`, `@react-three/fiber`, `@react-three/drei`, `motion`), fixada no `package.json`. Lib exclusiva da fase: import dinâmico dentro da pasta dela.
2. CSS só com escopo (CSS Modules). Nada de escrever em `window`/`document` globais; listeners globais removidos no unmount.
3. Desmontar limpa tudo: geometrias, texturas, timers, `requestAnimationFrame`, listeners.
4. Erro na fase não derruba o jogo: o `Runner` envolve o cartucho num error boundary → "essa janela emperrou" → volta para a parede.
5. Cartucho não fala com o banco nem faz `fetch`: quem registra tentativa e fechamento é o console.
6. Fase jogável com toque (pointer events, alvos ≥ 44px) e com teclado.
7. Cores: tokens CSS de `globals.css` quando fizer sentido; a fase pode ter paleta própria (é um mundo à parte), declarada como variáveis no módulo dela.

### 3.3 Transições

- Parede → fase: `motion` layout animation (`layoutId` por fase) leva a janela do slot até a tela cheia; para `tipo: "three"` o `<View>` acompanha o retângulo DOM a cada quadro, então a cena 3D cresce junto.
- O cronômetro só começa quando a transição termina (`onLayoutAnimationComplete`).

---

## 4. Dados e pontuação

```prisma
model User {
  id           String    @id @default(cuid())
  username     String
  usernameKey  String    @unique   // minúsculo: unicidade sem diferenciar caixa no BANCO
  passwordHash String
  createdAt    DateTime  @default(now())
  attempts     Attempt[]
}

model Attempt {
  id        String    @id @default(cuid())
  userId    String
  levelId   String
  startedAt DateTime  @default(now())   // relógio do SERVIDOR
  endedAt   DateTime?
  fails     Int       @default(0)
  closed    Boolean   @default(false)
  timeMs    Int?
  score     Int?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, levelId])
  @@index([levelId, endedAt])
}
```

- **Tempo medido no servidor**: `POST /api/tentativas` cria a tentativa (início = agora); `POST /api/tentativas/:id/erro` soma 1; `POST /api/tentativas/:id/fechar` grava fim, `timeMs` e `score`. O cliente nunca manda o tempo.
- **Nota** (`lib/pontuacao.ts`): `max(100, 1000 − 10 × segundos acima do tempoAlvo − 100 × erros)`, inteiro.
- **Desbloqueio**: fase de ordem N abre se a de ordem N−1 tem ao menos uma tentativa fechada. O servidor recusa iniciar fase trancada (exceto a janela do dia).
- **Janela do dia**: `faseDoDia(data)` = hash determinístico da data (`America/Sao_Paulo`) sobre a lista de fases. Sem tabela. Conta qualquer tentativa fechada daquela fase naquele dia.
- **Placar geral**: soma da melhor `score` de cada fase por usuário. **Por fase**: menor `timeMs` (desempate: menos erros). **Do dia**: melhor `score` na fase do dia, hoje.
- Limite conhecido: os erros são relatados pelo cliente (dá para omitir). Aceito para um jogo interno; replay/validação fica para depois.

### Conta

- Cadastro: usuário (3–20, `[a-zA-Z0-9_]`), senha (6–72, bcrypt custo 10), **código do time** (`TEAM_CODE` no ambiente, comparação em tempo constante).
- Sessão: cookie `cw_session` httpOnly, JWT HS256, 30 dias (herdado).

---

## 5. Mundos e fases da v1

| Mundo | Fase | Ideia | Técnica/arte sugerida |
|---|---|---|---|
| 1 · O Básico | 1 · Só fechar | Fecha com um gesto; personagem ácido ("Viu, é fácil fechar a janela, né") | pixel art DOM (herda o trinco do Nicolas) |
| 1 · O Básico | 2 · O viciado em maçã | Boneco tenta te atrapalhar jogando maçãs no trinco | herda a maçã do Nicolas, ampliada |
| 2 · Intempéries | 3 · A janela chuvosa | Vento e chuva empurram a folha; fechar entre rajadas | 3D/shader (gotas no vidro, partículas) |
| 3 · Cabeça | 4 · As janelas hidra | Corta uma, nascem duas; tem que cortar a certa | a definir na sessão da fase |
| 3 · Cabeça | 5 · A janela de memória | Teste de memória para fechar | a definir na sessão da fase |

A mecânica fina de cada fase é decidida na sessão daquela fase, respeitando o contrato.

---

## 6. Ordem de construção

1. **Fundação (esta sessão):** fork local + deps 3D, schema e APIs, contrato, console (login 3D, parede, runner, resultado, placar, janela do dia), Fase 1 como primeiro cartucho `dom` e uma prévia `three` de teste.
2. **Uma sessão por fase (2–5)**, em paralelo, cada uma só dentro de `src/fases/<id>/` + uma linha no `registro.ts`.
3. Polimento das transições, deploy (Vercel + Postgres próprios), apresentação ao Nicolas.

## 7. Testes

- `npm run typecheck` e `npm run lint` verdes.
- Testes unitários (Vitest) para `pontuacao`, `faseDoDia`, desbloqueio.
- Verificação no navegador (Playwright) do caminho: cadastro → login fecha → parede → fase → resultado → placar, em viewport de celular e de computador.
