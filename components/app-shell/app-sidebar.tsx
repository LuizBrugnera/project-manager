"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  FileText,
  GitBranch,
  CheckSquare,
  Map,
  Calendar,
  User,
  DollarSign,
  BookOpen,
  Activity,
  Shield,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getProjectName } from "@/lib/project-sidebar";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Meus Projetos", icon: FolderKanban },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

const projectSections = [
  { href: (id: string) => `/projects/${id}`, label: "Visão Geral", icon: LayoutGrid, exact: true },
  { href: (id: string) => `/projects/${id}/definition`, label: "Definição", icon: FileText },
  { href: (id: string) => `/projects/${id}/architecture`, label: "Arquitetura", icon: GitBranch },
  { href: (id: string) => `/projects/${id}/tasks`, label: "Tasks", icon: CheckSquare },
  { href: (id: string) => `/projects/${id}/roadmap`, label: "Roadmap", icon: Map },
  { href: (id: string) => `/projects/${id}/meetings`, label: "Reuniões", icon: Calendar },
  { href: (id: string) => `/projects/${id}/client`, label: "Dados do Cliente", icon: User },
  { href: (id: string) => `/projects/${id}/commercial`, label: "Comercial", icon: DollarSign },
  { href: (id: string) => `/projects/${id}/docs`, label: "Docs", icon: BookOpen },
  { href: (id: string) => `/projects/${id}/activities`, label: "Atividades", icon: Activity },
  { href: (id: string) => `/projects/${id}/settings`, label: "Configurações", icon: Shield },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [projectName, setProjectName] = React.useState<string | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = React.useState(true);

  // Extrai projectId da URL quando estamos em /projects/[id] ou /projects/[id]/...
  const projectId = React.useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Carrega o nome do projeto quando projectId existe
  React.useEffect(() => {
    if (!projectId) {
      setProjectName(null);
      return;
    }
    getProjectName(projectId).then(setProjectName);
  }, [projectId]);

  const isProjectsActive =
    pathname === "/projects" || (pathname.startsWith("/projects/") && projectId !== null);

  return (
    <aside className="h-full flex flex-col">
      <div className="px-4 py-4 border-b border-[hsl(var(--border))]">
        <div className="text-sm font-semibold tracking-tight">SaaS Projetos</div>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          Gestão técnica de projetos
        </div>
      </div>

      <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
        {nav.map((item) => {
          const isMeusProjetos = item.href === "/projects";
          const Icon = item.icon;

          if (isMeusProjetos) {
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isProjectsActive
                      ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>

                {/* Submenu do projeto selecionado */}
                {projectId && (
                  <div className="mt-1 ml-2 pl-3 border-l border-[hsl(var(--border))]">
                    <button
                      type="button"
                      onClick={() => setProjectMenuOpen((o) => !o)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                      )}
                      aria-expanded={projectMenuOpen}
                    >
                      {projectMenuOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate font-medium" title={projectName ?? undefined}>
                        {projectName ?? "Carregando..."}
                      </span>
                    </button>
                    {projectMenuOpen && (
                      <ul className="space-y-0.5 py-1">
                        {projectSections.map((section) => {
                          const href = section.href(projectId);
                          const exact = "exact" in section && section.exact;
                          const active = exact
                            ? pathname === href
                            : pathname === href || pathname.startsWith(href + "/");
                          const SectionIcon = section.icon;
                          return (
                            <li key={href}>
                              <Link
                                href={href}
                                onClick={onNavigate}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                                  active
                                    ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-medium"
                                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                                )}
                              >
                                <SectionIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                <span className="truncate">{section.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))]">
        v0.1
      </div>
    </aside>
  );
}
