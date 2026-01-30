"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";

type MilestoneResult =
  | { success: true; milestone?: any }
  | { success: false; error: string };

export async function createMilestoneAction(
  projectId: string,
  title: string,
  description: string | null,
  dueDate: string
): Promise<MilestoneResult> {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Você precisa estar logado." };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: "Você não tem acesso a este projeto." };
  }

  if (!title.trim()) {
    return { success: false, error: "Título é obrigatório." };
  }

  const milestone = await prisma.projectMilestone.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      dueDate: new Date(dueDate),
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}/roadmap`);

  return { success: true, milestone };
}

export async function updateMilestoneAction(
  milestoneId: string,
  projectId: string,
  data: {
    title?: string;
    description?: string | null;
    dueDate?: string;
    completed?: boolean;
  }
): Promise<MilestoneResult> {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Você precisa estar logado." };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: "Você não tem acesso a este projeto." };
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
  if (data.completed !== undefined) {
    updateData.completed = data.completed;
    if (data.completed) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }

  const milestone = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: updateData,
  });

  revalidatePath(`/projects/${projectId}/roadmap`);

  return { success: true, milestone };
}

export async function deleteMilestoneAction(
  milestoneId: string,
  projectId: string
): Promise<MilestoneResult> {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Você precisa estar logado." };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: "Você não tem acesso a este projeto." };
  }

  await prisma.projectMilestone.delete({
    where: { id: milestoneId },
  });

  revalidatePath(`/projects/${projectId}/roadmap`);

  return { success: true };
}
