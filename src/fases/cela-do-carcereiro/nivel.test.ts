import { describe, expect, it } from "vitest";
import { inicial, mover, resolver, type Dir, type Evento } from "./nivel";

const LETRA: Record<string, Dir> = { u: "cima", d: "baixo", l: "esq", r: "dir" };

function jogar(passos: string) {
  let e = inicial();
  const eventos: Evento[] = [];
  for (const p of passos) {
    const r = mover(e, LETRA[p]);
    e = r.estado;
    eventos.push(r.evento);
  }
  return { e, eventos };
}

describe("a cela do carcereiro", () => {
  it("tem solucao, e a mais curta tem 29 passos", () => {
    const solucao = resolver();
    expect(solucao).not.toBeNull();
    expect(solucao!.length).toBe(29);
    expect(jogar(solucao!).eventos.at(-1)).toBe("fechou");
  });

  it("a solucao mostrada ao Bruno fecha a janela", () => {
    const { eventos } = jogar("rddrrddlll" + "ddll" + "ruurrruulluuu" + "ru");
    expect(eventos.filter((v) => v === "empurrou")).toHaveLength(7);
    expect(eventos.filter((v) => v === "pegou")).toHaveLength(1);
    expect(eventos.at(-1)).toBe("fechou");
  });

  it("sem a tranca a janela nao fecha", () => {
    /* tira o caixote de baixo da janela e anda contra ela */
    const { eventos } = jogar("urru");
    expect(eventos.at(-1)).toBe("semTranca");
  });

  it("nao empurra dois caixotes de uma vez", () => {
    const e = { ...inicial(), jogador: { x: 3, y: 6 } };
    expect(mover(e, "dir").evento).toBe("bateu");
  });

  it("armadilha: o caixote da porta empurrado tres vezes tranca o caminho de vez", () => {
    expect(resolver(jogar("rdd").e)).not.toBeNull();
    expect(resolver(jogar("rddd").e)).toBeNull();
  });
});
