import { redirect } from "next/navigation";
import Gallery from "@/components/Gallery";
import { prisma } from "@/lib/prisma";
import { getRanking } from "@/lib/ranking";
import { getSession } from "@/lib/session";

export const metadata = { title: "closeWindows" };
export const dynamic = "force-dynamic";

export default async function GamePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [solves, ranking] = await Promise.all([
    prisma.solve.findMany({ where: { userId: session.id }, select: { puzzleId: true } }),
    getRanking(),
  ]);

  return (
    <Gallery
      username={session.username}
      solvedIds={solves.map((s) => s.puzzleId)}
      ranking={ranking}
    />
  );
}
