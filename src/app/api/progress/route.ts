import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { puzzleById } from "@/puzzles/registry";

/// Guarda em qual janela o jogador parou (RN-13). So aceita id do catalogo.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const { puzzleId } = (await request.json()) as { puzzleId?: string };
  const puzzle = puzzleId ? puzzleById(puzzleId) : undefined;
  if (!puzzle) return NextResponse.json({ error: "Janela desconhecida" }, { status: 404 });

  await prisma.user.update({
    where: { id: session.id },
    data: { lastPuzzleId: puzzle.id },
  });

  return NextResponse.json({ ok: true });
}
