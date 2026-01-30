"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Result = { success: true; token: string } | { success: false; error: string };

export async function generateInviteAction(email?: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Você precisa estar logado." };
  if (user.role !== "OWNER") {
    return { success: false, error: "Apenas o Owner pode gerar convites." };
  }
  if (!user.workspaceId) {
    return { success: false, error: "Seu usuário não está vinculado a um workspace." };
  }

  // Garante que o workspace realmente pertence ao usuário (owner)
  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
    select: { ownerId: true },
  });
  if (!workspace || workspace.ownerId !== user.id) {
    return { success: false, error: "Workspace inválido." };
  }

  const token = randomUUID();

  await prisma.workspaceInvite.create({
    data: {
      token,
      email: email?.trim().toLowerCase() || null,
      workspaceId: user.workspaceId,
    },
  });

  return { success: true, token };
}

