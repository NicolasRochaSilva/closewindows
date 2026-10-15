import { NextResponse } from "next/server";
import { getRanking } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ranking: await getRanking() });
}
