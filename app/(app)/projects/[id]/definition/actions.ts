"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";
import { createActivity } from "@/lib/activity-log";
import { ProjectSectionType } from "@prisma/client";

type SaveSectionResult =
  | { success: true }
  | { success: false; error: string };

export async function saveSectionAction(
  projectId: string,
  type: ProjectSectionType,
  content: string
): Promise<SaveSectionResult> {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Você precisa estar logado." };
  }

  if (!projectId) {
    return { success: false, error: "ID do projeto não informado." };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: "Você não tem acesso a este projeto." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { success: false, error: "Projeto não encontrado." };
  }

  const titleMap: Record<ProjectSectionType, string> = {
    CONTEXT: "Contexto",
    SCOPE: "Escopo",
    ROLES: "Papéis",
    ARCHITECTURE: "Arquitetura",
    BACKEND_MODELAGEM: "Modelagem de Banco",
    BACKEND_DIAGRAMAS: "Diagramas",
    BACKEND_ARQUITETURA: "Arquitetura Backend",
    FRONTEND_FLUXO: "Fluxo de Usuário",
    FRONTEND_UI_DESIGN: "UI Design",
    FRONTEND_PROTOTIPO: "Protótipo",
  };
  const title = titleMap[type];

  // Upsert: cria ou atualiza a seção
  const existingSection = await prisma.projectSection.findFirst({
    where: { projectId, type },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  let sectionId: string;
  let oldContent: string | null = null;

  if (existingSection) {
    oldContent = existingSection.content;
    
    // Só cria versão se o conteúdo realmente mudou
    if (oldContent !== content) {
      // Pega o próximo número de versão
      const lastVersion = existingSection.versions[0];
      const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

      // Cria snapshot da versão anterior
      await prisma.contentVersion.create({
        data: {
          sectionId: existingSection.id,
          content: oldContent,
          version: nextVersion,
          createdById: user.id,
        },
      });
    }

    // Atualiza a seção com novo conteúdo
    await prisma.projectSection.update({
      where: { id: existingSection.id },
      data: { content, title },
    });
    sectionId = existingSection.id;
  } else {
    const newSection = await prisma.projectSection.create({
      data: {
        projectId,
        type,
        title: title ?? "Seção",
        content,
      },
    });
    sectionId = newSection.id;
    
    // Cria a primeira versão
    await prisma.contentVersion.create({
      data: {
        sectionId: newSection.id,
        content,
        version: 1,
        createdById: user.id,
      },
    });
  }

  // Cria log de atividade apenas se houve mudança
  if (!existingSection || oldContent !== content) {
    const sectionLabels: Record<ProjectSectionType, string> = {
      CONTEXT: "o contexto",
      SCOPE: "o escopo",
      ROLES: "os papéis",
      ARCHITECTURE: "a arquitetura",
      BACKEND_MODELAGEM: "a modelagem de banco",
      BACKEND_DIAGRAMAS: "os diagramas",
      BACKEND_ARQUITETURA: "a arquitetura backend",
      FRONTEND_FLUXO: "o fluxo de usuário",
      FRONTEND_UI_DESIGN: "o design UI",
      FRONTEND_PROTOTIPO: "o protótipo",
    };

    await createActivity({
      type: "SECTION_UPDATED",
      action: `atualizou ${sectionLabels[type] || "uma seção"}`,
      message: `${user.name} atualizou ${sectionLabels[type] || "uma seção"}`,
      projectId,
      entityId: sectionId,
      entityType: "SECTION",
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/definition`);

  return { success: true };
}

/**
 * Busca todas as versões de uma seção
 */
export async function getSectionVersions(
  projectId: string,
  sectionType: ProjectSectionType
) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado." };
  }

  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return { success: false as const, error: "Você não tem acesso a este projeto." };
  }

  const section = await prisma.projectSection.findFirst({
    where: { projectId, type: sectionType },
    include: {
      versions: {
        orderBy: { version: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!section) {
    return { success: false as const, error: "Seção não encontrada." };
  }

  return {
    success: true as const,
    versions: section.versions,
    currentContent: section.content,
  };
}

/**
 * Restaura uma versão específica como a versão atual
 */
export async function restoreSectionVersion(
  projectId: string,
  sectionType: ProjectSectionType,
  versionId: string
): Promise<SaveSectionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Você precisa estar logado." };
  }

  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return { success: false, error: "Você não tem acesso a este projeto." };
  }

  // Busca a versão a ser restaurada
  const version = await prisma.contentVersion.findUnique({
    where: { id: versionId },
    include: {
      section: {
        select: {
          id: true,
          projectId: true,
          type: true,
          content: true,
        },
      },
    },
  });

  if (!version) {
    return { success: false, error: "Versão não encontrada." };
  }

  // Verifica se a seção pertence ao projeto correto
  if (version.section.projectId !== projectId || version.section.type !== sectionType) {
    return { success: false, error: "Versão não pertence a esta seção." };
  }

  const oldContent = version.section.content;
  const newContent = version.content;

  // Se o conteúdo já é o mesmo, não faz nada
  if (oldContent === newContent) {
    return { success: true };
  }

  // Pega o próximo número de versão
  const lastVersion = await prisma.contentVersion.findFirst({
    where: { sectionId: version.section.id },
    orderBy: { version: "desc" },
  });
  const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

  // Cria snapshot da versão atual antes de restaurar
  await prisma.contentVersion.create({
    data: {
      sectionId: version.section.id,
      content: oldContent,
      version: nextVersion,
      createdById: user.id,
    },
  });

  // Restaura o conteúdo da versão selecionada
  await prisma.projectSection.update({
    where: { id: version.section.id },
    data: { content: newContent },
  });

  // Cria log de atividade
  const sectionLabels: Record<ProjectSectionType, string> = {
    CONTEXT: "o contexto",
    SCOPE: "o escopo",
    ROLES: "os papéis",
    ARCHITECTURE: "a arquitetura",
    BACKEND_MODELAGEM: "a modelagem de banco",
    BACKEND_DIAGRAMAS: "os diagramas",
    BACKEND_ARQUITETURA: "a arquitetura backend",
    FRONTEND_FLUXO: "o fluxo de usuário",
    FRONTEND_UI_DESIGN: "o design UI",
    FRONTEND_PROTOTIPO: "o protótipo",
  };

  await createActivity({
    type: "SECTION_UPDATED",
    action: `restaurou uma versão de ${sectionLabels[sectionType] || "uma seção"}`,
    message: `${user.name} restaurou uma versão anterior de ${sectionLabels[sectionType] || "uma seção"}`,
    projectId,
    entityId: version.section.id,
    entityType: "SECTION",
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/definition`);

  return { success: true };
}
