"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isProjectOwner } from "@/lib/project-permissions";
import { createActivity } from "@/lib/activity-log";
import { randomUUID } from "crypto";
import { ProjectStatus } from "@prisma/client";

export async function generatePublicTokenAction(projectId: string) {
  // Verifica se usuário é OWNER
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false as const,
      error: "Apenas o dono do projeto pode gerar link público",
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return { success: false as const, error: "Projeto não encontrado" };
  }

  // Gera um token UUID aleatório para segurança
  const token = randomUUID();

  await prisma.project.update({
    where: { id: projectId },
    data: { publicToken: token },
  });

  revalidatePath(`/projects/${projectId}`);

  return { success: true as const, token };
}

export async function revokePublicTokenAction(projectId: string) {
  // Verifica se usuário é OWNER
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false as const,
      error: "Apenas o dono do projeto pode revogar link público",
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return { success: false as const, error: "Projeto não encontrado" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { publicToken: null },
  });

  revalidatePath(`/projects/${projectId}`);

  return { success: true as const };
}

export async function updateProjectStatusAction(
  projectId: string,
  status: ProjectStatus
) {
  // Verifica se usuário tem acesso
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false as const,
      error: "Você precisa estar logado.",
    };
  }

  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false as const,
      error: "Apenas o dono do projeto pode alterar o status",
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true, name: true },
  });

  if (!project) {
    return { success: false as const, error: "Projeto não encontrado" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });

  // Cria log de atividade
  const statusLabels: Record<ProjectStatus, string> = {
    PLANNING: "Planejamento",
    UX_UI: "UX/UI",
    ARCHITECTURE: "Arquitetura",
    DEVELOPMENT: "Desenvolvimento",
    DEPLOYMENT: "Implantação",
    TESTING: "Testes",
    DELIVERY: "Entrega",
    PUBLISHED: "Publicado",
    SUPPORT: "Suporte",
    ON_HOLD: "Pausado",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };

  await createActivity({
    type: "PROJECT_STATUS_CHANGED",
    action: "alterou o status do projeto",
    message: `${user.name} alterou o status do projeto "${project.name}" para ${statusLabels[status]}`,
    projectId,
    entityId: projectId,
    entityType: "PROJECT",
  });

  revalidatePath(`/projects/${projectId}`);

  return { success: true as const };
}

export async function updateProjectDatesAction(
  projectId: string,
  startDate: string | null,
  deadline: string | null
) {
  // Verifica se usuário tem acesso
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false as const,
      error: "Apenas o dono do projeto pode alterar as datas",
    };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      startDate: startDate ? new Date(startDate) : null,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  revalidatePath(`/projects/${projectId}`);

  return { success: true as const };
}
