import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { signupSchema } from "@/lib/validation";

/** Compara em tempo constante; o hash iguala os tamanhos antes do timingSafeEqual. */
function codigoConfere(recebido: string) {
  const esperado = process.env.TEAM_CODE;
  if (!esperado) throw new Error("TEAM_CODE nao configurado");
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { username, password, codigo } = parsed.data;
  if (!codigoConfere(codigo)) {
    return NextResponse.json({ error: "Codigo do time errado", campo: "codigo" }, { status: 403 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        username,
        usernameKey: username.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
      },
      select: { id: true, username: true },
    });
    await createSession(user);
    return NextResponse.json({ username: user.username }, { status: 201 });
  } catch (error) {
    /* A unicidade sem caixa e garantida pelo indice de usernameKey, inclusive em corrida. */
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Esse nome ja foi tomado", campo: "username" }, { status: 409 });
    }
    throw error;
  }
}
