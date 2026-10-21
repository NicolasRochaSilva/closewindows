import { describe, expect, it } from "vitest";
import { AVISO_S, avancar, forca, novoVento } from "./vento";

describe("vento da janela chuvosa", () => {
  it("comeca em rajada e segue calma → aviso → rajada", () => {
    const v = novoVento();
    expect(v.fase).toBe("rajada");
    expect(avancar(v, 2.01, () => 0)).toBe("calma");
    expect(v.resta).toBeCloseTo(1.6);
    expect(avancar(v, 1.61, () => 0)).toBe("aviso");
    expect(v.falso).toBe(false);
    expect(avancar(v, AVISO_S + 0.01, () => 0)).toBe("rajada");
  });

  it("nao engana nos dois primeiros ciclos, depois pode", () => {
    const v = novoVento();
    const eventos: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      const e = avancar(v, 3, () => 0); // sorte 0: sempre cairia no alarme falso
      if (e) eventos.push(e);
    }
    expect(eventos.slice(0, 5)).toEqual(["calma", "aviso", "rajada", "calma", "aviso"]);
    expect(eventos).toContain("falso");
  });

  it("forca: calmaria fraca, rajada no maximo", () => {
    const v = novoVento();
    expect(forca(v)).toBeLessThanOrEqual(1);
    avancar(v, 2.01, () => 0);
    expect(forca(v)).toBeLessThan(0.1);
  });
});
