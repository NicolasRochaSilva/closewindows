import { describe, expect, it } from "vitest";
import { criarRitmo, duracao, FOLGA, julgar, momentoEm, PADROES, PASSOS, proximoPasso, REACAO } from "./ritmo";

const [P1, P2, P3] = PADROES;
/** Meio do folego de um padrao (o ultimo trecho). */
const meioDoFolego = (p: typeof P1) => duracao(p) - p[p.length - 1].dur / 2;

describe("padroes", () => {
  it("tres pancadas, cada padrao termina no folego e acelera", () => {
    expect(PASSOS).toBe(3);
    for (const p of PADROES) expect(p.at(-1)?.fase).toBe("folego");
    expect(P2.at(-1)!.dur).toBeLessThan(P1.at(-1)!.dur);
    expect(P3.at(-1)!.dur).toBeLessThan(P2.at(-1)!.dur);
    expect(P3.some((x) => x.fase === "finta")).toBe(true);
  });

  it("momentoEm acha o trecho e repete o ciclo", () => {
    expect(momentoEm(P1, 0.5).fase).toBe("calmo");
    expect(momentoEm(P1, 1.5).fase).toBe("inspira");
    expect(momentoEm(P1, 2.5).fase).toBe("fogo");
    expect(momentoEm(P1, 3.5).fase).toBe("folego");
    expect(momentoEm(P1, duracao(P1) + 0.5).fase).toBe("calmo");
  });
});

describe("janela de acerto", () => {
  it("folego e acerto; calmo e empurrao; inspira e fogo sao pego", () => {
    expect(julgar(P1, meioDoFolego(P1))).toBe("acerto");
    expect(julgar(P1, 0.5)).toBe("empurrao");
    expect(julgar(P1, 1.5)).toBe("pego");
    expect(julgar(P1, 2.5)).toBe("pego");
  });

  it("folga nas bordas do folego, e so nela", () => {
    const inicioFolego = duracao(P1) - P1.at(-1)!.dur;
    expect(julgar(P1, inicioFolego - FOLGA + 0.01)).toBe("acerto");
    expect(julgar(P1, inicioFolego - FOLGA - 0.05)).toBe("pego");
    /* atrasado: comeco do proximo calmo ainda vale */
    expect(julgar(P1, duracao(P1) + FOLGA - 0.01)).toBe("acerto");
    expect(julgar(P1, duracao(P1) + FOLGA + 0.05)).toBe("empurrao");
  });

  it("o comeco da partida nao e folga de um folego que nao houve", () => {
    expect(julgar(P1, 0.01)).toBe("empurrao");
  });

  it("pancada 2: a inspirada do meio e armadilha", () => {
    /* calmo .8 + insp .8 + fogo .5 = 2.1; inspira do meio vai de 2.1 a 2.4 */
    expect(julgar(P2, 2.25)).toBe("pego");
    expect(julgar(P2, meioDoFolego(P2))).toBe("acerto");
  });

  it("pancada 3: a finta parece folego, mas pega", () => {
    /* calmo .6 + insp .6 = 1.2; finta vai de 1.2 a 1.7 */
    expect(momentoEm(P3, 1.45).fase).toBe("finta");
    expect(julgar(P3, 1.45)).toBe("pego");
    expect(julgar(P3, meioDoFolego(P3))).toBe("acerto");
  });
});

describe("folha", () => {
  it("acerto avanca, pego recua, empurrao nao mexe, sem passar dos limites", () => {
    expect(proximoPasso(0, "acerto")).toBe(1);
    expect(proximoPasso(2, "pego")).toBe(1);
    expect(proximoPasso(0, "pego")).toBe(0);
    expect(proximoPasso(1, "empurrao")).toBe(1);
    expect(proximoPasso(PASSOS, "acerto")).toBe(PASSOS);
  });

  it("partida perfeita: tres acertos fecham", () => {
    let agora = 0;
    const r = criarRitmo(agora);
    for (let i = 0; i < PASSOS; i += 1) {
      agora += meioDoFolego(PADROES[r.passo]);
      expect(r.empurrar(agora)).toBe("acerto");
      agora += REACAO;
    }
    expect(r.fechou).toBe(true);
    expect(r.empurrar(agora + 10)).toBeNull();
  });

  it("pego recua um passo e o padrao volta a ser o mais facil", () => {
    let agora = meioDoFolego(P1);
    const r = criarRitmo(0);
    expect(r.empurrar(agora)).toBe("acerto");
    expect(r.passo).toBe(1);
    /* durante a reacao, nada conta */
    expect(r.empurrar(agora + REACAO / 2)).toBeNull();
    expect(r.momento(agora + REACAO / 2)).toBeNull();
    agora += REACAO;
    /* padrao 2 recomecou: 1.2s depois e a primeira inspirada */
    expect(r.momento(agora + 1.2)?.fase).toBe("inspira");
    expect(r.empurrar(agora + 1.2)).toBe("pego");
    expect(r.passo).toBe(0);
    expect(r.momento(agora + 1.2 + REACAO + 1.5)?.fase).toBe("inspira");
  });

  it("empurrao no calmo nao recomeca o ciclo", () => {
    const r = criarRitmo(0);
    expect(r.empurrar(0.5)).toBe("empurrao");
    expect(r.momento(0.6)?.fase).toBe("calmo");
    expect(r.empurrar(meioDoFolego(P1))).toBe("acerto");
  });
});
