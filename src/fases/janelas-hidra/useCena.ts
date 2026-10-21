"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type RefObject } from "react";
import { animate, type Transition } from "motion/react";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import type { Lugar, Praca } from "./regra";

/** O que se ve de uma janela num quadro: lugar + estado das folhas e da racha. */
export type Vista = Lugar & { abertura: number; racha: number; tremor: number; alfa: number };

type Tween = Pick<Transition, "duration" | "ease" | "delay">;

/**
 * Cena animada sem re-render por janela: os valores vivem em objetos mutaveis,
 * o motion os interpola e cada atualizacao pede um quadro ao React (lote unico
 * por frame). Desmontar para tudo que estiver andando.
 */
export function useCena(reduzir: boolean) {
  const [, pintar] = useReducer((n: number) => n + 1, 0);
  const vistas = useRef(new Map<number, Vista>()).current;
  const andando = useRef(new Set<{ stop(): void }>()).current;

  useEffect(() => () => andando.forEach((a) => a.stop()), [andando]);

  const tween = useCallback(
    <T extends object>(alvo: T, chave: keyof T, para: number, t: Tween): Promise<void> => {
      const valores = alvo as Record<keyof T, number>;
      if (reduzir) {
        valores[chave] = para;
        pintar();
        return Promise.resolve();
      }
      const a = animate(valores[chave], para, {
        ...t,
        onUpdate: (v) => {
          valores[chave] = v;
          pintar();
        },
      });
      andando.add(a);
      return a.then(() => void andando.delete(a));
    },
    [reduzir, andando],
  );

  return { vistas, tween, pintar };
}

/**
 * Leva cada janela ao seu lugar. Janela nova entra surgindo; mudanca de
 * arranjo desliza; mudanca de tamanho da tela pula direto (nada de deslizar
 * no resize).
 */
export function useArranjo(
  cena: ReturnType<typeof useCena>,
  ids: readonly number[],
  lugares: readonly Lugar[],
  p: Praca | null,
) {
  const { vistas, tween, pintar } = cena;
  const ultimaPraca = useRef<Praca | null>(null);

  useLayoutEffect(() => {
    if (!p || lugares.length !== ids.length) return;
    const pulou = ultimaPraca.current !== p;
    ultimaPraca.current = p;
    ids.forEach((id, i) => {
      const l = lugares[i];
      const v = vistas.get(id);
      if (!v) {
        const nova = { ...l, abertura: 1, racha: 0, tremor: 0, alfa: 0 };
        vistas.set(id, nova);
        void tween(nova, "alfa", 1, { duration: DURATION.base, ease: EASE_WOOD, delay: i * 0.07 });
      } else if (pulou) {
        Object.assign(v, l);
      } else {
        const t = { duration: DURATION.swing, ease: EASE_WOOD };
        void tween(v, "x", l.x, t);
        void tween(v, "y", l.y, t);
        void tween(v, "s", l.s, t);
      }
    });
    pintar();
  }, [ids, lugares, p, vistas, tween, pintar]);
}

/** Tamanho da caixa em px, vivo. `null` ate a primeira medida. */
export function useTamanho(ref: RefObject<HTMLElement | null>) {
  const [tam, setTam] = useState<{ l: number; a: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const l = Math.round(el.clientWidth);
      const a = Math.round(el.clientHeight);
      if (l > 0 && a > 0) setTam((t) => (t && t.l === l && t.a === a ? t : { l, a }));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return tam;
}
