import { describe, expect, it } from "vitest";
import {
  CABECAS_INICIAIS,
  anguloHonesto,
  arranjo,
  criarHidra,
  cortar,
  mentiraDaGeracao,
  praca,
  rngDe,
  sombra,
} from "./regra";

const pe = { x: 100, y: 300 };
const graus = (r: number) => (r * 180) / Math.PI;

describe("janelas hidra: a regra", () => {
  it("comeca com uma original e o resto copias", () => {
    const hidra = criarHidra(rngDe(7));
    expect(hidra).toHaveLength(CABECAS_INICIAIS);
    expect(hidra.filter((c) => c.geracao === 0)).toHaveLength(1);
  });

  it("a original e honesta e toda copia mente de um jeito visivel", () => {
    for (let semente = 0; semente < 200; semente += 1) {
      const rng = rngDe(semente);
      for (const geracao of [1, 2, 3, 4]) {
        const m = mentiraDaGeracao(geracao, rng);
        const base = { x: 100 + rng() * 800, y: 340 + rng() * 400 };
        const honesta = sombra({ giro: 0, escala: 1 }, base, pe, 1);
        const copia = sombra(m, base, pe, 1);
        const desvio = Math.abs(graus(copia.angulo - honesta.angulo));
        const comprimento = Math.abs(Math.log(copia.razao));
        expect(desvio >= 30 || comprimento >= Math.log(1.5)).toBe(true);
      }
    }
  });

  it("a sombra honesta aponta para longe do pe do sol", () => {
    expect(graus(anguloHonesto({ x: 400, y: 300 + 1 }, pe))).toBeCloseTo(12, 0);
    expect(graus(anguloHonesto({ x: 100, y: 600 }, pe))).toBeCloseTo(90, 5);
  });

  it("cortar troca a errada por duas filhas e nunca corta a original", () => {
    const rng = rngDe(3);
    const hidra = criarHidra(rng);
    const errada = hidra.find((c) => c.geracao > 0)!;
    const depois = cortar(hidra, errada.id, rng, 10);
    expect(depois).toHaveLength(hidra.length + 1);
    expect(depois.filter((c) => c.geracao === 2)).toHaveLength(2);
    expect(cortar(hidra, hidra.find((c) => c.geracao === 0)!.id, rng, 10)).toBe(hidra);
  });

  it("alvos nao se sobrepoem, cabem na tela e passam de 44px, de 3 a 8 janelas", () => {
    for (const [l, a, n] of [390, 1280].flatMap((l) => [3, 4, 5, 6, 7, 8].map((n) => [l, l === 390 ? 844 : 800, n]))) {
      const p = praca(l, a);
      const lugares = arranjo(p, n, rngDe(n));
      expect(lugares).toHaveLength(n);
      for (const lugar of lugares) {
        /* Alvo = janela com as folhas abertas (164 x 160 unidades), como no Jogo. */
        expect(lugar.s * 160).toBeGreaterThanOrEqual(44);
        expect(lugar.s * 164).toBeGreaterThanOrEqual(44);
      }
      const caixas = lugares.map((g) => ({ x0: g.x - 82 * g.s, x1: g.x + 82 * g.s, y0: g.y - 160 * g.s, y1: g.y }));
      caixas.forEach((c) => expect(c.x0 >= 0 && c.x1 <= l).toBe(true));
      caixas.forEach((c, i) =>
        caixas.slice(i + 1).forEach((d) => {
          const cruza = c.x0 < d.x1 && d.x0 < c.x1 && c.y0 < d.y1 && d.y0 < c.y1;
          expect(cruza).toBe(false);
        }),
      );
    }
  });
});
