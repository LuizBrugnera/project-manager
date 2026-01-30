import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { getCurrentUser } from "@/lib/auth";
import { TasksPageClient } from "./tasks-page-client";

export default async function ProjectTasksPage({
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

  // Busca usuário atual para filtro
  const currentUser = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { listOrder: "asc" },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Lista de membros disponíveis para atribuição (owner + members)
  const teamMembers = [
    project.createdBy,
    ...project.members.map((m) => m.user),
  ];

  return (
    <div className="space-y-4">
      <TasksPageClient
        projectId={id}
        initialTasks={project.tasks}
        teamMembers={teamMembers}
        currentUserId={currentUser?.id || null}
      />
    </div>
  );
}
