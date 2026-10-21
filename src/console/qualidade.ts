"use client";

import type { Qualidade } from "./contrato";

/**
 * Chute inicial de qualidade pelo aparelho. Celular/tela de toque ou pouca
 * memoria descem um degrau; as fases ajustam detalhe (particulas, sombras) por aqui.
 */
export function qualidadeDoAparelho(): Qualidade {
  if (typeof window === "undefined") return "media";
  const toque = window.matchMedia("(pointer: coarse)").matches;
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const nucleos = navigator.hardwareConcurrency ?? 8;
  if (memoria <= 2 || nucleos <= 4) return "baixa";
  if (toque || memoria <= 4) return "media";
  return "alta";
}

export function prefereMenosMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
