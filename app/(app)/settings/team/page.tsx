import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TeamInviteClient } from "./team-invite-client";

export default async function TeamSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "OWNER") {
    return (
      <Alert>
        <AlertTitle>Acesso restrito</AlertTitle>
        <AlertDescription>
          Apenas o Owner pode gerenciar o time do workspace.
        </AlertDescription>
      </Alert>
    );
  }

  if (!user.workspaceId) {
    return (
      <Alert>
        <AlertTitle>Workspace não configurado</AlertTitle>
        <AlertDescription>
          Seu usuário não está vinculado a um workspace.
        </AlertDescription>
      </Alert>
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
    select: {
      id: true,
      name: true,
      users: {
        select: { id: true, name: true, email: true, role: true, avatar: true },
        orderBy: { createdAt: "asc" },
      },
      invites: {
        where: { usedAt: null },
        select: { id: true, token: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!workspace) {
    return (
      <Alert>
        <AlertTitle>Workspace inválido</AlertTitle>
        <AlertDescription>
          Não foi possível encontrar seu workspace.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Time</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Convide pessoas para o seu workspace e depois atribua elas a projetos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Convites</CardTitle>
          <CardDescription>
            Gere um link único ou direcione por e-mail (sem envio automático por enquanto).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamInviteClient initialInvites={workspace.invites} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros do Workspace</CardTitle>
          <CardDescription>
            Pessoas vinculadas ao seu workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workspace.users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 rounded-md border border-[hsl(var(--border))] p-3"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{u.name}</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                  {u.email}
                </div>
              </div>
              <div className="text-xs text-[hsl(var(--muted-foreground))]">
                {u.role}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-xs text-[hsl(var(--muted-foreground))]">
        Dica: depois de aceitar o convite, você pode adicionar o membro a projetos em{" "}
        <Link className="underline" href="/projects">
          Meus Projetos
        </Link>
        .
      </div>
    </div>
  );
}

