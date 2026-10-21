import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { diariaDeHoje, progressoDe } from "@/lib/progresso";
import { faseMeta } from "@/fases/catalogo";

/**
 * Comeca uma tentativa. O inicio e o relogio do servidor: o cliente nunca manda tempo.
 * Fase trancada e recusada, exceto a janela do dia.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { faseId?: unknown } | null;
  const faseId = typeof body?.faseId === "string" ? body.faseId : "";
  const fase = faseMeta(faseId);
  if (!fase || fase.emObras) return NextResponse.json({ error: "Fase desconhecida" }, { status: 404 });

  const ehDiaria = diariaDeHoje().faseId === fase.id;
  if (!ehDiaria) {
    const { abertas } = await progressoDe(session.id);
    if (!abertas.includes(fase.id)) {
      return NextResponse.json({ error: "Fase trancada" }, { status: 403 });
    }
  }

  const tentativa = await prisma.attempt.create({
    data: { userId: session.id, levelId: fase.id },
    select: { id: true },
  });
  return NextResponse.json({ id: tentativa.id }, { status: 201 });
}
