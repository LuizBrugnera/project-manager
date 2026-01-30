"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";
import { createActivity } from "@/lib/activity-log";
import { ProjectSectionType } from "@prisma/client";

type UpdateSectionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProjectSection(
  projectId: string,
  sectionKey: string,
  content: string,
  externalLinks?: {
    figma?: string;
    github?: string;
    other?: string[];
  }
): Promise<UpdateSectionResult> {
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

  // Mapeia sectionKey para ProjectSectionType
  const sectionTypeMap: Record<string, ProjectSectionType> = {
    backend_modelagem: "BACKEND_MODELAGEM",
    backend_diagramas: "BACKEND_DIAGRAMAS",
    backend_arquitetura: "BACKEND_ARQUITETURA",
    frontend_fluxo: "FRONTEND_FLUXO",
    frontend_ui_design: "FRONTEND_UI_DESIGN",
    frontend_prototipo: "FRONTEND_PROTOTIPO",
  };

  const sectionType = sectionTypeMap[sectionKey];
  if (!sectionType) {
    return { success: false, error: `Tipo de seção inválido: ${sectionKey}` };
  }

  const titleMap: Record<string, string> = {
    backend_modelagem: "Modelagem de Banco",
    backend_diagramas: "Diagramas",
    backend_arquitetura: "Arquitetura",
    frontend_fluxo: "Fluxo de Usuário",
    frontend_ui_design: "UI Design",
    frontend_prototipo: "Protótipo",
  };

  const title = titleMap[sectionKey] || sectionKey;

  // Serializa externalLinks para JSON
  const externalLinksJson = externalLinks
    ? JSON.stringify(externalLinks)
    : null;

  // Upsert: cria ou atualiza a seção
  const existingSection = await prisma.projectSection.findFirst({
    where: { projectId, type: sectionType },
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

    await prisma.projectSection.update({
      where: { id: existingSection.id },
      data: {
        content,
        title,
        externalLinks: externalLinksJson,
      },
    });
    sectionId = existingSection.id;
  } else {
    const newSection = await prisma.projectSection.create({
      data: {
        projectId,
        type: sectionType,
        title,
        content,
        externalLinks: externalLinksJson,
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
      action: `atualizou ${sectionLabels[sectionType] || "uma seção"}`,
      message: `${user.name} atualizou ${sectionLabels[sectionType] || "uma seção"}`,
      projectId,
      entityId: sectionId,
      entityType: "SECTION",
    });
  }

  revalidatePath(`/projects/${projectId}/architecture`);

  return { success: true };
}
