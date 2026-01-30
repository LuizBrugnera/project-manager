import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Premium dark background: gradients + subtle blur orbs */}
      <div className="fixed inset-0 bg-[hsl(var(--background))]" aria-hidden />
      <div
        className="fixed inset-0 bg-gradient-to-br from-sky-950/40 via-[hsl(var(--background))] to-purple-950/30"
        aria-hidden
      />
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-sky-500/8 blur-[120px] pointer-events-none"
        aria-hidden
      />
      <div
        className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none"
        aria-hidden
      />
      {/* Optional: very subtle noise overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      {/* Header: logo + back to home */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[hsl(var(--background))]/50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-sky-400 transition-colors duration-200"
            >
              <Sparkles className="h-5 w-5 text-sky-400" />
              <span className="font-semibold">SaaS Projetos</span>
            </Link>
            <Link
              href="/"
              className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors duration-200"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
