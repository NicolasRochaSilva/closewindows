import type { Puzzle } from "./types";
import { manifest as trincoSimples } from "./trinco-simples/manifest";
import TrincoSimples from "./trinco-simples/Puzzle";

/// Cada puzzle novo acrescenta UMA entrada aqui. Nada mais neste arquivo muda.
export const puzzles: Puzzle[] = [
  { ...trincoSimples, Component: TrincoSimples },
].sort((a, b) => a.order - b.order);

export const puzzleById = (id: string) => puzzles.find((p) => p.id === id);
