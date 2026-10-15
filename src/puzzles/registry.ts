import type { Puzzle } from "./types";
import { manifest as trincoSimples } from "./trinco-simples/manifest";
import TrincoSimples from "./trinco-simples/Puzzle";
import { manifest as macaNoTrinco } from "./maca-no-trinco/manifest";
import MacaNoTrinco from "./maca-no-trinco/Puzzle";

/// Cada puzzle novo acrescenta UMA entrada aqui. Nada mais neste arquivo muda.
export const puzzles: Puzzle[] = [
  { ...trincoSimples, Component: TrincoSimples },
  { ...macaNoTrinco, Component: MacaNoTrinco },
].sort((a, b) => a.order - b.order);

export const puzzleById = (id: string) => puzzles.find((p) => p.id === id);
