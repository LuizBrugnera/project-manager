"use client";

import * as React from "react";
import { Layout, Save, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { updateProjectTypeAction } from "./actions";
import type { ProjectType } from "@prisma/client";

const OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "WEB", label: "Web" },
  { value: "MOBILE", label: "App" },
  { value: "FULLSTACK", label: "Web & App" },
];

interface ProjectTypeSettingsProps {
  projectId: string;
  initialType: ProjectType;
}

export function ProjectTypeSettings({
  projectId,
  initialType,
}: ProjectTypeSettingsProps) {
  const [type, setType] = React.useState<ProjectType>(initialType);
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");

  const hasChanges = type !== initialType;

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;
    setIsSaving(true);
    setStatus("saving");

    const result = await updateProjectTypeAction(projectId, type);

    if (result.success) {
      setStatus("saved");
      showToast.success("Tipo atualizado", "O tipo do projeto foi alterado.");
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
          <Layout className="h-5 w-5" />
          Tipo do Projeto
        </CardTitle>
        <CardDescription>
          Selecione se o projeto é Web, App ou ambos (Web & App).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                type === opt.value
                  ? "bg-white text-black"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:opacity-80"
              )}
            >
              {opt.label}
            </button>
          ))}
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
              <span className="text-emerald-400">Tipo atualizado!</span>
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
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
