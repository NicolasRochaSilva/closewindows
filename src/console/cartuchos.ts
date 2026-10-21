"use client";

import { useEffect, useState } from "react";
import type { Cartucho } from "./contrato";

/**
 * Codigo de cada fase, carregado so quando precisa (parede ou jogo).
 * Fase nova: UMA linha aqui, apontando para src/fases/<id>/index.ts.
 */
export const CARTUCHOS: Record<string, () => Promise<{ cartucho: Cartucho }>> = {
  "so-fechar": () => import("@/fases/so-fechar"),
  "viciado-em-maca": () => import("@/fases/viciado-em-maca"),
  "janela-chuvosa": () => import("@/fases/janela-chuvosa"),
};

/** Carrega o cartucho de uma fase. `falhou` cobre chunk que nao baixou (rede). */
export function useCartucho(id: string | null) {
  const [estado, setEstado] = useState<{ id: string; cartucho?: Cartucho; falhou?: boolean } | null>(null);

  useEffect(() => {
    const carregar = id ? CARTUCHOS[id] : undefined;
    if (!id || !carregar) return;
    let vivo = true;
    carregar()
      .then((m) => vivo && setEstado({ id, cartucho: m.cartucho }))
      .catch(() => vivo && setEstado({ id, falhou: true }));
    return () => {
      vivo = false;
    };
  }, [id]);

  /* Estado de outra fase (id mudou) ainda nao vale. */
  const atual = estado?.id === id ? estado : null;
  return { cartucho: atual?.cartucho ?? null, falhou: atual?.falhou ?? false };
}
