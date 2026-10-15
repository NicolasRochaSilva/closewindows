import type { Transition } from "motion/react";

/**
 * Curvas e duracoes unicas do jogo. Todo componente animado importa daqui —
 * nao escreva duration/ease solto no JSX (CLAUDE.md).
 */
export const DURATION = {
  snap: 0.12,
  quick: 0.24,
  base: 0.42,
  swing: 0.9,
} as const;

/** Entrada de painel: chega firme e para seco, como um baú fechando. */
export const EASE_WOOD = [0.2, 0.9, 0.1, 1] as const;

/** Dobradica: acelera devagar, solta rapido e bate no fim com um leve excesso. */
export const EASE_HINGE = [0.34, 0.01, 0.2, 1.06] as const;

export const panelIn: Transition = { duration: DURATION.base, ease: EASE_WOOD };
export const hingeOpen: Transition = { duration: DURATION.swing, ease: EASE_HINGE };

/** Tremor curto de recusa (senha errada, trinco emperrado). */
export const shake = {
  x: [0, -6, 6, -4, 4, 0],
  transition: { duration: DURATION.base, ease: "linear" as const },
};
