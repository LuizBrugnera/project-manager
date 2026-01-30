import Link from "next/link";
import { redirect } from "next/navigation";
import { Rocket } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { Timeline } from "@/components/dashboard/timeline";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { projectsWhereUserHasAccess } from "@/lib/project-permissions";
import { getUserRelevantActivities } from "@/lib/activity-log";

type ProjectWithTasks = Prisma.ProjectGetPayload<{
  include: { tasks: { select: { status: true } } };
}>;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects: ProjectWithTasks[] = await prisma.project.findMany({
    where: projectsWhereUserHasAccess(user.id),
    orderBy: { updatedAt: "desc" },
    include: {
      tasks: {
        select: { status: true },
      },
    },
  });

  // Calcula KPIs - otimizado: usa os dados já carregados em vez de nova query
  const activeProjects = projects.filter(
    (p) => p.status === "PLANNING" || p.status === "DEVELOPMENT" || p.status === "TESTING" || p.status === "DEPLOYMENT" || p.status === "DELIVERY"
  ).length;

  // Calcula tasks pendentes usando os dados já carregados (evita N+1)
  const allTasks = projects.flatMap((p) => p.tasks);
  const pendingTasks = allTasks.filter(
    (t) => t.status !== "DONE"
  ).length;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = projects.filter((p) => {
    if (!p.deadline) return false;
    const deadline = new Date(p.deadline);
    return deadline >= now && deadline <= thirtyDaysFromNow;
  }).length;

  // Atividades recentes apenas dos projetos que o usuário tem acesso
  const activities = await getUserRelevantActivities(user.id, 10);

  // Formata atividades para o componente
  const formattedActivities = activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    message: activity.message,
    userName: activity.user?.name || null,
    projectName: activity.project?.name || null,
    projectId: activity.projectId || null,
    createdAt: activity.createdAt,
  }));

  // Projetos com deadline para timeline
  const projectsWithDeadline = projects
    .filter((p) => p.deadline)
    .map((p) => ({
      id: p.id,
      name: p.name,
      deadline: p.deadline,
      status: p.status,
      clientName: p.clientName,
    }));

  // Se não há projetos, mostra empty state
  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Visão geral dos seus projetos e atividades
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16">
            <EmptyState
              icon={<Rocket className="h-16 w-16" />}
              title="Nenhum projeto ainda"
              description="Que tal criar o próximo unicórnio? Comece organizando escopo, tasks e documentação em um só lugar."
              action={{
                label: "Criar Primeiro Projeto",
                href: "/projects/new",
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Visão geral dos seus projetos e atividades
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Novo Projeto</Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <KPICards
        activeProjects={activeProjects}
        pendingTasks={pendingTasks}
        upcomingDeadlines={upcomingDeadlines}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline - Ocupa 2 colunas */}
        <div className="lg:col-span-2">
          <Timeline projects={projectsWithDeadline} />
        </div>

        {/* Atividades Recentes - Sidebar */}
        <div>
          <RecentActivities activities={formattedActivities} />
        </div>
      </div>
    </div>
  );
}
