import Link from "next/link";
import { Sparkles, LayoutDashboard, Zap, Shield } from "lucide-react";
import { LoginForm } from "./login-form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
        {/* Left: value messaging */}
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--foreground))]">
                Acesse sua{" "}
                <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                  central de projetos
                </span>
              </h1>
              <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-md mx-auto lg:mx-0">
                Gerencie escopo, tarefas e documentação em um só lugar. IA para gerar tasks e docs automaticamente.
              </p>
            </div>
            <ul className="space-y-4 max-w-sm mx-auto lg:mx-0">
              {[
                { icon: LayoutDashboard, text: "Dashboard e Kanban integrados" },
                { icon: Zap, text: "Geração de tarefas e documentação com IA" },
                { icon: Shield, text: "Times, permissões e visão para o cliente" },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-[hsl(var(--muted-foreground))]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Ainda não tem conta?{" "}
              <Link
                href="/register"
                className="font-medium text-sky-400 hover:text-sky-300 transition-colors"
              >
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>

        {/* Right: form card */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[hsl(var(--card))]/80 backdrop-blur-xl p-8 md:p-10 shadow-2xl shadow-sky-500/5"
          >
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
