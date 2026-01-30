import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, CheckCircle2, Clock, TrendingUp, FileText, Target } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/project-utils";
import ReactMarkdown from "react-markdown";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const project = await prisma.project.findUnique({
    where: { publicToken: token },
    select: { name: true, description: true },
  });

  if (!project) {
    return {
      title: "Projeto não encontrado",
    };
  }

  return {
    title: `${project.name} - Relatório de Status`,
    description: project.description || "Acompanhe o progresso do projeto",
  };
}

function statusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "info" | "warning" | "success" | "neutral" }> = {
    PLANNING: { label: "Planejamento", variant: "info" },
    UX_UI: { label: "UX/UI", variant: "info" },
    ARCHITECTURE: { label: "Arquitetura", variant: "info" },
    DEVELOPMENT: { label: "Desenvolvimento", variant: "warning" },
    DEPLOYMENT: { label: "Implantação", variant: "warning" },
    TESTING: { label: "Testes", variant: "warning" },
    DELIVERY: { label: "Entrega", variant: "warning" },
    PUBLISHED: { label: "Publicado", variant: "success" },
    SUPPORT: { label: "Suporte", variant: "success" },
    ON_HOLD: { label: "Pausado", variant: "neutral" },
    COMPLETED: { label: "Concluído", variant: "success" },
    CANCELLED: { label: "Cancelado", variant: "neutral" },
  };

  const statusInfo = statusMap[status] || { label: status, variant: "neutral" as const };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
}

export default async function ClientViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const project = await prisma.project.findUnique({
    where: { publicToken: token },
    include: {
      tasks: {
        where: {
          status: { in: ["IN_PROGRESS", "TESTING", "DONE"] },
        },
        orderBy: [
          { status: "asc" },
          { updatedAt: "desc" },
        ],
        take: 20, // Limita a 20 tasks mais recentes
        include: {
          assignedUser: {
            select: { name: true },
          },
        },
      },
      milestones: {
        where: { completed: false },
        orderBy: { dueDate: "asc" },
        take: 5,
      },
      sections: {
        where: { type: "SCOPE" },
        take: 1,
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Calcula progresso apenas se mostrar status - otimizado: usa dados já carregados
  let totalTasks = 0;
  let doneTasks = 0;
  let inProgressTasks = 0;
  let progress = 0;

  if (project.publicViewShowStatus || project.publicViewShowTasks) {
    // Usa as tasks já carregadas no include acima em vez de fazer 3 queries separadas
    const allProjectTasks = await prisma.task.findMany({
      where: { projectId: project.id },
      select: { status: true },
    });

    totalTasks = allProjectTasks.length;
    doneTasks = allProjectTasks.filter((t) => t.status === "DONE").length;
    inProgressTasks = allProjectTasks.filter((t) =>
      t.status === "IN_PROGRESS" || t.status === "TESTING"
    ).length;

    progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  }

  const scopeSection = project.sections[0];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[hsl(var(--background))] to-[hsl(var(--muted))]/10">
      {/* Header Elegante */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-base text-[hsl(var(--muted-foreground))] max-w-2xl">
                  {project.description}
                </p>
              )}
              {project.clientName && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                  Cliente: {project.clientName}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              {statusBadge(project.status)}
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Relatório gerado em {new Date().toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Geral - Condicional */}
            {project.publicViewShowStatus && (
              <Card className="border-emerald-500/20 bg-gradient-to-br from-[hsl(var(--card))] to-emerald-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Status Geral do Projeto
                  </CardTitle>
                  <CardDescription>
                    Visão consolidada do progresso e entregas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progresso Geral</span>
                      <span className="text-sm font-semibold text-emerald-400">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[hsl(var(--border))]">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{totalTasks}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Total de tarefas
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400">
                        {inProgressTasks}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Em andamento
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-400">
                        {doneTasks}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        Concluídas
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cronograma/Marcos - Condicional */}
            {project.publicViewShowTimeline && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-400" />
                    Cronograma e Marcos
                  </CardTitle>
                  <CardDescription>
                    Próximos marcos e prazos do projeto
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.deadline && (
                    <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-sm font-medium">Prazo de Entrega</span>
                      </div>
                      <div className="text-xl font-bold">
                        {formatDate(project.deadline)}
                      </div>
                      {new Date(project.deadline) < new Date() && (
                        <Badge variant="warning" className="mt-2">
                          Prazo vencido
                        </Badge>
                      )}
                    </div>
                  )}

                  {project.milestones.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Próximos Marcos</h4>
                      {project.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                        >
                          <div className="mt-0.5">
                            <Target className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-medium">{milestone.title}</h5>
                            {milestone.description && (
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                {milestone.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                              <CalendarDays className="h-3 w-3" />
                              <span>{formatDate(milestone.dueDate)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                      Nenhum marco próximo definido.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tasks Resumidas - Condicional */}
            {project.publicViewShowTasks && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-sky-400" />
                    Progresso das Tarefas
                  </CardTitle>
                  <CardDescription>
                    Tarefas em andamento e concluídas recentemente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.tasks.length === 0 ? (
                    <div className="text-center py-8 text-sm text-[hsl(var(--muted-foreground))]">
                      Nenhuma tarefa em andamento ou concluída ainda.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {project.tasks.map((task) => {
                        const isDone = task.status === "DONE";
                        const isTesting = task.status === "TESTING";

                        return (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))]/20 transition-colors"
                          >
                            <div className="mt-0.5">
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                              ) : isTesting ? (
                                <Clock className="h-5 w-5 text-purple-400" />
                              ) : (
                                <TrendingUp className="h-5 w-5 text-amber-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-medium">{task.title}</h4>
                                <Badge
                                  variant={
                                    isDone
                                      ? "success"
                                      : isTesting
                                        ? "info"
                                        : "warning"
                                  }
                                  className="text-xs flex-shrink-0"
                                >
                                  {isDone
                                    ? "Concluída"
                                    : isTesting
                                      ? "Em testes"
                                      : "Em progresso"}
                                </Badge>
                              </div>
                              {task.description && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Escopo - Condicional */}
            {project.publicViewShowScope && scopeSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Escopo do Projeto
                  </CardTitle>
                  <CardDescription>
                    Definição do escopo e entregas planejadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-3 leading-relaxed">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-outside pl-6 mb-3 space-y-1">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-outside pl-6 mb-3 space-y-1">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="[&>p]:inline [&>p]:m-0">{children}</li>
                        ),
                        code: ({ children }) => (
                          <code className="bg-[hsl(var(--muted))] px-1 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[hsl(var(--muted-foreground))] pl-4 italic my-3">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {scopeSection.content}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações do Projeto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Tipo</span>
                  <Badge variant="neutral">{project.type}</Badge>
                </div>
                {project.startDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Iniciado em</span>
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                )}
                {project.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Prazo</span>
                    <span>{formatDate(project.deadline)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Última atualização</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-xs text-[hsl(var(--muted-foreground))] pt-4">
              <p className="font-medium mb-1">Visualização Compartilhada</p>
              <p>Relatório de status do projeto</p>
              <p className="mt-2 text-[hsl(var(--muted-foreground))]/70">
                Somente leitura • Atualizado automaticamente
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
