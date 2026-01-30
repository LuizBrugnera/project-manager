"use server";

import { prisma } from "./prisma";
import { hasProjectAccess } from "./project-permissions";

/**
 * Retorna o nome do projeto para exibição na sidebar (somente se o usuário tiver acesso).
 */
export async function getProjectName(projectId: string): Promise<string | null> {
  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  return project?.name ?? null;
}
