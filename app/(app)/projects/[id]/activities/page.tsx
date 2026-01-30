import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { getProjectActivities } from "@/lib/activity-log";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectActivitiesFeed } from "./project-activities-feed";

export default async function ProjectActivitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(id);
  if (!hasAccess) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
    },
  });

  if (!project) {
    notFound();
  }

  const activities = await getProjectActivities(id, 50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Atividades do Projeto</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Histórico de todas as ações realizadas no projeto "{project.name}".
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feed de Atividades</CardTitle>
          <CardDescription>
            Acompanhe todas as mudanças e ações realizadas pela equipe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectActivitiesFeed initialActivities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
