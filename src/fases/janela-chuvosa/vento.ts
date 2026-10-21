/**
 * O ritmo da tempestade: calmaria → aviso → rajada → calmaria... Logica pura
 * (sem React, sem three) para poder testar. Quem joga le `fase` e `forca`.
 *
 * Alarme falso: as vezes o aviso vem e a rajada nao. Nunca nos dois primeiros
 * ciclos, para o jogador aprender o padrao antes de ser enganado.
 */

export type FaseVento = "calma" | "aviso" | "rajada";

export const AVISO_S = 0.75;
const CALMA = [1.0, 2.4] as const;
const RAJADA = [1.3, 2.0] as const;
const PRIMEIRA_RAJADA = 2.0;
const PRIMEIRA_CALMA = 1.6;
const CHANCE_FALSO = 0.22;

export type Vento = {
  fase: FaseVento;
  /** Segundos que faltam para a fase acabar. */
  resta: number;
  /** Duracao total da fase atual (para curvas de 0 a 1). */
  duracao: number;
  /** O aviso atual e alarme falso. */
  falso: boolean;
  ciclo: number;
};

export type Evento = "aviso" | "rajada" | "falso" | "calma";

/** A fase comeca no meio de uma rajada: a folha batendo, ninguem consegue fechar ainda. */
export function novoVento(): Vento {
  return { fase: "rajada", resta: PRIMEIRA_RAJADA, duracao: PRIMEIRA_RAJADA, falso: false, ciclo: 0 };
}

const entre = ([a, b]: readonly [number, number], r: number) => a + (b - a) * r;

/** Avanca o relogio. Devolve o evento de troca de fase, se houve. `sorte` injeta o aleatorio (teste). */
export function avancar(v: Vento, dt: number, sorte: () => number = Math.random): Evento | null {
  v.resta -= dt;
  if (v.resta > 0) return null;

  if (v.fase === "calma") {
    v.fase = "aviso";
    v.falso = v.ciclo >= 2 && sorte() < CHANCE_FALSO;
    v.duracao = v.resta = AVISO_S;
    return "aviso";
  }
  if (v.fase === "aviso" && !v.falso) {
    v.fase = "rajada";
    v.duracao = v.resta = entre(RAJADA, sorte());
    return "rajada";
  }
  /* Fim da rajada, ou alarme falso que se desfaz em calmaria. */
  const eraFalso = v.fase === "aviso";
  v.fase = "calma";
  v.falso = false;
  v.duracao = v.resta = v.ciclo === 0 ? PRIMEIRA_CALMA : entre(CALMA, sorte());
  v.ciclo += 1;
  return eraFalso ? "falso" : "calma";
}

/**
 * Forca do vento de 0 a 1 (o que empurra a folha, inclina a chuva, deita a vela).
 * Calmaria quase parada; aviso sobe em curva; rajada no maximo, com o fim desinflando.
 */
export function forca(v: Vento): number {
  const t = 1 - v.resta / v.duracao;
  if (v.fase === "calma") return 0.08;
  if (v.fase === "aviso") return 0.08 + (v.falso ? Math.sin(t * Math.PI) * 0.35 : t * t * 0.5);
  return t > 0.8 ? 1 - (t - 0.8) * 2.5 : 1;
}
