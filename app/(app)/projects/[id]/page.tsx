import { notFound, redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, ListTodo, FileText, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { ProjectType } from "@prisma/client";

function projectTypeLabel(type: ProjectType): string {
  switch (type) {
    case "WEB":
      return "Web";
    case "MOBILE":
      return "App";
    case "FULLSTACK":
      return "Web & App";
    default:
      return String(type);
  }
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(id);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        select: { status: true, priority: true },
      },
      sections: {
        select: { type: true },
      },
      members: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
      createdBy: {
        select: { name: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = project.tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const testingTasks = project.tasks.filter((t) => t.status === "TESTING").length;
  const backlogTasks = project.tasks.filter((t) => t.status === "BACKLOG").length;
  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const hasContext = project.sections.some((s) => s.type === "CONTEXT");
  const hasScope = project.sections.some((s) => s.type === "SCOPE");
  const hasRoles = project.sections.some((s) => s.type === "ROLES");

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Card de Progresso */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Progresso Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress}%</div>
          <Progress value={progress} className="mt-2" />
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            {doneTasks} de {totalTasks} tasks concluídas
          </p>
        </CardContent>
      </Card>

      {/* Card de Tasks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-sky-400" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {backlogTasks > 0 && (
              <Badge variant="neutral">{backlogTasks} backlog</Badge>
            )}
            {inProgressTasks > 0 && (
              <Badge variant="warning">{inProgressTasks} em andamento</Badge>
            )}
            {testingTasks > 0 && (
              <Badge variant="info">{testingTasks} em testes</Badge>
            )}
            {doneTasks > 0 && (
              <Badge variant="success">{doneTasks} concluídas</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card de Deadline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-amber-400" />
            Deadline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.deadline ? (
            <>
              <div className="text-2xl font-bold">
                {new Date(project.deadline).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                })}
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                {new Date(project.deadline).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </>
          ) : (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              Sem deadline definida
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Definição */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-400" />
            Definição do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Contexto</span>
              {hasContext ? (
                <Badge variant="success">Preenchido</Badge>
              ) : (
                <Badge variant="neutral">Pendente</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Escopo</span>
              {hasScope ? (
                <Badge variant="success">Preenchido</Badge>
              ) : (
                <Badge variant="neutral">Pendente</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Papéis</span>
              {hasRoles ? (
                <Badge variant="success">Preenchido</Badge>
              ) : (
                <Badge variant="neutral">Pendente</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Equipe */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-pink-400" />
            Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{project.members.length + 1}</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            Criado por {project.createdBy.name}
          </p>
        </CardContent>
      </Card>

      {/* Card de Informações */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Tipo</span>
              <Badge variant="neutral">{projectTypeLabel(project.type)}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Criado em</span>
              <span>
                {new Date(project.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
