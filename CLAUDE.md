# closeWindows — padrao do projeto

> Jogo colaborativo de puzzles de janelas. Pixel art 16 bits, tema medieval.
> Repositorio aberto: qualquer pessoa cria o seu puzzle.
>
> **Este arquivo e normativo.** As regras marcadas como **TRAVADO** nao se
> discutem em PR: codigo que as quebra e recusado. O que esta em **LIVRE** e
> escolha de quem escreve o puzzle.
>
> Leia a divisao antes de tudo:
>
> - **A moldura e travada.** Logo, fundo branco, painel, placa, setas, ranking,
>   topo: pixel art 16 bits medieval, sem excecao.
> - **A janela e livre.** Dentro do palco do puzzle, cada dev escolhe o estilo —
>   16 bits como a primeira, 3D, vetorial, o que quiser. Ver **6.1**.
>
> O que atravessa as duas e curto e inegociavel: paleta em variaveis, as duas
> fontes, as curvas de `src/lib/motion.ts`, o som por `src/lib/sfx.ts` e o
> contrato do puzzle.

---

## 1. Identidade (TRAVADO)

| Item | Valor |
| --- | --- |
| Nome | `closeWindows` — sempre essa grafia, `c` minusculo e `W` maiusculo |
| Letreiro | `close` + **janela** + `Windows`, nessa ordem, com a janela no meio |
| Fundo | **branco puro** (`--paper`) em toda e qualquer tela |
| Tema | **fechar a janela** — um meme interno. Medieval e so o estilo |
| Quem joga | **fechador** (nunca morador, aldeao, cidadao) |
| Estilo da moldura | pixel art 16 bits, medieval |
| Estilo da janela | livre por puzzle (ver 6.1) |
| Idioma da interface | pt-BR, sem acento em identificador de codigo |

- O logo vive em `src/components/Logo.tsx` e a janela do letreiro em
  `src/components/WindowGlyph.tsx`. **Nao reescreva nenhum dos dois** num PR de
  puzzle. Mudanca de marca e PR separado.
- O jogo **nao tem cenario narrativo**: nada de vilarejo, aldeia, reino, castelo
  ou moradores em texto, nome de puzzle ou mensagem. O medieval esta no
  desenho e na fonte, nao na historia. Todo texto gira em torno de fechar a
  janela.
- Nunca troque o fundo branco por escuro, textura, imagem ou gradiente — nem
  "so na minha tela". O branco e o que faz a madeira e o vidro aparecerem.

## 2. Stack (TRAVADO)

Next.js (App Router) · TypeScript `strict` · React · Prisma + **Postgres**
(Prisma Postgres na Vercel) · `motion` (Framer Motion) · `bcryptjs` · `jose` ·
`zod` · CSS Modules · Web Audio API (som sintetizado, sem arquivo).

Nao acrescente ao `package.json`: outro framework de CSS (Tailwind,
styled-components, Emotion), outra biblioteca de animacao (GSAP, anime.js,
react-spring), lib de audio (howler, tone.js), outro ORM, outra lib de estado global, nem lib de componentes
(MUI, shadcn). Se um puzzle precisa de algo fora dessa lista, abra issue antes
do PR.

**Unica excecao prevista:** uma lib de 3D (`three`, `@react-three/fiber`) para
um puzzle que precise de WebGL de verdade. Condicoes: declare no PR, importe
com `next/dynamic` e `ssr: false` para nao pesar em quem nao esta jogando essa
janela, e nao a use fora da pasta do seu puzzle. CSS 3D, SVG e `<canvas>` 2D
nao precisam de lib nenhuma nem de autorizacao.

### Lib nova: checar vulnerabilidade (TRAVADO)

Toda lib nova (inclusive a de 3D acima) entra so depois de checar
vulnerabilidade:

1. Instale a versao **mais recente** da lib, nunca uma antiga "porque o
   tutorial usava".
2. Rode `npm audit` depois do `npm install`. Nenhum aviso `high` ou `critical`
   pode vir da lib nova nem das dependencias que ela puxou.
3. Confira os alertas do pacote em <https://github.com/advisories> (busque pelo
   nome) para CVE ainda sem patch.
4. Cole no PR a saida do `npm audit` e diga qual versao entrou.

Achou CVE sem patch? Nao adicione a lib: abra issue. O mesmo vale para o
Claude Code: antes de instalar qualquer lib, ele faz essa checagem e mostra o
resultado.

