import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { intervaloDoDia } from "@/lib/dia";
import { diariaDeHoje } from "@/lib/progresso";
import { jogaveis } from "@/fases/catalogo";

export const dynamic = "force-dynamic";

const TOP = 10;

/**
 * Placar em tres visoes:
 * - geral: soma da melhor nota de cada fase (desempate: mais fases, depois nome)
 * - porFase: melhor tempo de cada jogador (desempate: menos erros)
 * - dia: melhor nota na fase do dia, hoje + quem fechou / quem esta devendo
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const [usuarios, melhores, fechadas] = await Promise.all([
    prisma.user.findMany({ select: { id: true, username: true } }),
    prisma.attempt.groupBy({
      by: ["userId", "levelId"],
      where: { closed: true },
      _max: { score: true },
    }),
    prisma.attempt.findMany({
      where: { closed: true },
      select: { userId: true, levelId: true, timeMs: true, fails: true },
      orderBy: [{ timeMs: "asc" }, { fails: "asc" }],
    }),
  ]);
  const nome = new Map(usuarios.map((u) => [u.id, u.username]));

  const somas = new Map<string, { total: number; fases: number }>();
  for (const linha of melhores) {
    const atual = somas.get(linha.userId) ?? { total: 0, fases: 0 };
    atual.total += linha._max.score ?? 0;
    atual.fases += 1;
    somas.set(linha.userId, atual);
  }
  const geral = [...somas.entries()]
    .map(([userId, s]) => ({ username: nome.get(userId) ?? "???", ...s }))
    .sort((a, b) => b.total - a.total || b.fases - a.fases || a.username.localeCompare(b.username))
    .slice(0, TOP);

  /* `fechadas` ja vem do mais rapido para o mais lento: o primeiro de cada jogador e o melhor dele. */
  const porFase: Record<string, { username: string; timeMs: number; erros: number }[]> = {};
  for (const fase of jogaveis()) {
    const vistos = new Set<string>();
    porFase[fase.id] = fechadas
      .filter((t) => t.levelId === fase.id && !vistos.has(t.userId) && vistos.add(t.userId))
      .slice(0, TOP)
      .map((t) => ({ username: nome.get(t.userId) ?? "???", timeMs: t.timeMs ?? 0, erros: t.fails }));
  }

  const { dia, faseId } = diariaDeHoje();
  const { inicio, fim } = intervaloDoDia(dia);
  const hoje = await prisma.attempt.groupBy({
    by: ["userId"],
    where: { levelId: faseId, closed: true, endedAt: { gte: inicio, lt: fim } },
    _max: { score: true },
  });
  const fecharamIds = new Set(hoje.map((h) => h.userId));

  return NextResponse.json({
    geral,
    porFase,
    dia: {
      dia,
      faseId,
      top: hoje
        .map((h) => ({ username: nome.get(h.userId) ?? "???", nota: h._max.score ?? 0 }))
        .sort((a, b) => b.nota - a.nota || a.username.localeCompare(b.username))
        .slice(0, TOP),
      fecharam: usuarios.filter((u) => fecharamIds.has(u.id)).map((u) => u.username),
      devendo: usuarios.filter((u) => !fecharamIds.has(u.id)).map((u) => u.username),
    },
  });
}
