import type { ComponentType } from "react";

/// Contrato de todo puzzle. Ver CLAUDE.md secao "Como criar um puzzle".
export type PuzzleManifest = {
  /** kebab-case, igual ao nome da pasta. Nunca muda depois do merge. */
  id: string;
  /** Nome medieval exibido na placa da janela. */
  name: string;
  /** Autor (handle do GitHub). */
  author: string;
  /**
   * Esforco para fechar = pontos do ranking. ATRIBUIDO PELO CLAUDE CODE, nunca escolhido pelo dev.
   * Rubrica em CLAUDE.md.
   */
  effort: number;
  /** Ordem na galeria. Puzzle novo entra no fim. */
  order: number;
};

export type PuzzleProps = {
  /** Chame uma unica vez, no instante em que a janela termina de FECHAR. Toda janela comeca aberta. */
  onSolved: () => void;
  /** true quando o jogador ja fechou essa janela antes. */
  alreadySolved: boolean;
};

export type Puzzle = PuzzleManifest & {
  Component: ComponentType<PuzzleProps>;
};