## 3. Paleta e tipografia (TRAVADO)

**Nenhuma cor literal no codigo.** Toda cor sai de variavel CSS de
`src/app/globals.css`. `#8ecae6`, `rgb(...)` ou `hsl(...)` escritos a mao em
componente ou modulo = PR recusado.

- Madeira: `--wood-shadow --wood-dark --wood --wood-mid --wood-light --wood-highlight`
- Vidro: `--glass-deep --glass --glass-light --glass-shine`
- Metal: `--iron-dark --iron --iron-light --gold --gold-light`
- Cenario: `--sky --sky-deep --sun --hill --hill-dark --stone --stone-dark --night`
- Resto: `--paper --ink --blood`

Precisa de um tom que nao existe? Acrescente a variavel em `globals.css` no
mesmo PR, com nome no mesmo padrao, e use a variavel.

Fontes (via `next/font/google`, carregadas no layout):

- **Jacquard 12** (`--font-title`) — letreiro, titulos, nome do puzzle. E a
  letra medieval pixelada. Nunca use outra fonte para titulo.
- **Press Start 2P** (`--font-ui`) — todo o resto: botao, label, ranking, texto.
- Nao importe fonte nova. Nao escreva `font-family` literal.

## 4. Regras de desenho pixel da moldura (TRAVADO)

Valem para tudo que nao e o interior da sua janela: telas de login e cadastro,
topo, placa, setas, ranking, toast, botoes e campos. Dentro do palco do puzzle,
veja **6.1**.


1. **Grade de 4px.** Todo tamanho, espaco e deslocamento e multiplo de 4
   (`--px` = 4px). Meio pixel nao existe.
2. **Sem `border-radius`.** Canto arredondado nao existe em 16 bits. Curva se
   faz em degraus de pixel.
3. **Sem desfoque.** `blur`, `box-shadow` com raio, `filter: blur`,
   `backdrop-filter`: proibidos. Sombra e bloco solido deslocado.
4. **Sem gradiente suave.** Degrade se faz com `repeating-linear-gradient` de
   paradas duras ou com blocos empilhados.
5. **SVG sempre com `shapeRendering="crispEdges"`** e coordenadas inteiras.
6. Imagem e icone: `image-rendering: pixelated` (ja global). Sprite em PNG,
   nunca JPG.
7. Borda e relevo saem das primitivas globais: `.pixel-panel`,
   `.pixel-parchment`, `.pixel-btn`, `.pixel-input`, `.pixel-label`,
   `.pixel-error`, `.title`. Use-as antes de escrever a sua.

## 5. Animacao (TRAVADO)

As animacoes sao o que o jogo vende. Padrao obrigatorio:

1. Animacao de componente e feita com **`motion`**
   (`import { motion } from "motion/react"`). CSS `@keyframes` so para laco
   decorativo infinito (brilho, pulso).
2. **Duracao e curva vem de `src/lib/motion.ts`** (`DURATION`, `EASE_WOOD`,
   `EASE_HINGE`, `panelIn`, `hingeOpen`, `shake`). Nao escreva `duration:` ou
   `ease:` com numero solto no JSX. Falta uma curva? Acrescente la, nomeada.
3. Nada de `transition: all`. Nada de `transition` em CSS para estado de botao
   pixel — ele **afunda 4px de uma vez**, sem interpolar.
4. Movimento em pixel anda em pixel: desloque em multiplos de 4px.
5. `transform` e `opacity` apenas. Nao anime `width`, `height`, `top`, `left`
   ou `margin` (fora de `height: auto` em `AnimatePresence`).
6. Quem abre em 3D herda a perspectiva do palco (`.slot` em
   `Gallery.module.css`). **Nao declare `perspective` dentro do puzzle.**
7. Toda animacao respeita `prefers-reduced-motion` (ja tratado no
   `globals.css`; nao use `!important` para furar isso).
8. Sem travamento: nenhuma animacao segura a interface por mais de
   `DURATION.swing` (0.9s).

### Som (TRAVADO)

O jogo **nao carrega arquivo de audio**. Som de 16 bits se faz com oscilador e
ruido, do mesmo jeito que a arte se faz com bloco de pixel.

1. Todo som sai de `src/lib/sfx.ts`: `sfx.latch()` (ferro batendo),
   `sfx.creak(segundos)` (dobradica rangendo), `sfx.thud()` (madeira no
   batente), `sfx.chime()` (vitoria). Nao instancie `AudioContext` no puzzle.
