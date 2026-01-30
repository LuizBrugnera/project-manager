import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Lock, LogOut, Users } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { LogoutButton } from "./logout-button";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Gerencie seu perfil e preferências
        </p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialName={user.name}
            initialAvatar={user.avatar}
            initialEmail={user.email}
          />
        </CardContent>
      </Card>

      {/* Time (apenas para Owners) */}
      {user.role === "OWNER" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Time do Workspace
            </CardTitle>
            <CardDescription>
              Convide pessoas para o seu workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings/team">Gerenciar Time</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Altere sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-400" />
            Sair da Conta
          </CardTitle>
          <CardDescription>
            Encerre sua sessão atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
