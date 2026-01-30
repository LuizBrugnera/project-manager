import { notFound, redirect } from "next/navigation";
import { Users, UserPlus, Shield, User } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembersList } from "./members-list";
import { AddMemberForm } from "./add-member-form";
import { VisibilitySettings } from "./visibility-settings";
import { ProjectTypeSettings } from "./project-type-settings";
import { DeleteProjectForm } from "./delete-project-form";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verifica acesso e permissões
  const { hasAccess, isOwner } = await hasProjectAccess(id);

  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Busca projeto com membros e configurações de visibilidade
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      publicViewShowStatus: true,
      publicViewShowTimeline: true,
      publicViewShowTasks: true,
      publicViewShowScope: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configurações do Projeto
        </h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Gerencie membros e permissões do projeto
        </p>
      </div>

      {/* Info Card: membros não podem adicionar membros nem excluir o projeto */}
      {!isOwner && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">
                  Você é membro deste projeto
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Suas permissões são iguais às do dono, exceto: apenas o dono pode adicionar novos membros e excluir o projeto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do Projeto
          </CardTitle>
          <CardDescription>
            Pessoas com acesso a este projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList
            projectId={id}
            owner={project.createdBy}
            members={project.members.map((m) => m.user)}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>

      {/* Adicionar Membro — apenas dono */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Adicionar Membro
            </CardTitle>
            <CardDescription>
              Adicione um membro ao projeto pelo email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddMemberForm projectId={id} />
          </CardContent>
        </Card>
      )}

      {/* Tipo do Projeto — dono e membros */}
      <ProjectTypeSettings projectId={id} initialType={project.type} />

      {/* Configurações de Visibilidade — dono e membros */}
      <VisibilitySettings
        projectId={id}
        initialVisibility={{
          showStatus: project.publicViewShowStatus,
          showTimeline: project.publicViewShowTimeline,
          showTasks: project.publicViewShowTasks,
          showScope: project.publicViewShowScope,
        }}
      />

      {/* Excluir projeto — apenas dono */}
      {isOwner && (
        <DeleteProjectForm projectId={id} projectName={project.name} />
      )}
    </div>
  );
}
