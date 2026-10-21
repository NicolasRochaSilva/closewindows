import { describe, expect, it } from "vitest";
import { nota } from "./pontuacao";
import { diaDeHoje, faseDoDia, intervaloDoDia } from "./dia";
import { desbloqueadas, jogaveis } from "@/fases/catalogo";

describe("nota", () => {
  it("vale 1000 dentro do tempo-alvo e sem erro", () => {
    expect(nota(9_000, 10, 0)).toBe(1000);
  });
  it("desconta 10 por segundo acima do alvo, arredondando para cima", () => {
    expect(nota(12_100, 10, 0)).toBe(970);
  });
  it("desconta 100 por erro", () => {
    expect(nota(5_000, 10, 3)).toBe(700);
  });
  it("nunca fica abaixo de 100", () => {
    expect(nota(999_000, 10, 50)).toBe(100);
  });
});

describe("dia", () => {
  it("vira a meia-noite de Brasilia, nao a de UTC", () => {
    expect(diaDeHoje(new Date("2026-10-22T02:59:00Z"))).toBe("2026-10-21");
    expect(diaDeHoje(new Date("2026-10-22T03:00:00Z"))).toBe("2026-10-22");
  });
  it("intervalo cobre 24h a partir das 03:00 UTC", () => {
    const { inicio, fim } = intervaloDoDia("2026-10-21");
    expect(inicio.toISOString()).toBe("2026-10-21T03:00:00.000Z");
    expect(fim.getTime() - inicio.getTime()).toBe(86_400_000);
  });
  it("sorteia sempre a mesma fase para o mesmo dia, entre as dadas", () => {
    const ids = ["a", "b", "c"];
    const fase = faseDoDia("2026-10-21", ids);
    expect(ids).toContain(fase);
    expect(faseDoDia("2026-10-21", ids)).toBe(fase);
  });
});

describe("desbloqueio", () => {
  it("abre so a primeira fase para quem nao fechou nada", () => {
    expect([...desbloqueadas(new Set())]).toEqual([jogaveis()[0].id]);
  });
  it("fechar uma fase abre a seguinte", () => {
    const [primeira, segunda] = jogaveis();
    const abertas = desbloqueadas(new Set([primeira.id]));
    expect(abertas.has(primeira.id)).toBe(true);
    if (segunda) expect(abertas.has(segunda.id)).toBe(true);
  });
});
