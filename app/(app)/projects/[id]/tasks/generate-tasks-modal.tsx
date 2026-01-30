"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Check,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { TASK_GENERATION_THEME_OPTIONS } from "./task-generation-themes";
import {
  generateTasksPreviewAction,
  regenerateSingleTaskPreviewAction,
  createTasksFromPreviewAction,
} from "./actions";
import type { Task } from "@prisma/client";

type TaskWithUser = Task & {
  assignedUser: { id: string; name: string; email: string } | null;
};

type PreviewItem = {
  id: string;
  title: string;
  description: string | null;
  disposition: "keep" | "discard";
  regenerating?: boolean;
};

type Step = "config" | "generating" | "results";

const THEME_OPTIONS = [
  ...TASK_GENERATION_THEME_OPTIONS,
  { value: "custom", label: "Customizado" },
];

interface GenerateTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: (tasks: TaskWithUser[]) => void;
}

export function GenerateTasksModal({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: GenerateTasksModalProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("config");
  const [optionalText, setOptionalText] = React.useState("");
  const [theme, setTheme] = React.useState(THEME_OPTIONS[0].value);
  const [customTheme, setCustomTheme] = React.useState("");
  const [preview, setPreview] = React.useState<PreviewItem[]>([]);
  const [tag, setTag] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const themeLabel = theme === "custom" ? customTheme.trim() || "Custom" : theme;
  const kept = preview.filter((p) => p.disposition === "keep");
  const keptCount = kept.length;

  const reset = React.useCallback(() => {
    setStep("config");
    setOptionalText("");
    setTheme(THEME_OPTIONS[0].value);
    setCustomTheme("");
    setPreview([]);
    setTag("");
    setError(null);
    setExpandedId(null);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next && step === "generating") return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleGenerate = async () => {
    if (theme === "custom" && !customTheme.trim()) {
      setError("Informe o nome do tema customizado.");
      return;
    }
    setError(null);
    setStep("generating");
    setIsSubmitting(true);

    const res = await generateTasksPreviewAction(
      projectId,
      theme,
      theme === "custom" ? customTheme.trim() : null,
      optionalText.trim() || null
    );

    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error);
      setStep("config");
      showToast.error("Erro ao gerar", res.error);
      return;
    }

    setTag(res.tag);
    setPreview(
      res.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        disposition: "keep" as const,
      }))
    );
    setStep("results");
  };

  const setDisposition = (id: string, disposition: "keep" | "discard") => {
    setPreview((prev) =>
      prev.map((p) => (p.id === id ? { ...p, disposition } : p))
    );
  };

  const handleRegenerate = async (item: PreviewItem) => {
    setPreview((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, regenerating: true } : p
      )
    );
    setError(null);

    const res = await regenerateSingleTaskPreviewAction(
      projectId,
      theme,
      theme === "custom" ? customTheme.trim() : null,
      optionalText.trim() || null,
      item.title,
      item.description
    );

    setPreview((prev) =>
      prev.map((p) => {
        if (p.id !== item.id) return p;
        if (!res.success) return { ...p, regenerating: false };
        return {
          ...p,
          title: res.task.title,
          description: res.task.description,
          disposition: "keep" as const,
          regenerating: false,
        };
      })
    );

    if (!res.success) {
      showToast.error("Erro ao regenerar", res.error);
    }
  };

  const handleConfirm = async () => {
    if (keptCount === 0) {
      showToast.warning("Nenhuma task selecionada", "Marque ao menos uma para manter.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const res = await createTasksFromPreviewAction(
      projectId,
      tag,
      kept.map((p) => ({ title: p.title, description: p.description }))
    );

    setIsSubmitting(false);
    if (!res.success) {
      setError(res.error);
      showToast.error("Erro ao criar tasks", res.error);
      return;
    }

    const tasksWithUser: TaskWithUser[] = res.tasks.map((t) => ({
      ...t,
      assignedUser: null,
    }));
    onSuccess?.(tasksWithUser);
    router.refresh();
    showToast.success(
      "Tasks adicionadas!",
      `${res.count} task(s) criada(s) no Backlog (${tag}).`
    );
    handleOpenChange(false);
  };

  const handleNewGeneration = () => {
    setPreview([]);
    setTag("");
    setError(null);
    setExpandedId(null);
    setStep("config");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-2xl"
        onPointerDownOutside={(e) => {
          if (step === "generating") e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gerar Tasks com IA (por fases)
          </DialogTitle>
          <DialogDescription>
            {step === "config" &&
              "Customize o tema e instruções opcionais. As tasks serão geradas em preview para você escolher o que manter."}
            {step === "generating" && "Gerando tasks com base no contexto do projeto…"}
            {step === "results" &&
              `Tema: ${tag}. Marque manter ou descartar; você pode regenerar uma task específica.`}
          </DialogDescription>
        </DialogHeader>

        {step === "config" && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tema</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      theme === opt.value
                        ? "bg-white text-black"
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:opacity-80"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {theme === "custom" && (
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="Ex: DevOps, QA, Acessibilidade"
                  className="mt-2 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Instruções ou contexto adicional (opcional)</Label>
              <Textarea
                value={optionalText}
                onChange={(e) => setOptionalText(e.target.value)}
                placeholder="Ex: priorizar testes E2E, usar React Query no frontend..."
                rows={3}
                className="resize-y"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--muted-foreground))]" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Gerando tasks para o tema &quot;{themeLabel}&quot;…
            </p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">
                {keptCount} de {preview.length} selecionadas para adicionar
              </span>
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {preview.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    item.disposition === "discard"
                      ? "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 opacity-60"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId((x) => (x === item.id ? null : item.id))
                        }
                        className="text-left font-medium text-sm w-full flex items-center gap-1"
                      >
                        {expandedId === item.id ? (
                          <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        )}
                        {item.title}
                      </button>
                      {expandedId === item.id && item.description && (
                        <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] pl-5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={item.regenerating}
                        onClick={() => handleRegenerate(item)}
                        title="Regenerar"
                      >
                        {item.regenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          item.disposition === "keep" && "text-emerald-500"
                        )}
                        onClick={() =>
                          setDisposition(
                            item.id,
                            item.disposition === "keep" ? "discard" : "keep"
                          )
                        }
                        title={item.disposition === "keep" ? "Clique para descartar" : "Clique para manter"}
                      >
                        {item.disposition === "keep" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-5">
                    <span
                      className={cn(
                        "text-xs",
                        item.disposition === "keep"
                          ? "text-emerald-500"
                          : "text-[hsl(var(--muted-foreground))]"
                      )}
                    >
                      {item.disposition === "keep" ? "Manter" : "Descartar"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "config" && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Gerando…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Gerar
                  </>
                )}
              </Button>
            </>
          )}
          {step === "generating" && null}
          {step === "results" && (
            <>
              <Button variant="outline" onClick={handleNewGeneration}>
                Nova geração
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting || keptCount === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  <>Adicionar {keptCount} ao projeto</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
