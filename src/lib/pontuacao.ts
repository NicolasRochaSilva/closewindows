/**
 * Nota de uma tentativa fechada. Base 1000; desconta 10 por segundo acima do
 * tempo-alvo da fase e 100 por erro. Nunca abaixo de 100: fechar sempre vale algo.
 */
export const NOTA_BASE = 1000;
export const NOTA_MINIMA = 100;
export const DESCONTO_POR_SEGUNDO = 10;
export const DESCONTO_POR_ERRO = 100;

export function nota(timeMs: number, tempoAlvo: number, erros: number): number {
  const segundosAcima = Math.max(0, Math.ceil(timeMs / 1000 - tempoAlvo));
  const bruto = NOTA_BASE - DESCONTO_POR_SEGUNDO * segundosAcima - DESCONTO_POR_ERRO * erros;
  return Math.max(NOTA_MINIMA, bruto);
}
