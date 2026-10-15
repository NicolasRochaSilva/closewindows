import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { puzzleById } from "@/puzzles/registry";

/// Registra a janela fechada. O esforco vem do manifest do servidor,
/// nunca do corpo da requisicao (CLAUDE.md).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const { puzzleId } = (await request.json()) as { puzzleId?: string };
  const puzzle = puzzleId ? puzzleById(puzzleId) : undefined;
  if (!puzzle) return NextResponse.json({ error: "Janela desconhecida" }, { status: 404 });

  await prisma.solve.upsert({
    where: { userId_puzzleId: { userId: session.id, puzzleId: puzzle.id } },
    create: { userId: session.id, puzzleId: puzzle.id, effort: puzzle.effort },
    update: {},
  });

  return NextResponse.json({ ok: true, effort: puzzle.effort });
}