2. Falta um som novo? Acrescente um metodo em `sfx.ts`, sintetizado, e use por
   ali. Nao adicione `.mp3`, `.wav`, `.ogg` nem lib de audio ao repositorio.
3. Som so toca **depois de um gesto do jogador** (clique ou tecla). Nada de
   som no carregamento da pagina.
4. Nenhum efeito passa de 1 segundo. Nada em laco infinito, nada de trilha.
5. O mudo e global (`sfx.setMuted`, guardado no `localStorage`) e ja esta no
   botao "som" do topo. Nao crie outro controle de volume.
6. Som acompanha a acao, nunca a substitui: o puzzle continua jogavel e
   vencivel com o som desligado.

## 6. Como criar um puzzle

### Estrutura (TRAVADO)

```
src/puzzles/<id-em-kebab-case>/
  manifest.ts         # metadados — ver abaixo
  Puzzle.tsx          # default export, "use client"
  Puzzle.module.css   # estilo do puzzle (opcional)
  assets/             # sprites PNG (opcional)
```

Depois, **uma unica linha** em `src/puzzles/registry.ts`. Nenhum outro arquivo
fora da sua pasta e tocado por um PR de puzzle.

### Contrato (TRAVADO)

`Puzzle.tsx` recebe `PuzzleProps` (`src/puzzles/types.ts`):

```ts
type PuzzleProps = {
  onSolved: () => void;      // chame UMA vez, quando a janela terminar de abrir
  alreadySolved: boolean;    // o jogador ja venceu essa janela antes
};
```

- `onSolved()` e chamado **no fim da animacao**, nao no clique.
- Chamar `onSolved()` mais de uma vez, ou sem o jogador ter resolvido, e
  trapaca: PR recusado.
- O puzzle **nao** fala com o banco, nao faz `fetch`, nao le cookie e nao
  importa `prisma`. Quem registra a vitoria e o `Gallery`, via
  `POST /api/solve`.
- O puzzle cabe em `460px` de largura e ate `480px` de altura no palco.
- Precisa ser jogavel por teclado: o que clica e `<button>` com `aria-label`.

### O que e seu (LIVRE)

A **resolucao** do puzzle: mecanica, logica, numero de etapas, estado interno,
sprites. Duas janelas nao precisam se parecer.

### 6.1 Estilo da janela (LIVRE)

**Cada janela pode ter o seu estilo.** A primeira (`trinco-simples`) e 16 bits
medieval porque o autor quis assim, nao porque seja obrigatorio. Voce pode
fazer a sua em 3D (CSS 3D, `<canvas>`, WebGL), vetorial, isometrica,
desenhada a mao — o que a sua mecanica pedir.

Dentro do palco, **nao valem** as regras 1 a 6 da secao 4: use
`border-radius`, sombra com raio, gradiente suave, textura, antialiasing, o
que quiser. A grade de 4px e uma convencao do pixel, nao uma lei do 3D.

O que continua valendo dentro da sua janela, sem excecao:

1. **Paleta** — cor so por variavel CSS (secao 3). Faltou um tom, acrescente a
   variavel. Isso e o que faz dez janelas de dez pessoas parecerem o mesmo jogo.
2. **Fontes** — texto dentro da janela usa `--font-title` ou `--font-ui`.
3. **Animacao** — `motion` e as curvas de `src/lib/motion.ts` (secao 5). Em
   `<canvas>`/WebGL, onde `motion` nao alcanca, use `requestAnimationFrame`
   com as mesmas duracoes de `DURATION`.
4. **Som** — so `src/lib/sfx.ts` (secao 5, "Som").
5. **Contrato** — `onSolved()` uma vez, no fim da animacao; sem `fetch`, sem
   prisma, sem cookie; cabe em 460x480; jogavel por teclado.
6. **Perspectiva** — se a sua janela e 3D em CSS, a camera e a do palco
   (`.slot`). Nao declare `perspective` propria. Em `<canvas>`/WebGL a camera e
   sua, porque o palco nao alcanca o contexto do canvas.
7. **Fundo** — o palco continua branco. Sua janela desenha a si mesma, nao
   pinta a tela inteira.

Regra de bolso: de longe, o jogo e sempre o mesmo. De perto, cada janela e de
quem a fez.

### `manifest.ts`

