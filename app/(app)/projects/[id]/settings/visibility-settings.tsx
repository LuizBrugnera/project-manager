"use client";

import * as React from "react";
import { Eye, Save, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { updatePublicVisibilityAction } from "./visibility-actions";

interface VisibilitySettingsProps {
  projectId: string;
  initialVisibility: {
    showStatus: boolean;
    showTimeline: boolean;
    showTasks: boolean;
    showScope: boolean;
  };
}

export function VisibilitySettings({
  projectId,
  initialVisibility,
}: VisibilitySettingsProps) {
  const [visibility, setVisibility] = React.useState(initialVisibility);
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");

  const hasChanges =
    visibility.showStatus !== initialVisibility.showStatus ||
    visibility.showTimeline !== initialVisibility.showTimeline ||
    visibility.showTasks !== initialVisibility.showTasks ||
    visibility.showScope !== initialVisibility.showScope;

  const handleSave = async () => {
    setIsSaving(true);
    setStatus("saving");

    const result = await updatePublicVisibilityAction(projectId, {
      showStatus: visibility.showStatus,
      showTimeline: visibility.showTimeline,
      showTasks: visibility.showTasks,
      showScope: visibility.showScope,
    });

    if (result.success) {
      setStatus("saved");
      showToast.success(
        "Configurações salvas",
        "As configurações de visibilidade foram atualizadas."
      );
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("idle");
      showToast.error("Erro ao salvar", result.error);
    }

    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Visibilidade do Link Público
        </CardTitle>
        <CardDescription>
          Configure o que o cliente pode ver através do link público compartilhado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="showStatus"
              checked={visibility.showStatus}
              onCheckedChange={(checked) =>
                setVisibility({ ...visibility, showStatus: checked === true })
              }
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="showStatus"
                className="text-sm font-medium cursor-pointer"
              >
                Ver Status Geral
              </Label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Exibe o status do projeto, progresso geral e métricas básicas.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="showTimeline"
              checked={visibility.showTimeline}
              onCheckedChange={(checked) =>
                setVisibility({ ...visibility, showTimeline: checked === true })
              }
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="showTimeline"
                className="text-sm font-medium cursor-pointer"
              >
                Ver Cronograma/Marcos
              </Label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Mostra o cronograma do projeto e marcos (milestones) definidos.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="showTasks"
              checked={visibility.showTasks}
              onCheckedChange={(checked) =>
                setVisibility({ ...visibility, showTasks: checked === true })
              }
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="showTasks"
                className="text-sm font-medium cursor-pointer"
              >
                Ver Progresso das Tasks (Resumido)
              </Label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Exibe uma lista resumida de tarefas em andamento e concluídas.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="showScope"
              checked={visibility.showScope}
              onCheckedChange={(checked) =>
                setVisibility({ ...visibility, showScope: checked === true })
              }
            />
            <div className="space-y-1 leading-none">
              <Label
                htmlFor="showScope"
                className="text-sm font-medium cursor-pointer"
              >
                Ver Escopo
              </Label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Permite visualizar o escopo do projeto definido na aba Definição.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            {status === "saving" && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Salvando...
              </span>
            )}
            {status === "saved" && (
              <span className="text-emerald-400">Configurações salvas!</span>
            )}
            {status === "idle" && hasChanges && (
              <span className="text-amber-400">Alterações não salvas</span>
            )}
          </div>

          <Button onClick={handleSave} disabled={isSaving || !hasChanges} size="sm">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
