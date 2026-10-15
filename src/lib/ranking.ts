import { prisma } from "./prisma";

export type RankRow = {
  position: number;
  username: string;
  effort: number;
  windows: number;
};

/**
 * Ranking = soma do esforco para fechar das janelas fechadas (RN-04).
 * Desempate: mais janelas, depois ordem alfabetica. Nunca por tempo.
 */
export async function getRanking(limit = 10): Promise<RankRow[]> {
  const grouped = await prisma.solve.groupBy({
    by: ["userId"],
    _sum: { effort: true },
    _count: { _all: true },
  });

  if (grouped.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, username: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.username]));

  return grouped
    .map((g) => ({
      username: nameById.get(g.userId) ?? "???",
      effort: g._sum.effort ?? 0,
      windows: g._count._all,
    }))
    .sort(
      (a, b) =>
        b.effort - a.effort ||
        b.windows - a.windows ||
        a.username.localeCompare(b.username),
    )
    .slice(0, limit)
    .map((row, index) => ({ position: index + 1, ...row }));
}
