import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";

/** Filtro Prisma para listar apenas projetos em que o usuário é dono ou membro */
export function projectsWhereUserHasAccess(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [
      { createdById: userId },
      { members: { some: { userId } } },
    ],
  };
}

export async function isProjectOwner(projectId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true, workspaceId: true },
  });

  // Dono do projeto (criador) ou dono do workspace do projeto
  if (!project) return false;
  if (project.createdById === user.id) return true;
  if (!user.workspaceId) return false;

  const workspace = await prisma.workspace.findUnique({
    where: { id: project.workspaceId },
    select: { ownerId: true },
  });

  return workspace?.ownerId === user.id;
}

export async function hasProjectAccess(
  projectId: string
): Promise<{ hasAccess: boolean; isOwner: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { hasAccess: false, isOwner: false };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      createdById: true,
      workspaceId: true,
      members: {
        where: { userId: user.id },
        select: { userId: true },
      },
    },
  });

  if (!project) return { hasAccess: false, isOwner: false };

  const isMember = project.members.length > 0;
  const isOwner = project.createdById === user.id;

  // Membro do projeto tem acesso total (igual ao dono), independente de workspace
  if (isMember || isOwner) {
    return { hasAccess: true, isOwner };
  }

  // Sem ser dono nem membro: exige mesmo workspace (isolamento por workspace)
  if (!user.workspaceId) return { hasAccess: false, isOwner: false };
  if (project.workspaceId !== user.workspaceId) {
    return { hasAccess: false, isOwner: false };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: project.workspaceId },
    select: { ownerId: true },
  });
  const isWorkspaceOwner = workspace?.ownerId === user.id;

  return {
    hasAccess: isWorkspaceOwner,
    isOwner: isWorkspaceOwner,
  };
}
