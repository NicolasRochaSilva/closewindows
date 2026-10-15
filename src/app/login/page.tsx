import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/session";

export const metadata = { title: "Entrar — closeWindows" };

export default async function LoginPage() {
  if (await getSession()) redirect("/jogo");
  return <AuthForm mode="login" />;
}
