"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isProjectOwner } from "@/lib/project-permissions";

type UpdateCommercialDataResult =
  | { success: true }
  | { success: false; error: string };

export async function updateCommercialDataAction(
  projectId: string,
  data: {
    proposalValue?: string | null;
    contractLink?: string | null;
    commercialNotes?: string | null;
  }
): Promise<UpdateCommercialDataResult> {
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
      error: "Apenas o dono do projeto pode editar dados comerciais.",
    };
  }

  const updateData: any = {};
  if (data.proposalValue !== undefined) {
    if (data.proposalValue && data.proposalValue.trim()) {
      const numericValue = parseFloat(
        data.proposalValue.replace(/[^\d.,]/g, "").replace(",", ".")
      );
      updateData.proposalValue = isNaN(numericValue) ? null : numericValue;
    } else {
      updateData.proposalValue = null;
    }
  }
  if (data.contractLink !== undefined) {
    updateData.contractLink = data.contractLink?.trim() || null;
  }
  if (data.commercialNotes !== undefined) {
    updateData.commercialNotes = data.commercialNotes?.trim() || null;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });

  revalidatePath(`/projects/${projectId}/commercial`);

  return { success: true };
}
