import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** +1 erro numa tentativa aberta do proprio jogador. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const { id } = await params;
  const { count } = await prisma.attempt.updateMany({
    where: { id, userId: session.id, endedAt: null },
    data: { fails: { increment: 1 } },
  });
  if (count === 0) return NextResponse.json({ error: "Tentativa nao encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
