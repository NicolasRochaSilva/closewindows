import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { nota } from "@/lib/pontuacao";
import { faseMeta } from "@/fases/catalogo";

/** Fecha a tentativa: tempo = agora - inicio, ambos do servidor; nota calculada aqui. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });

  const { id } = await params;
  const tentativa = await prisma.attempt.findFirst({
    where: { id, userId: session.id, endedAt: null },
  });
  const fase = tentativa && faseMeta(tentativa.levelId);
  if (!tentativa || !fase) return NextResponse.json({ error: "Tentativa nao encontrada" }, { status: 404 });

  const anterior = await prisma.attempt.aggregate({
    where: { userId: session.id, levelId: fase.id, closed: true },
    _max: { score: true },
  });

  const endedAt = new Date();
  const timeMs = endedAt.getTime() - tentativa.startedAt.getTime();
  const score = nota(timeMs, fase.tempoAlvo, tentativa.fails);

  /* endedAt: null no where impede fechar duas vezes a mesma tentativa. */
  const { count } = await prisma.attempt.updateMany({
    where: { id, endedAt: null },
    data: { endedAt, timeMs, score, closed: true },
  });
  if (count === 0) return NextResponse.json({ error: "Tentativa ja fechada" }, { status: 409 });

  const melhorAntes = anterior._max.score;
  return NextResponse.json({
    timeMs,
    erros: tentativa.fails,
    nota: score,
    recorde: melhorAntes === null || score > melhorAntes,
    primeira: melhorAntes === null,
  });
}
