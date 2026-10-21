# Deploy da v2 na Vercel

A v2 roda **separada** da v1: projeto Vercel próprio, banco próprio. O projeto e o banco da v1 (branch `main`) não são tocados.

> Deploy é do dono do repositório (CLAUDE.md da v1, seção 9). Estes passos são para o Nicolas, ou para quem ele der acesso ao time na Vercel.

## Por que um projeto separado

O schema da v2 é outro (`User.usernameKey`, tabela `Attempt`; a v1 usa `Solve` e `lastPuzzleId`). Apontar a v2 para o banco da v1 faria o `prisma db push` tentar apagar tabelas da v1. O `vercel-build` não usa `--accept-data-loss`, então o deploy **falharia** em vez de apagar, mas não há por que arriscar.

## Passo a passo

1. **Novo projeto:** Vercel → Add New → Project → importe `NicolasRochaSilva/closewindows`. Nome sugerido: `closewindows-v2`.
2. **Branch de produção:** Settings → Git → Production Branch = `v2`.
3. **Banco novo:** Storage → Create → Postgres (Prisma Postgres ou Neon), conectado **só** a este projeto. Isso preenche `DATABASE_URL`.
4. **Variáveis** (Settings → Environment Variables, ambiente Production):
   - `SESSION_SECRET`: 32 bytes aleatórios em hex — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `TEAM_CODE`: a senha do time para criar conta. Combine com o time e cadastre direto aqui; não precisa estar no repositório nem no chat.
5. **Deploy:** Deployments → Redeploy (ou um push na `v2`). O `vercel-build` roda `prisma generate`, depois `prisma db push` (só em produção, cria as tabelas no banco novo), depois `next build`.
6. **No projeto da v1**, para ele não gerar previews quebrados da branch `v2` (eles usariam o banco da v1): Settings → Git → Ignored Build Step, comando:
   ```bash
   if [ "$VERCEL_GIT_COMMIT_REF" = "v2" ]; then exit 0; else exit 1; fi
   ```

## Conferir depois do deploy

- Abrir a URL: a janela 3D do login aparece.
- "Ainda não tenho conta" → criar conta com o `TEAM_CODE` → a janela fecha e mostra o muro.
- Jogar a fase 1 e ver a nota no Placar.

## Observações

- `.npmrc` tem `legacy-peer-deps=true` (necessário para o React Three Fiber); a Vercel respeita.
- Build local validado em 2026-10-21 (`npm run build`): compila, sem erros de tipo. O aviso "Failed to find font override values for Big Shoulders Stencil" é inofensivo.
