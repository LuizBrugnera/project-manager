import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Kanban, FileText, Users, Zap } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

// Landing page pública - redireciona usuários logados para dashboard
export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-sky-400" />
              <span className="text-lg font-bold">SaaS Projetos</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Cadastrar</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Gerencie software house{" "}
            <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
              com IA
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Centralize escopo, tasks e documentação. Use inteligência artificial para gerar tarefas automaticamente e mantenha clientes atualizados.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">Começar Grátis</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Tudo que você precisa em um só lugar
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-white/20 transition-all">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Kanban className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Kanban Integrado</h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Gerencie tarefas em um quadro visual intuitivo. Arraste, organize e acompanhe o progresso em tempo real.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-white/20 transition-all">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Docs via IA</h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Gere documentação profissional automaticamente usando Google Gemini. README, manuais e resumos executivos em segundos.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-white/20 transition-all">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visão do Cliente</h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Compartilhe links públicos para clientes acompanharem progresso sem precisar de login. Transparência total.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-white/20 transition-all">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Times</h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Adicione membros, defina permissões e colabore de forma eficiente. Owner, Equipe e Cliente em um só sistema.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--muted))]/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg text-[hsl(var(--muted-foreground))] mb-8">
              Crie sua conta gratuita e transforme como você gerencia projetos de software.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>SaaS Projetos</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-[hsl(var(--foreground))] transition-colors">
                Entrar
              </Link>
              <Link href="/register" className="hover:text-[hsl(var(--foreground))] transition-colors">
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
