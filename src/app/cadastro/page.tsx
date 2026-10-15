import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession } from "@/lib/session";

export const metadata = { title: "Cadastro — closeWindows" };

export default async function SignupPage() {
  if (await getSession()) redirect("/jogo");
  return <AuthForm mode="signup" />;
}
