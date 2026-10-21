import { describe, expect, it } from "vitest";
import {
  COMECO,
  INICIAL,
  RONDA,
  acaoPara,
  esqueleto,
  lamina,
  passo,
  pendulo,
  perigo,
  type Acao,
  type Estado,
} from "./turnos";

const ACOES: Acao[] = ["cima", "baixo", "esquerda", "direita", "esperar"];
/* mmc dos ciclos (lâmina 3, pêndulo 4, ronda 12): o mundo se repete a cada 12 turnos. */
const PERIODO = 12;

/** Menor sequencia de acoes que fecha a seteira, por busca em largura. */
function resolver(): Acao[] | null {
  const chave = (e: Estado) => `${e.jogador.x},${e.jogador.y},${e.t % PERIODO}`;
  const fila: { estado: Estado; caminho: Acao[] }[] = [{ estado: INICIAL, caminho: [] }];
  const visto = new Set([chave(INICIAL)]);
  while (fila.length) {
    const { estado, caminho } = fila.shift()!;
    for (const acao of ACOES) {
      const r = passo(estado, acao);
      if (r.tipo === "fechou") return [...caminho, acao];
      if (r.tipo !== "andou" || visto.has(chave(r.estado))) continue;
      visto.add(chave(r.estado));
      fila.push({ estado: r.estado, caminho: [...caminho, acao] });
    }
  }
  return null;
}

describe("seteira: os ciclos", () => {
  it("lâmina passa por erguida, baixa e brilho, e a vizinha esta defasada", () => {
    const c = { x: 3, y: 7 };
    expect([0, 1, 2, 3].map((t) => lamina(c, t))).toEqual(["erguida", "baixa", "brilho", "erguida"]);
    expect(lamina({ x: 4, y: 7 }, 1)).toBe("erguida");
    expect(lamina({ x: 3, y: 8 }, 0)).toBeNull();
  });

  it("em cada fileira de lâminas tem sempre uma casa erguida e uma baixa", () => {
    for (const y of [7, 9])
      for (let t = 0; t < PERIODO; t += 1) {
        const fases = [2, 3, 4].map((x) => lamina({ x, y }, t));
        expect(fases.filter((f) => f === "erguida")).toHaveLength(1);
        expect(fases.filter((f) => f === "baixa")).toHaveLength(1);
      }
  });

  it("brilho avisa: no turno seguinte a lâmina esta erguida", () => {
    for (let t = 0; t < PERIODO; t += 1)
      for (const c of [{ x: 2, y: 9 }, { x: 4, y: 7 }])
        if (lamina(c, t) === "brilho") expect(lamina(c, t + 1)).toBe("erguida");
  });

  it("pêndulo vai e volta de ponta a ponta", () => {
    expect([0, 1, 2, 3, 4].map((t) => pendulo(t).x)).toEqual([2, 3, 4, 3, 2]);
  });

  it("esqueleto anda uma casa por turno e fecha a ronda em 12", () => {
    for (let t = 0; t < PERIODO; t += 1) {
      const a = esqueleto(t);
      const b = esqueleto(t + 1);
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
    }
    expect(esqueleto(PERIODO)).toEqual(esqueleto(0));
    expect(new Set(RONDA.map((c) => `${c.x},${c.y}`)).size).toBe(PERIODO);
  });
});

describe("seteira: o turno", () => {
  it("parede nao gasta turno", () => {
    expect(passo(INICIAL, "baixo")).toEqual({ tipo: "parede" });
  });

  it("esperar no comeco e sempre seguro", () => {
    for (let t = 0; t < PERIODO; t += 1) expect(perigo(COMECO, t)).toBeNull();
    expect(passo(INICIAL, "esperar")).toEqual({ tipo: "andou", estado: { jogador: COMECO, t: 1 } });
  });

  it("pisar em lâmina erguida e dano", () => {
    /* t=0: a lâmina de (3,9) esta erguida. */
    expect(lamina({ x: 3, y: 9 }, 0)).toBe("erguida");
    expect(passo(INICIAL, "cima")).toMatchObject({ tipo: "dano", por: "lamina", onde: { x: 3, y: 9 } });
  });

  it("ficar onde a lâmina vai subir e dano", () => {
    const c = { x: 2, y: 9 };
    const t = [0, 1, 2].find((n) => lamina(c, n) === "brilho")!;
    const r = passo({ jogador: { x: 2, y: 10 }, t }, "cima");
    expect(r).toMatchObject({ tipo: "dano", por: "lamina", t: t + 1 });
  });

  it("trocar de lugar com o esqueleto e dano", () => {
    const t = 3;
    const ele = esqueleto(t);
    const vem = esqueleto(t + 1);
    const de = vem;
    const acao = acaoPara(de, ele)!;
    expect(passo({ jogador: de, t }, acao)).toMatchObject({ tipo: "dano", por: "esqueleto" });
  });

  it("empurrar a seteira de baixo dela fecha", () => {
    expect(passo({ jogador: { x: 3, y: 1 }, t: 0 }, "cima")).toEqual({ tipo: "fechou" });
  });

  it("toque vira acao so na casa vizinha", () => {
    const de = { x: 3, y: 10 };
    expect(acaoPara(de, { x: 3, y: 9 })).toBe("cima");
    expect(acaoPara(de, { x: 2, y: 10 })).toBe("esquerda");
    expect(acaoPara(de, de)).toBe("esperar");
    expect(acaoPara(de, { x: 2, y: 9 })).toBeNull();
    expect(acaoPara(de, { x: 3, y: 8 })).toBeNull();
  });
});

describe("seteira: a sala tem saida", () => {
  it("da para fechar, e o caminho minimo cabe no tempo-alvo", () => {
    const caminho = resolver();
    expect(caminho).not.toBeNull();
    /* Nem trivial (anda reto) nem maratona: ~1 turno/s cabe nos 25s do meta. */
    expect(caminho!.length).toBeGreaterThanOrEqual(14);
    expect(caminho!.length).toBeLessThanOrEqual(22);
  });
});
