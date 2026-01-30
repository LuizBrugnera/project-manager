import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { RoadmapClient } from "./roadmap-client";
import type { ProjectStatus } from "@prisma/client";

export default async function ProjectRoadmapPage({
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
    select: {
      id: true,
      status: true,
      startDate: true,
      deadline: true,
      milestones: {
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Roadmap & Marcos</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Gerencie os marcos importantes do projeto e acompanhe o cronograma visualmente.
        </p>
      </div>

      <RoadmapClient
        projectId={id}
        initialMilestones={project.milestones}
        projectStatus={project.status}
        projectStartDate={project.startDate}
        projectDeadline={project.deadline}
      />
    </div>
  );
}
