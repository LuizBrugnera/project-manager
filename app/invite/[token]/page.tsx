import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InviteAcceptClient } from "./invite-accept-client";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    select: { token: true, email: true, usedAt: true, workspaceId: true },
  });

  if (!invite || invite.usedAt) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Convite inválido</CardTitle>
            <CardDescription>
              Esse link não existe ou já foi utilizado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    const next = `/invite/${token}`;
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Entre para aceitar o convite</CardTitle>
            <CardDescription>
              Faça login ou crie uma conta para entrar no workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href={`/login?next=${encodeURIComponent(next)}`}>Entrar</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/register?next=${encodeURIComponent(next)}`}>Cadastrar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
          <CardDescription>
            Você está prestes a entrar em um workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteAcceptClient token={token} inviteEmail={invite.email} />
        </CardContent>
      </Card>
    </div>
  );
}

