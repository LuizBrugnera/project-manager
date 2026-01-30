"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isProjectOwner } from "@/lib/project-permissions";
import type { ProjectType } from "@prisma/client";
import { createActivity } from "@/lib/activity-log";

// ========== ADD MEMBER ==========
export async function addMemberAction(
  projectId: string,
  email: string
): Promise<{ success: true } | { success: false; error: string }> {
  // Verifica se usuário é OWNER
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false,
      error: "Apenas o dono do projeto pode adicionar membros",
    };
  }

  // Normaliza email
  const normalizedEmail = email.toLowerCase().trim();

  if (!normalizedEmail) {
    return { success: false, error: "Email é obrigatório" };
  }

  // Busca usuário pelo email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return {
      success: false,
      error: "Usuário não encontrado. O email precisa estar cadastrado na plataforma.",
    };
  }

  // Verifica se projeto existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, createdById: true },
  });

  if (!project) {
    return { success: false, error: "Projeto não encontrado" };
  }

  // Não permite adicionar o próprio dono
  if (user.id === project.createdById) {
    return {
      success: false,
      error: "O dono do projeto já tem acesso completo",
    };
  }

  // Verifica se já é membro
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: user.id,
        projectId: projectId,
      },
    },
  });

  if (existingMember) {
    return {
      success: false,
      error: "Este usuário já é membro do projeto",
    };
  }

  // Adiciona membro
  await prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId: projectId,
    },
  });

  // Cria log de atividade
  const currentUser = await getCurrentUser();
  const projectForLog = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  
  if (currentUser && projectForLog) {
    await createActivity({
      type: "MEMBER_ADDED",
      action: "adicionou membro ao projeto",
      message: `adicionou ${user.name} ao projeto`,
      projectId,
    });
  }

  revalidatePath(`/projects/${projectId}/settings`);

  return { success: true };
}

// ========== REMOVE MEMBER ==========
export async function removeMemberAction(
  projectId: string,
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  // Verifica se usuário é OWNER
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false,
      error: "Apenas o dono do projeto pode remover membros",
    };
  }

  // Verifica se projeto existe
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });

  if (!project) {
    return { success: false, error: "Projeto não encontrado" };
  }

  // Não permite remover o próprio dono
  if (userId === project.createdById) {
    return {
      success: false,
      error: "Não é possível remover o dono do projeto",
    };
  }

  // Busca dados do membro antes de remover
  const memberToRemove = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  // Remove membro
  await prisma.projectMember.delete({
    where: {
      userId_projectId: {
        userId: userId,
        projectId: projectId,
      },
    },
  });

  // Cria log de atividade
  const currentUser = await getCurrentUser();
  const projectForLog = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });
  
  if (currentUser && projectForLog && memberToRemove) {
    await createActivity({
      type: "MEMBER_REMOVED",
      action: "removeu membro do projeto",
      message: `removeu ${memberToRemove.name} do projeto`,
      projectId,
    });
  }

  revalidatePath(`/projects/${projectId}/settings`);

  return { success: true };
}

// ========== UPDATE PROJECT TYPE (owner only) ==========
export async function updateProjectTypeAction(
  projectId: string,
  type: ProjectType
): Promise<{ success: true } | { success: false; error: string }> {
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false,
      error: "Apenas o dono do projeto pode alterar o tipo.",
    };
  }

  const valid: ProjectType[] = ["WEB", "MOBILE", "FULLSTACK"];
  if (!valid.includes(type)) {
    return { success: false, error: "Tipo inválido." };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { type },
  });

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);

  return { success: true };
}

// ========== DELETE PROJECT (owner only, confirm by typing project name) ==========
export async function deleteProjectAction(
  projectId: string,
  confirmationName: string
): Promise<{ success: true } | { success: false; error: string }> {
  const isOwner = await isProjectOwner(projectId);
  if (!isOwner) {
    return {
      success: false,
      error: "Apenas o dono do projeto pode excluí-lo",
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, id: true },
  });

  if (!project) {
    return { success: false, error: "Projeto não encontrado" };
  }

  const trimmed = confirmationName.trim();
  if (trimmed !== project.name) {
    return {
      success: false,
      error: "O nome digitado não confere com o nome do projeto. Digite exatamente o nome do projeto para confirmar.",
    };
  }

  // Exclui em ordem por causa das FKs (sem onDelete Cascade no schema)
  await prisma.$transaction(async (tx) => {
    const sections = await tx.projectSection.findMany({
      where: { projectId },
      select: { id: true },
    });
    for (const s of sections) {
      await tx.contentVersion.deleteMany({ where: { sectionId: s.id } });
    }
    await tx.projectMember.deleteMany({ where: { projectId } });
    await tx.task.deleteMany({ where: { projectId } });
    await tx.activityLog.deleteMany({ where: { projectId } });
    await tx.projectMilestone.deleteMany({ where: { projectId } });
    await tx.meeting.deleteMany({ where: { projectId } });
    await tx.projectSection.deleteMany({ where: { projectId } });
    await tx.project.delete({ where: { id: projectId } });
  });

  return { success: true };
}
