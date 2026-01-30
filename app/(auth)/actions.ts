"use server";

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

type AuthResult =
  | { success: true }
  | { success: false; error: string };

export async function registerAction(formData: FormData): Promise<AuthResult> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').toLowerCase().trim();
  const password = String(formData.get('password') || '');

  if (!name || !email || !password) {
    return { success: false, error: 'Preencha todos os campos.' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: 'Já existe um usuário com esse e-mail.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Cria o usuário como OWNER e cria automaticamente um workspace (multi-tenant)
  // Usa transação para garantir atomicidade
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'OWNER',
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        ownerId: user.id,
        name: `${name} (Workspace)`,
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { workspaceId: workspace.id },
    });

    return updatedUser;
  });

  await createSession(result);

  return { success: true };
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') || '').toLowerCase().trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { success: false, error: 'Preencha e-mail e senha.' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: 'Credenciais inválidas.' };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: 'Credenciais inválidas.' };
  }

  await createSession(user);

  return { success: true };
}

