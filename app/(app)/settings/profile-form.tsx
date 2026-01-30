"use client";

import * as React from "react";
import { User, Loader2, Check, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "./actions";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  initialName: string;
  initialAvatar: string | null;
  initialEmail: string;
}

export function ProfileForm({
  initialName,
  initialAvatar,
  initialEmail,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initialName);
  const [avatar, setAvatar] = React.useState(initialAvatar || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const hasChanges = name !== initialName || avatar !== (initialAvatar || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setStatus("error");
      setErrorMessage("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("avatar", avatar.trim());

    const result = await updateProfileAction(formData);

    if (result.success) {
      setStatus("success");
      showToast.success("Perfil atualizado!", "Suas informações foram salvas.");
      router.refresh();
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } else {
      setStatus("error");
      setErrorMessage(result.error);
      showToast.error("Erro ao atualizar", result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Preview */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover border-2 border-[hsl(var(--border))]"
              onError={(e) => {
                // Fallback para ícone se imagem falhar
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center border-2 border-[hsl(var(--border))]">
              <User className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Foto de Perfil</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Cole a URL de uma imagem ou deixe em branco para usar o ícone padrão
          </p>
        </div>
      </div>

      {/* Email (readonly) */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          value={initialEmail}
          disabled
          className="bg-[hsl(var(--muted))]/30"
        />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          O e-mail não pode ser alterado
        </p>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nome
        </label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
            setErrorMessage(null);
          }}
          placeholder="Seu nome completo"
          required
        />
      </div>

      {/* Avatar URL */}
      <div className="space-y-2">
        <label htmlFor="avatar" className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          URL do Avatar
        </label>
        <Input
          id="avatar"
          type="url"
          value={avatar}
          onChange={(e) => {
            setAvatar(e.target.value);
            setStatus("idle");
            setErrorMessage(null);
          }}
          placeholder="https://exemplo.com/avatar.jpg"
        />
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Cole o link de uma imagem para usar como avatar
        </p>
      </div>

      {/* Status Messages */}
      {status === "error" && errorMessage && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {errorMessage}
        </div>
      )}

      {status === "success" && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          Perfil atualizado com sucesso!
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="submit"
          disabled={!hasChanges || isSubmitting}
          variant={hasChanges ? "default" : "outline"}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Salvando...
            </>
          ) : status === "success" ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Salvo!
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>
    </form>
  );
}
