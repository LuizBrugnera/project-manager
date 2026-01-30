import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Você precisa estar logado." },
      { status: 401 }
    );
  }

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    select: {
      token: true,
      email: true,
      usedAt: true,
      workspaceId: true,
      workspace: { select: { ownerId: true } },
    },
  });

  if (!invite || invite.usedAt) {
    return NextResponse.json(
      { success: false, error: "Convite inválido ou já utilizado." },
      { status: 400 }
    );
  }

  // Se convite direcionado, valida e-mail
  if (invite.email && invite.email !== user.email) {
    return NextResponse.json(
      { success: false, error: "Este convite é destinado a outro e-mail." },
      { status: 403 }
    );
  }

  // Owner não deve “aceitar” convite para o próprio workspace
  if (invite.workspace.ownerId === user.id) {
    return NextResponse.json(
      { success: false, error: "Você já é o Owner deste workspace." },
      { status: 400 }
    );
  }

  // Vincula o usuário ao workspace (se ainda não estiver)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      workspaceId: invite.workspaceId,
      role: "MEMBER",
    },
  });

  // Marca convite como utilizado
  await prisma.workspaceInvite.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

