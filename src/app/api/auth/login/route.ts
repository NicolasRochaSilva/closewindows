import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { credentialsSchema } from "@/lib/validation";

const WRONG = "Nome ou senha nao conferem";

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { usernameKey: username.toLowerCase() },
    select: { id: true, username: true, passwordHash: true },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: WRONG }, { status: 401 });
  }

  await createSession({ id: user.id, username: user.username });
  return NextResponse.json({ username: user.username });
}
