"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isProjectOwner } from "@/lib/project-permissions";

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

  // Verifica se é Owner
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false,
      error: "Apenas o dono do projeto pode alterar a visibilidade pública.",
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
