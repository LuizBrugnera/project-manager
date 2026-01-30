import { redirect } from "next/navigation";

export default function AppRootPage() {
  // Redireciona para dashboard quando acessar a raiz do app
  redirect("/dashboard");
}
