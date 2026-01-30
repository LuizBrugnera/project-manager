"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";

type UpdateClientDataResult =
  | { success: true }
  | { success: false; error: string };

export async function updateClientDataAction(
  projectId: string,
  data: {
    clientCompany?: string;
    clientContactName?: string;
    clientContactEmail?: string;
    clientNotes?: string;
  }
): Promise<UpdateClientDataResult> {
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

  await prisma.project.update({
    where: { id: projectId },
    data: {
      clientCompany: data.clientCompany?.trim() || null,
      clientContactName: data.clientContactName?.trim() || null,
      clientContactEmail: data.clientContactEmail?.trim() || null,
      clientNotes: data.clientNotes?.trim() || null,
    },
  });

  revalidatePath(`/projects/${projectId}/client`);

  return { success: true };
}
