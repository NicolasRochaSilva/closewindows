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
  /* Ritmo de cena: correm ao fundo e nunca seguram a interface. */
  toss: 0.6,
  rearm: 1.2,
  stroll: 1.6,
} as const;

/** Entrada de painel: chega firme e para seco, como um baú fechando. */
export const EASE_WOOD = [0.2, 0.9, 0.1, 1] as const;

/** Dobradica: acelera devagar, solta rapido e bate no fim com um leve excesso. */
export const EASE_HINGE = [0.34, 0.01, 0.2, 1.06] as const;

export const panelIn: Transition = { duration: DURATION.base, ease: EASE_WOOD };
export const hingeOpen: Transition = { duration: DURATION.swing, ease: EASE_HINGE };

/** A folha batendo no batente: mesma dobradica, o excesso vira a pancada. */
export const hingeClose: Transition = { duration: DURATION.swing, ease: EASE_HINGE };

/** Folha que bate num obstaculo e volta. */
export const bump: Transition = { duration: DURATION.base, ease: EASE_WOOD, times: [0, 0.45, 1] };

/** Boneco andando: passo constante, sem acelerar. */
export const stroll: Transition = { duration: DURATION.stroll, ease: "linear" };

/** Arremesso em arco: sobe rapido, desce assentando. */
export const tossArc: Transition = { duration: DURATION.toss, ease: "easeOut", times: [0, 0.55, 1] };

/** Objeto caindo da janela. */
export const drop: Transition = { duration: DURATION.base, ease: "easeIn" };

/** Tremor curto de recusa (senha errada, trinco emperrado). */
export const shake = {
  x: [0, -6, 6, -4, 4, 0],
  transition: { duration: DURATION.base, ease: "linear" as const },
};
