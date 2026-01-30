import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";
import type { ActivityType } from "@prisma/client";

interface CreateActivityParams {
  type: ActivityType;
  action: string; // Ex: "atualizou o escopo", "concluiu uma task"
  message: string; // Mensagem formatada para exibição
  projectId?: string;
  entityId?: string; // ID da entidade relacionada
  entityType?: string; // Tipo da entidade: "TASK", "SECTION", "PROJECT", etc
  metadata?: Record<string, any>;
}

/**
 * Cria um registro de atividade no log
 * Se userId não for fornecido, tenta obter do usuário atual
 */
export async function createActivity({
  type,
  action,
  message,
  projectId,
  entityId,
  entityType,
  metadata,
}: CreateActivityParams) {
  try {
    const user = await getCurrentUser();
    
    await prisma.activityLog.create({
      data: {
        type,
        action,
        message,
        userId: user?.id || null,
        projectId: projectId || null,
        entityId: entityId || null,
        entityType: entityType || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Não quebra o fluxo se falhar ao criar log
    console.error("Erro ao criar activity log:", error);
  }
}

/**
 * Busca atividades recentes de um projeto específico
 */
export async function getProjectActivities(
  projectId: string,
  limit: number = 20
) {
  return prisma.activityLog.findMany({
    where: { projectId },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });
}

/**
 * Busca atividades recentes relevantes para o usuário logado
 * (projetos onde ele é membro ou owner)
 */
export async function getUserRelevantActivities(
  userId: string,
  limit: number = 5
) {
  // Busca projetos onde o usuário é membro ou owner
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { createdById: userId },
        {
          members: {
            some: { userId },
          },
        },
      ],
    },
    select: { id: true },
  });

  const projectIds = userProjects.map((p) => p.id);

  if (projectIds.length === 0) {
    return [];
  }

  return prisma.activityLog.findMany({
    where: {
      projectId: { in: projectIds },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Busca atividades recentes gerais (para dashboard)
 */
export async function getRecentActivities(limit: number = 10) {
  return prisma.activityLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
