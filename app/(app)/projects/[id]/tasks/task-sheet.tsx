"use client";

import * as React from "react";
import { Loader2, Trash2, X } from "lucide-react";
import type { Task, TaskStatus, TaskPriority } from "@prisma/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateTaskAction, deleteTaskAction } from "./actions";
import { showToast } from "@/lib/toast";

type TaskWithUser = Task & {
  assignedUser: { id: string; name: string; email: string; avatar?: string | null } | null;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "A Fazer" },
  { value: "IN_PROGRESS", label: "Em Progresso" },
  { value: "TESTING", label: "Testes" },
  { value: "DONE", label: "Concluído" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Baixa", color: "bg-slate-500" },
  { value: "MEDIUM", label: "Média", color: "bg-yellow-500" },
  { value: "HIGH", label: "Alta", color: "bg-orange-500" },
  { value: "URGENT", label: "Urgente", color: "bg-red-500" },
];

interface TaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithUser | null;
  teamMembers: TeamMember[];
  onUpdate: (task: TaskWithUser) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
}

export function TaskSheet({
  open,
  onOpenChange,
  task,
  teamMembers,
  onUpdate,
  onDelete,
  onClose,
}: TaskSheetProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>("BACKLOG");
  const [priority, setPriority] = React.useState<TaskPriority>("MEDIUM");
  const [assignedUserId, setAssignedUserId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Sync state with task prop
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedUserId(task.assignedUserId);
    }
  }, [task]);

  if (!open || !task) return null;

  const hasChanges =
    title !== task.title ||
    description !== (task.description ?? "") ||
    status !== task.status ||
    priority !== task.priority ||
    assignedUserId !== task.assignedUserId;

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);

    const result = await updateTaskAction(task.id, {
      title,
      description: description || null,
      status,
      priority,
      assignedUserId,
    });

    if (result.success) {
      const updatedTask: TaskWithUser = {
        ...task,
        title,
        description: description || null,
        status,
        priority,
        assignedUserId,
        assignedUser: assignedUserId
          ? teamMembers.find((m) => m.id === assignedUserId) ?? null
          : null,
      };
      onUpdate(updatedTask);
      showToast.success("Task atualizada!", "Alterações salvas com sucesso.");
    } else {
      showToast.error("Erro ao atualizar", result.error);
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    if (!confirm("Tem certeza que deseja excluir esta task?")) return;

    setIsDeleting(true);
    const result = await deleteTaskAction(task.id);

    if (result.success) {
      onDelete(task.id);
      showToast.success("Task excluída", `"${task.title}" foi removida.`);
    } else {
      showToast.error("Erro ao excluir", result.error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Fechar"
      />

      {/* Sheet */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg border-l border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-6 py-4">
          <h2 className="text-sm font-semibold">Editar Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tag (tema IA) - somente leitura */}
          {task.tag && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Tema</label>
              <div>
                <span className="text-xs px-2 py-1 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  {task.tag}
                </span>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Título
            </label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da task"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="task-description" className="text-sm font-medium">
              Descrição
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a task em detalhes..."
              rows={4}
              className="w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] resize-y"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    status === opt.value
                      ? "bg-white text-black"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:opacity-80"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prioridade</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    priority === opt.value
                      ? "bg-white text-black"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:opacity-80"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned User */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Responsável</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAssignedUserId(null)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  assignedUserId === null
                    ? "bg-white text-black"
                    : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:opacity-80"
                )}
              >
                Sem responsável
              </button>
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setAssignedUserId(member.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    assignedUserId === member.id
                      ? "bg-white text-black"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:opacity-80"
                  )}
                >
                  {member.name}
                </button>
              ))}
            </div>
          </div>

          {/* Meta info */}
          <div className="pt-4 border-t border-[hsl(var(--border))]">
            <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <span>
                Criado em {new Date(task.createdAt).toLocaleDateString("pt-BR")}
              </span>
              <span>
                Atualizado em {new Date(task.updatedAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="ml-1">Excluir</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
