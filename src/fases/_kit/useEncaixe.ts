"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Escala para uma arte de tamanho fixo (largura x altura, em px) caber na caixa
 * do `ref`, com folga. `passo` arredonda a escala para baixo (pixel art fica
 * nitida em multiplos de 0.25). Kit opcional para cartuchos "dom".
 */
export function useEncaixe(ref: RefObject<HTMLElement | null>, largura: number, altura: number, folga = 0.9, passo = 0.25) {
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const bruta = Math.min(el.clientWidth / largura, el.clientHeight / altura) * folga;
      setEscala(Math.max(passo, Math.floor(bruta / passo) * passo));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [ref, largura, altura, folga, passo]);

  return escala;
}
