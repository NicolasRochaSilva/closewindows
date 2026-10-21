import { prisma } from "./prisma";
import { diaDeHoje, faseDoDia, intervaloDoDia } from "./dia";
import { desbloqueadas, jogaveis } from "@/fases/catalogo";

export type ProgressoFase = { fechada: boolean; melhorNota: number | null; melhorTempo: number | null };

export type Progresso = {
  fases: Record<string, ProgressoFase>;
  abertas: string[];
  diaria: { dia: string; faseId: string; fechouHoje: boolean };
};

/** Fase do dia de hoje, entre as jogaveis. */
export function diariaDeHoje() {
  const dia = diaDeHoje();
  return { dia, faseId: faseDoDia(dia, jogaveis().map((f) => f.id)) };
}

/** Tudo que a parede precisa saber de um jogador. */
export async function progressoDe(userId: string): Promise<Progresso> {
  const fechadas = await prisma.attempt.groupBy({
    by: ["levelId"],
    where: { userId, closed: true },
    _max: { score: true },
    _min: { timeMs: true },
  });

  const fases: Record<string, ProgressoFase> = {};
  for (const linha of fechadas) {
    fases[linha.levelId] = {
      fechada: true,
      melhorNota: linha._max.score,
      melhorTempo: linha._min.timeMs,
    };
  }

  const { dia, faseId } = diariaDeHoje();
  const { inicio, fim } = intervaloDoDia(dia);
  const hoje = await prisma.attempt.count({
    where: { userId, levelId: faseId, closed: true, endedAt: { gte: inicio, lt: fim } },
  });

  return {
    fases,
    abertas: [...desbloqueadas(new Set(Object.keys(fases)))],
    diaria: { dia, faseId, fechouHoje: hoje > 0 },
  };
}
