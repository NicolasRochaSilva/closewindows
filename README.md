# closeWindows

Jogo colaborativo de puzzles de janelas. Pixel art 16 bits, tema medieval,
fundo branco. Cada pessoa cria a sua janela; abrir uma janela vale os pontos
de esforco dela, e o ranking soma esses pontos.

## Rodar

```bash
npm install
cp .env.example .env    # preencha DATABASE_URL e SESSION_SECRET
npm run db:push
npm run dev             # http://localhost:3000
```

## Contribuir

Leia o **[CLAUDE.md](./CLAUDE.md)** antes de escrever qualquer linha. Ele e
normativo: paleta, fontes, grade de 4px, curvas de animacao, som, contrato do
puzzle e o checklist que o revisor usa.

Resumo do caminho feliz:

1. `git checkout -b puzzle/<id>`
2. Crie `src/puzzles/<id>/` com `manifest.ts` e `Puzzle.tsx`
3. Registre uma linha em `src/puzzles/registry.ts`
4. Peca ao Claude Code para atribuir o `effort` (nao preencha voce)
5. `npm run typecheck && npm run lint`
6. Abra o PR com print da janela e a mecanica em uma frase

**A moldura e travada, a janela e sua.** Logo, fundo branco, painel, setas e
ranking sao pixel art 16 bits medieval, sem excecao. Dentro do palco do puzzle
voce escolhe o estilo — 16 bits, 3D, vetorial, o que a sua mecanica pedir —
desde que respeite paleta, fontes, curvas de animacao, som e o contrato do
puzzle. Detalhes na secao 6.1 do CLAUDE.md.
