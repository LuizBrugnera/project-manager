import Link from "next/link";
import { Kanban, FileText, Users } from "lucide-react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
        {/* Left: value messaging */}
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                Comece a organizar sua{" "}
                <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                  software house
                </span>
              </h1>
              <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-md mx-auto lg:mx-0">
                Crie sua conta gratuita. Centralize projetos, equipe e clientes com IA para tarefas e documentação.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
              {[
                { icon: Kanban, label: "Kanban" },
                { icon: FileText, label: "Docs com IA" },
                { icon: Users, label: "Times e clientes" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]"
                >
                  <Icon className="h-4 w-4 text-sky-400 shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>

        {/* Right: form card */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[hsl(var(--card))]/80 backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-purple-500/5">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
