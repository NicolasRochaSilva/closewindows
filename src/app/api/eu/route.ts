import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { progressoDe } from "@/lib/progresso";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sem sessao" }, { status: 401 });
  return NextResponse.json({ username: session.username, progresso: await progressoDe(session.id) });
}
