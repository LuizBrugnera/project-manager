"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";

type UpdateVisibilityResult =
  | { success: true }
  | { success: false; error: string };

export async function updatePublicVisibilityAction(
  projectId: string,
  visibility: {
    showStatus?: boolean;
    showTimeline?: boolean;
    showTasks?: boolean;
    showScope?: boolean;
  }
): Promise<UpdateVisibilityResult> {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Você precisa estar logado." };
  }

  // Dono ou membro podem alterar visibilidade
  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return {
      success: false,
      error: "Você não tem acesso a este projeto.",
    };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      publicViewShowStatus: visibility.showStatus,
      publicViewShowTimeline: visibility.showTimeline,
      publicViewShowTasks: visibility.showTasks,
      publicViewShowScope: visibility.showScope,
    },
  });

  revalidatePath(`/projects/${projectId}/settings`);

  return { success: true };
}
