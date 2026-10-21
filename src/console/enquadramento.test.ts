import { describe, expect, it } from "vitest";
import { CAPA_LADO, CAPA_TOPO, enquadrar } from "./enquadramento";

/* VAO 2.4 x 3.4 com a folga usada em Fase0Login */
const JANELA = { altura: 3.4 + 1.3, largura: 2.4 + 0.5 };
const TAN = Math.tan((20 * Math.PI) / 180);

/** Retangulo, em px, que a janela ocupa na tela com a camera deslocada. */
function naTela(l: number, a: number) {
  const e = enquadrar(l, a, JANELA, TAN);
  const cx = l / 2 - e.desvioX * e.pxPorUnidade;
  const cy = a / 2 + e.desvioY * e.pxPorUnidade;
  const meiaL = (JANELA.largura / 2) * e.pxPorUnidade;
  const meiaA = (JANELA.altura / 2) * e.pxPorUnidade;
  return { esq: cx - meiaL, dir: cx + meiaL, topo: cy - meiaA, base: cy + meiaA, e };
}

describe("enquadramento do login", () => {
  it("computador: a janela fica inteira na metade direita", () => {
    const j = naTela(1280, 800);
    expect(j.esq).toBeGreaterThanOrEqual(1280 * CAPA_LADO - 0.01);
    expect(j.dir).toBeLessThanOrEqual(1280.01);
    expect(j.topo).toBeGreaterThanOrEqual(-0.01);
    expect(j.base).toBeLessThanOrEqual(800.01);
  });

  it("celular em pe: a janela fica inteira abaixo da capa, maior que a de antes da capa", () => {
    const j = naTela(390, 844);
    expect(j.topo).toBeGreaterThanOrEqual(844 * CAPA_TOPO - 0.01);
    expect(j.base).toBeLessThanOrEqual(844.01);
    expect(j.esq).toBeGreaterThanOrEqual(-0.01);
    /* antes da capa a largura (com folga 3.5) mandava: 390 / 3.5 px por unidade */
    expect(j.e.pxPorUnidade).toBeGreaterThan(390 / 3.5);
  });

  it("a distancia projeta a escala pedida", () => {
    const { e } = naTela(1280, 800);
    expect(800 / (2 * e.distancia * TAN)).toBeCloseTo(e.pxPorUnidade);
  });
});
