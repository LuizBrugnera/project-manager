"use client";

import * as React from "react";
import { Lock, Loader2, Check, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAction } from "./actions";
import { showToast } from "@/lib/toast";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    const result = await changePasswordAction(formData);

    if (result.success) {
      setStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast.success("Senha alterada!", "Sua senha foi atualizada com sucesso.");
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } else {
      setStatus("error");
      setErrorMessage(result.error);
      showToast.error("Erro ao alterar senha", result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Senha Atual */}
      <div className="space-y-2">
        <label htmlFor="currentPassword" className="text-sm font-medium">
          Senha Atual
        </label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setStatus("idle");
              setErrorMessage(null);
            }}
            placeholder="Digite sua senha atual"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Nova Senha */}
      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-sm font-medium">
          Nova Senha
        </label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setStatus("idle");
              setErrorMessage(null);
            }}
            placeholder="Mínimo de 6 caracteres"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          A senha deve ter pelo menos 6 caracteres
        </p>
      </div>

      {/* Confirmar Nova Senha */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar Nova Senha
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setStatus("idle");
              setErrorMessage(null);
            }}
            placeholder="Digite a nova senha novamente"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-xs text-red-400">As senhas não coincidem</p>
        )}
      </div>

      {/* Status Messages */}
      {status === "error" && errorMessage && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {errorMessage}
        </div>
      )}

      {status === "success" && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          Senha alterada com sucesso!
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword ||
            newPassword !== confirmPassword ||
            newPassword.length < 6
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Alterando...
            </>
          ) : status === "success" ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Alterada!
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-1" />
              Alterar Senha
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
