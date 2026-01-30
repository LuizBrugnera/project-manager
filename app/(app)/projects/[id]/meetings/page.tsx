import { notFound, redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { MeetingsClient } from "./meetings-client";

export default async function ProjectMeetingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(id);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      createdById: true,
      meetings: {
        orderBy: { date: "desc" },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Prepara dados das reuniões com participantes parseados
  const meetingsWithParticipants = project.meetings.map((meeting) => {
    let participantIds: string[] = [];
    try {
      participantIds = meeting.participants ? JSON.parse(meeting.participants) : [];
    } catch {
      participantIds = [];
    }

    // Busca nomes dos participantes
    const participantNames = participantIds.map((userId) => {
      const member = project.members.find((m) => m.userId === userId);
      if (member) return member.user.name;
      if (project.createdById === userId) return project.createdBy.name;
      return "Desconhecido";
    });

    return {
      ...meeting,
      date: meeting.date,
      decisions: meeting.decisions ? JSON.parse(meeting.decisions) : [],
      nextSteps: meeting.nextSteps ? JSON.parse(meeting.nextSteps) : [],
      participants: participantNames,
      participantIds: participantIds,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Reuniões</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Registre e acompanhe as reuniões do projeto, decisões tomadas e próximos passos.
        </p>
      </div>

      <MeetingsClient
        projectId={id}
        initialMeetings={meetingsWithParticipants}
        projectMembers={[
          {
            id: project.createdById,
            name: project.createdBy.name,
            email: project.createdBy.email,
          },
          ...project.members.map((m) => ({
            id: m.userId,
            name: m.user.name,
            email: m.user.email,
          })),
        ]}
      />
    </div>
  );
}
