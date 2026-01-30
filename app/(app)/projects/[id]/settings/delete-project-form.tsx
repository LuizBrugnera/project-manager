"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProjectAction } from "./actions";
import { showToast } from "@/lib/toast";

interface DeleteProjectFormProps {
  projectId: string;
  projectName: string;
}

export function DeleteProjectForm({ projectId, projectName }: DeleteProjectFormProps) {
  const router = useRouter();
  const [confirmName, setConfirmName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const nameMatches = confirmName.trim() === projectName;
  const canDelete = nameMatches && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canDelete) return;

    setIsSubmitting(true);
    const result = await deleteProjectAction(projectId, confirmName);

    if (result.success) {
      showToast.success("Projeto excluído", "Redirecionando...");
      router.push("/projects");
      router.refresh();
    } else {
      showToast.error("Erro ao excluir", result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-red-500/20 bg-red-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-400">
          <Trash2 className="h-5 w-5" />
          Excluir projeto
        </CardTitle>
        <CardDescription>
          Esta ação é irreversível. Todas as tarefas, documentos e dados do projeto serão removidos.
          Para confirmar, digite o nome do projeto abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="confirm-name" className="text-sm font-medium text-[hsl(var(--foreground))]">
              Digite o nome do projeto para confirmar
            </label>
            <Input
              id="confirm-name"
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={projectName}
              disabled={isSubmitting}
              className="max-w-sm border-red-500/30 focus-visible:ring-red-500/50"
              autoComplete="off"
            />
            {confirmName.trim() && !nameMatches && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                O nome deve ser exatamente &quot;{projectName}&quot;
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="destructive"
            disabled={!canDelete}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Excluir projeto
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