```ts
export const manifest: PuzzleManifest = {
  id: "trinco-simples",      // igual ao nome da pasta, imutavel depois do merge
  name: "O Trinco Simples",
  author: "SeuHandleDoGitHub",
  effort: 0,                 // NAO preencha voce — ver secao 7
  order: 0,                  // proximo numero livre
};
```

## 7. Esforco — quem decide (TRAVADO)

> **O campo `effort` e atribuido pelo Claude Code, nunca pelo dev.**

Ao terminar o puzzle, o dev deixa `effort: 0` e pede ao Claude Code para
avaliar. O Claude le o `Puzzle.tsx`, soma a rubrica abaixo, grava o resultado no
`manifest.ts` e cita no PR: "esforco N atribuido pelo Claude: <justificativa>".

| Critério | Pontos |
| --- | --- |
| Clique unico, sem estado, sem ordem (tutorial) | 0 |
| 2 a 3 passos numa ordem qualquer | +1 |
| Ordem obrigatoria de passos / sequencia a descobrir | +2 |
| Logica a deduzir (combinacao, codigo, padrao escondido) | +2 |
| Pressao de tempo ou de precisao (reflexo, arrasto fino) | +2 |
| Varias partes moveis interdependentes (engrenagem, fechadura multipla) | +3 |
| Estado que pode travar e exige recomeco consciente | +1 |

Soma 0 → tutorial · 1-3 → facil · 4-6 → medio · 7-9 → dificil · 10+ → brutal.

Regras de borda:

- **A primeira janela (`trinco-simples`) vale 0 para sempre.** Nao mexa nesse
  valor: ela e o tutorial e nao pode inflar placar.
- Esforco **nao** se negocia por pedido do autor no PR.
- Esforco de puzzle ja mesclado nao e reavaliado para cima nem para baixo. O
  ranking guarda a foto do esforco (`Solve.effort`) justamente para que uma
  reavaliacao futura nunca reescreva o passado.
- Mudou a mecanica num PR novo? O Claude reavalia e o manifest muda — as
  vitorias antigas seguem valendo o que valiam.

## 8. Regras de negocio

- **RN-01** — Cadastro e so `username` + `senha`. Sem e-mail, sem confirmacao,
  sem recuperacao de senha.
- **RN-02** — `username` e **unico, sem diferenciar maiuscula de minuscula**:
  se existe `Nicolas`, `nicolas` e recusado com "Esse nome ja foi tomado".
  3 a 20 caracteres, `[a-zA-Z0-9_]`. Senha de 6 a 72 caracteres,
  guardada so como hash `bcrypt` (custo 10). **Nunca** logue nem devolva hash.
- **RN-03** — Sessao e cookie `cw_session` `httpOnly`, JWT HS256 assinado com
  `SESSION_SECRET`, 30 dias. `/jogo` exige sessao; `/login` e `/cadastro` com
  sessao ativa redirecionam para `/jogo`.
- **RN-04** — Ranking = **soma do esforco das janelas vencidas**. Desempate:
  mais janelas, depois ordem alfabetica. **Nunca por tempo.** Top 10, na
  lateral direita, com a linha do jogador destacada.
- **RN-05** — Cada par (jogador, puzzle) pontua **uma vez** (`@@unique`). Abrir
  a mesma janela de novo nao soma nada.
- **RN-06** — O esforco gravado vem do **manifest no servidor**
  (`src/app/api/solve/route.ts`), nunca do corpo da requisicao. O cliente manda
  so o `puzzleId`.
- **RN-07** — Havendo mais de um puzzle, aparecem as setas medievais de
  anterior/proxima (e as flechas do teclado funcionam). Com um unico puzzle,
  nao ha setas.
- **RN-08** — O catalogo de puzzles vive no **codigo** (`registry.ts`), nao no
  banco. O banco guarda jogadores e vitorias.

## 9. Banco e ambiente

```
DATABASE_URL    # Prisma Postgres (Vercel > Storage > Connect)
SESSION_SECRET  # 32 bytes aleatorios em hex
```

- Copie `.env.example` para `.env`. `.env` **nunca** entra no git.
- Alterou `prisma/schema.prisma`? Rode `npm run db:push` e descreva a mudanca
  no PR. Nao renomeie nem apague coluna que ja tem dado em producao.
- Deploy e Vercel, build `prisma generate && next build` (ja no `package.json`).

### Deploy (TRAVADO — so o dono)

