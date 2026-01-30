"use client";

import * as React from "react";
import { UserPlus, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMemberAction } from "./actions";
import { showToast } from "@/lib/toast";

interface AddMemberFormProps {
  projectId: string;
}

export function AddMemberForm({ projectId }: AddMemberFormProps) {
  const [email, setEmail] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setErrorMessage("Email é obrigatório");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    const result = await addMemberAction(projectId, email);

    if (result.success) {
      setStatus("success");
      setEmail("");
      showToast.success("Membro adicionado!", "O usuário agora tem acesso ao projeto.");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } else {
      setStatus("error");
      setErrorMessage(result.error);
      showToast.error("Erro ao adicionar membro", result.error);
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus("idle");
            setErrorMessage(null);
          }}
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : status === "success" ? (
            <Check className="h-4 w-4 mr-1" />
          ) : (
            <UserPlus className="h-4 w-4 mr-1" />
          )}
          {isSubmitting
            ? "Adicionando..."
            : status === "success"
            ? "Adicionado!"
            : "Adicionar"}
        </Button>
      </div>

      {status === "error" && errorMessage && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {errorMessage}
        </div>
      )}

      {status === "success" && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          Membro adicionado com sucesso!
        </div>
      )}

      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        O usuário precisa estar cadastrado na plataforma. Digite o email exato usado no cadastro.
      </p>
    </form>
  );
}
