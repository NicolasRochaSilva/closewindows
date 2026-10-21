# closeWindows v2 — padrão do projeto

> Fork de [NicolasRochaSilva/closewindows](https://github.com/NicolasRochaSilva/closewindows) com a visão do Bruno.
> **Fonte de verdade do design:** [`docs/superpowers/specs/2026-10-21-closewindows-v2-design.md`](docs/superpowers/specs/2026-10-21-closewindows-v2-design.md). Leia antes de mexer.

Toda fase é fechar uma janela. **Cada fase é um mundo à parte** (arte, técnica, temática próprias). O que amarra o jogo é a **casca** (console): login 3D, parede de janelas vivas, cronômetro, placar.

## Mapa

```
src/app/page.tsx            uma página só: monta o <Console>
src/app/api/                auth (login/signup/logout), eu, tentativas (+ /:id/erro, /:id/fechar), placar
src/console/                a casca. contrato.ts = o contrato do cartucho
  Palco3D.tsx               o <Canvas> R3F ÚNICO + <View.Port/> (um contexto WebGL só)
  Fase0Login.tsx            login 3D: o form mora no vidro; entrou → a folha fecha
  Parede.tsx Runner.tsx Placar.tsx Console.tsx cartuchos.ts cliente.ts qualidade.ts
src/fases/catalogo.ts       metadados (servidor também lê): mundos, fases, desbloqueio
src/fases/<id>/             UM cartucho: meta.ts, index.ts (exporta `cartucho`), Jogo, Previa
src/fases/_kit/             utilitários opcionais para cartuchos (ex.: useEncaixe)
src/lib/                    pontuacao, dia (janela do dia), progresso, session, prisma, sfx, motion
```

## Como fazer uma fase (cartucho)

1. `src/fases/<id>/meta.ts` (`FaseMeta`: id, mundo, ordem, nome, autor, tempoAlvo, tipo `"dom" | "three"`).
2. `src/fases/<id>/index.ts` exporta `cartucho: { Jogo, Previa }`.
3. Troque a linha `emObras(...)` dessa fase em `catalogo.ts` pelo `meta` importado, e acrescente UMA linha em `src/console/cartuchos.ts`.
4. `Jogo` recebe `{ api }`: chame `api.erro()` a cada erro do jogador, `api.fechou()` UMA vez no fim da animação de fechar, `api.fala(texto, quem)` para falas (só texto). Respeite `api.qualidade` e `api.reduzirMovimento`.
5. `Previa` roda ao vivo na parede: leve, sem input, sem som.

**Regras do cartucho (revisão recusa se quebrar):**
- Toda janela **começa aberta**; vencer é **fechar**.
- Não fala com banco, não faz `fetch`, não lê cookie: quem registra é o console.
- Jogável com **toque e com teclado** (alvos ≥ 44px, `<button>` com `aria-label`). Celular e computador no mesmo nível.
- `tipo: "three"`: `Jogo`/`Previa` são conteúdo de cena R3F (nada de `<Canvas>` próprio). `tipo: "dom"`: qualquer coisa DOM (CSS, SVG, canvas 2D, Pixi…).
- Isolamento: CSS Modules; nada global em `window`/`document` que não seja limpo no unmount; desmontar libera geometrias, texturas, timers e `requestAnimationFrame`.
- Lib exclusiva da fase: import dinâmico dentro da pasta dela. Lib nova: versão mais recente + `npm audit` sem `high`/`critical` vindo dela.
- Som só por `src/lib/sfx.ts` (sintetizado, sem arquivo de áudio). Faltou som: acrescente um método lá.
- Arte: livre. Paleta própria declarada no módulo da fase é permitida (é um mundo à parte).

## Placar e regras de negócio

- Nota = `max(100, 1000 − 10 × segundos acima do tempoAlvo − 100 × erros)` (`src/lib/pontuacao.ts`).
- Tempo medido **no servidor** (início no `POST /api/tentativas`, fim no `/fechar`). O cliente nunca manda tempo.
- Geral = soma da melhor nota de cada fase. Por fase = melhor tempo. Hoje = janela do dia.
- Desbloqueio em sequência: fechar a fase N abre a N+1 (`desbloqueadas` em `catalogo.ts`). A janela do dia ignora o desbloqueio.
- Janela do dia: hash da data de Brasília (`src/lib/dia.ts`), igual para todos.
- Cadastro exige `TEAM_CODE`. Usuário único sem diferenciar caixa via `usernameKey` (índice no banco).

## Ambiente

```
DATABASE_URL     # Postgres
SESSION_SECRET   # 32 bytes hex
TEAM_CODE        # código do time para cadastro
```

Postgres local de dev: `docker run -d --name cw-pg -e POSTGRES_PASSWORD=cw -e POSTGRES_DB=closewindows -p 5433:5432 postgres:17-alpine` e `DATABASE_URL="postgresql://postgres:cw@localhost:5433/closewindows"`.

`.npmrc` tem `legacy-peer-deps=true`: o R3F declara expo/react-native como peers opcionais e o resolvedor do npm 10 trava. Não usamos expo.

`reactStrictMode: false` (ver `next.config.ts`): o `<Html>` do drei some em dev com o StrictMode herdado pelo R3F v9.

## Comandos

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # obrigatório antes de commitar
npm run lint
npm test           # vitest: pontuação, dia, desbloqueio
npm run db:push
```

## Git

- Branch `v2` é a base. Fase nova: branch `fase/<id>` a partir de `v2`, tocando só `src/fases/<id>/**` + uma linha em `catalogo.ts` e em `cartuchos.ts` (e `sfx.ts`/`motion.ts` se precisar de som/curva nova).
- Verificar no navegador (desktop e celular) antes de dar por pronto.
