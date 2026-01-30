"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createActivity } from "@/lib/activity-log";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const clientName = String(formData.get("clientName") || "").trim();

  if (!name) {
    return { success: false as const, error: "Nome é obrigatório." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado." };
  }

  try {
    if (!user.workspaceId) {
      return {
        success: false as const,
        error: "Seu usuário não está vinculado a um workspace.",
      };
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        clientName: clientName || null,
        type: "WEB",
        status: "PLANNING",
        createdById: user.id,
        workspaceId: user.workspaceId,
      },
    });

    // Cria log de atividade
    await createActivity({
      type: "PROJECT_CREATED",
      action: "criou o projeto",
      message: `criou o projeto "${name}"`,
      projectId: project.id,
    });

    return { success: true as const, projectId: project.id };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Erro ao criar projeto",
    };
  }
}

