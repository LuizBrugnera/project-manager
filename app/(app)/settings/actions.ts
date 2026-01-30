"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { destroySession } from "@/lib/auth";

// ========== UPDATE PROFILE ==========
export async function updateProfileAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const avatar = String(formData.get("avatar") || "").trim();

  if (!name) {
    return { success: false as const, error: "Nome é obrigatório" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      avatar: avatar || null,
    },
  });

  revalidatePath("/settings");
  return { success: true as const };
}

// ========== CHANGE PASSWORD ==========
export async function changePasswordAction(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false as const, error: "Preencha todos os campos" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false as const, error: "As senhas não coincidem" };
  }

  if (newPassword.length < 6) {
    return {
      success: false as const,
      error: "A nova senha deve ter pelo menos 6 caracteres",
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado" };
  }

  // Verifica senha atual
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false as const, error: "Senha atual incorreta" };
  }

  // Atualiza senha
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
    },
  });

  return { success: true as const };
}

// ========== LOGOUT ==========
export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
