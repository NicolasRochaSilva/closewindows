import { describe, expect, it } from "vitest";
import * as arte from "./arte";

/* Mapa torto desenha sprite torto: toda linha do mesmo tamanho, toda letra com cor. */
const LETRAS = new Set("oXbWMhHstTwOrfGgIilSDLBKNY*cCjp. ");

function mapas(): [string, readonly string[]][] {
  const saida: [string, readonly string[]][] = [];
  for (const [nome, valor] of Object.entries(arte)) {
    if (Array.isArray(valor) && typeof valor[0] === "string") saida.push([nome, valor as unknown as string[]]);
  }
  arte.CHAMA.reta.forEach((m, i) => saida.push([`CHAMA.reta${i}`, m]));
  arte.CHAMA.vento.forEach((m, i) => saida.push([`CHAMA.vento${i}`, m]));
  return saida;
}

describe("seteira: a arte", () => {
  it.each(mapas())("%s e retangular e so usa letras da paleta", (_, mapa) => {
    for (const linha of mapa) {
      expect(linha).toHaveLength(mapa[0].length);
      for (const letra of linha) expect(LETRAS.has(letra)).toBe(true);
    }
  });

  it("sprites de casa tem 12x12 e a seteira 12x24", () => {
    for (const m of [arte.FECHADOR, arte.ESQUELETO, arte.LAMINA_BAIXA, arte.LAMINA_BRILHO, arte.LAMINA_ERGUIDA, arte.PENDULO, arte.GOLPE])
      expect([m[0].length, m.length]).toEqual([12, 12]);
    expect([arte.SETEIRA_ARTE[0].length, arte.SETEIRA_ARTE.length]).toEqual([12, 24]);
  });
});