> **Detalhes de deploy sao do dono do repositorio
> ([@NicolasRochaSilva](https://github.com/NicolasRochaSilva)) e de mais
> ninguem.** PR de outra pessoa que toque nisso e recusado.

E deploy, e portanto so do dono:

- `vercel.json` e `next.config.ts`
- os scripts `build` e `postinstall` do `package.json`
- a versao de `next`, `react`, `react-dom`, `eslint-config-next`, `prisma` e
  `@prisma/client` (inclusive patch de seguranca)
- `.env.example` e a lista de variaveis de ambiente
- `.github/CODEOWNERS`
- tudo que vive no painel da Vercel: Framework Preset, Output Directory,
  variaveis de ambiente, dominios e o banco de producao

Achou um problema de deploy? Abra issue descrevendo o erro. Nao mande PR.

**Para o Claude Code:** so altere esses itens quando quem pede for o dono. Em
qualquer outra sessao, recuse, explique esta regra e sugira abrir issue.

## 10. Comandos

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # obrigatorio antes de abrir PR
npm run lint       # obrigatorio antes de abrir PR
npm run db:push    # aplica o schema no banco
npm run db:studio
```

## 11. Git e PR

Repositorio aberto. Fluxo:

1. Branch `puzzle/<id>` para puzzle, `fix/<assunto>` ou `feat/<assunto>` para o
   resto.
2. Um PR = **um** puzzle, ou **um** assunto. Nao misture.
3. PR de puzzle toca so `src/puzzles/<id>/**` + uma linha em `registry.ts`.
   Mexeu em `globals.css`, `Logo.tsx`, `Gallery.tsx`, `schema.prisma` ou
   `package.json`? Explique no PR por que foi inevitavel.
4. `npm run typecheck` e `npm run lint` passando.
5. No corpo do PR: print ou gif da janela, a mecanica em uma frase, e o esforco
   atribuido pelo Claude com a justificativa.

### Checklist (o revisor usa esta lista)

- [ ] Fundo branco intacto
- [ ] Nenhuma cor literal — tudo em variavel CSS
- [ ] Moldura sem `border-radius`, sem blur, sem gradiente suave
- [ ] Moldura toda em multiplo de 4px
- [ ] Estilo proprio da janela respeita paleta, fontes, curvas, som e contrato (6.1)
- [ ] Animacao com `motion` e curvas de `src/lib/motion.ts`
- [ ] Som so por `src/lib/sfx.ts`, sem arquivo de audio no repo
- [ ] Sem `perspective` dentro do puzzle
- [ ] `onSolved()` uma unica vez, no fim da animacao
- [ ] Puzzle sem `fetch`, sem prisma, sem cookie
- [ ] Jogavel por teclado, com `aria-label`
- [ ] `effort` atribuido pelo Claude (nao pelo autor), com justificativa
- [ ] `id` e `order` livres e coerentes
- [ ] `typecheck` e `lint` verdes
- [ ] Lib nova? `npm audit` limpo e versao mais recente, saida colada no PR (secao 2)
- [ ] Nenhum arquivo de deploy tocado por quem nao e o dono (secao 9)

---

## 12. Mapa do codigo

```
prisma/schema.prisma        User, Solve
src/app/globals.css         tokens de cor + primitivas pixel  (TRAVADO)
src/app/layout.tsx          fontes
src/app/page.tsx            raiz -> /jogo ou /login
src/app/login|cadastro      telas de autenticacao
src/app/jogo/page.tsx       palco (servidor: sessao, vitorias, ranking)
src/app/api/auth/*          signup, login, logout
src/app/api/solve           grava a vitoria (esforco vem do servidor)
src/app/api/ranking         top 10
src/components/Logo         letreiro closeWindows                (TRAVADO)
src/components/WindowGlyph  janela do letreiro                   (TRAVADO)
src/components/Gallery      galeria, setas, toast, ranking       (TRAVADO)
src/components/PixelArrow   setas medievais                      (TRAVADO)
src/components/RankingBoard quadro dos melhores                  (TRAVADO)
src/lib/motion.ts           curvas e duracoes                    (TRAVADO)
src/lib/sfx.ts              efeitos sonoros sintetizados         (TRAVADO)
src/lib/ranking.ts          RN-04
src/lib/session.ts          RN-03
src/lib/validation.ts       RN-02
src/puzzles/types.ts        contrato do puzzle                   (TRAVADO)
src/puzzles/registry.ts     catalogo — uma linha por puzzle
src/puzzles/<id>/           SEU puzzle                           (LIVRE por dentro)
```
