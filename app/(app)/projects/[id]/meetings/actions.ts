"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";

type MeetingResult =
  | { success: true; meeting?: any }
  | { success: false; error: string };

export async function createMeetingAction(
  projectId: string,
  date: string,
  summary: string,
  decisions: string[],
  nextSteps: string[]
): Promise<MeetingResult> {
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

  if (!summary.trim()) {
    return { success: false, error: "Resumo é obrigatório." };
  }

  const meeting = await prisma.meeting.create({
    data: {
      date: new Date(date),
      summary: summary.trim(),
      decisions: decisions.length > 0 ? JSON.stringify(decisions) : null,
      nextSteps: nextSteps.length > 0 ? JSON.stringify(nextSteps) : null,
      participants: JSON.stringify([user.id]), // Inclui o criador
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}/meetings`);

  return { success: true, meeting };
}

export async function updateMeetingAction(
  meetingId: string,
  projectId: string,
  data: {
    date?: string;
    summary?: string;
    decisions?: string[];
    nextSteps?: string[];
    participants?: string[];
  }
): Promise<MeetingResult> {
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
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.summary !== undefined) updateData.summary = data.summary.trim();
  if (data.decisions !== undefined) {
    updateData.decisions = data.decisions.length > 0 ? JSON.stringify(data.decisions) : null;
  }
  if (data.nextSteps !== undefined) {
    updateData.nextSteps = data.nextSteps.length > 0 ? JSON.stringify(data.nextSteps) : null;
  }
  if (data.participants !== undefined) {
    updateData.participants = data.participants.length > 0 ? JSON.stringify(data.participants) : null;
  }

  const meeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: updateData,
  });

  revalidatePath(`/projects/${projectId}/meetings`);

  return { success: true, meeting };
}

export async function deleteMeetingAction(
  meetingId: string,
  projectId: string
): Promise<MeetingResult> {
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

  await prisma.meeting.delete({
    where: { id: meetingId },
  });

  revalidatePath(`/projects/${projectId}/meetings`);

  return { success: true };
}
