import Console from "@/console/Console";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Uma pagina so: o console decide se mostra o login (fase 0) ou a parede. */
export default async function Home() {
  const session = await getSession();
  return <Console usuario={session?.username ?? null} />;
}
