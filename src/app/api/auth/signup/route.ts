import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { credentialsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = credentialsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const taken = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "Esse nome ja foi tomado" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { username, passwordHash: await bcrypt.hash(password, 10) },
    select: { id: true, username: true },
  });

  await createSession(user);
  return NextResponse.json({ username: user.username }, { status: 201 });
}
