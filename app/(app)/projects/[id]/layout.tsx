import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ShareLinkButton } from "./share-link-button";
import { ProjectStatusSelect } from "@/components/project/project-status-select";
import { ProjectDates } from "@/components/project/project-dates";
import { ObservationModeToggle } from "@/components/project/observation-mode-toggle";
import { calculateProjectProgress } from "@/lib/project-utils";
import type { ProjectStatus } from "@prisma/client";

function statusBadge(status: ProjectStatus) {
  switch (status) {
    case "PLANNING":
      return <Badge variant="info">Planejamento</Badge>;
    case "UX_UI":
      return <Badge variant="info">UX/UI</Badge>;
    case "ARCHITECTURE":
      return <Badge variant="info">Arquitetura</Badge>;
    case "DEVELOPMENT":
      return <Badge variant="warning">Desenvolvimento</Badge>;
    case "DEPLOYMENT":
      return <Badge variant="warning">Implantação</Badge>;
    case "TESTING":
      return <Badge variant="warning">Testes</Badge>;
    case "DELIVERY":
      return <Badge variant="warning">Entrega</Badge>;
    case "PUBLISHED":
      return <Badge variant="success">Publicado</Badge>;
    case "SUPPORT":
      return <Badge variant="success">Suporte</Badge>;
    case "ON_HOLD":
      return <Badge variant="neutral">Pausado</Badge>;
    case "COMPLETED":
      return <Badge variant="success">Concluído</Badge>;
    case "CANCELLED":
      return <Badge variant="neutral">Cancelado</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Garante que apenas usuários vinculados ao projeto acessem qualquer subrota (/projects/[id]/*)
  const { hasAccess } = await hasProjectAccess(id);
  if (!hasAccess) {
    // Middleware já garante login; aqui garantimos vínculo ao projeto.
    redirect("/forbidden");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      clientName: true,
      publicToken: true,
      startDate: true,
      deadline: true,
      tasks: {
        select: { status: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const tabs = [
    { href: `/projects/${id}`, label: "Visão Geral", exact: true },
    { href: `/projects/${id}/definition`, label: "Definição" },
    { href: `/projects/${id}/architecture`, label: "Arquitetura" },
    { href: `/projects/${id}/tasks`, label: "Tasks" },
    { href: `/projects/${id}/roadmap`, label: "Roadmap" },
    { href: `/projects/${id}/meetings`, label: "Reuniões" },
    { href: `/projects/${id}/client`, label: "Dados do Cliente" },
    { href: `/projects/${id}/commercial`, label: "Comercial" },
    { href: `/projects/${id}/docs`, label: "Docs" },
    { href: `/projects/${id}/activities`, label: "Atividades" },
    { href: `/projects/${id}/settings`, label: "Configurações" },
  ];

  const progress = calculateProjectProgress(project.tasks);

  return (
    <div className="space-y-4">
      {/* Header do Projeto */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button asChild variant="ghost" size="icon" className="mt-0.5">
              <Link href="/dashboard" aria-label="Voltar">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold">{project.name}</h1>
                {statusBadge(project.status)}
                <ObservationModeToggle />
              </div>
              {project.clientName && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Cliente: {project.clientName}
                </p>
              )}
            </div>
          </div>

          <ShareLinkButton projectId={id} currentToken={project.publicToken} />
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Progresso do Projeto</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Status Select e Datas */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status do Projeto</label>
            <ProjectStatusSelect projectId={id} currentStatus={project.status} />
          </div>

          <ProjectDates
            projectId={id}
            startDate={project.startDate}
            deadline={project.deadline}
          />
        </div>
      </div>

      {/* Tabs de Navegação */}
      <Tabs tabs={tabs} />

      {/* Conteúdo da aba */}
      <div>{children}</div>
    </div>
  );
}
