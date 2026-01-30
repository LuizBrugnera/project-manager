"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import type { Task, TaskStatus } from "@prisma/client";

import { createTaskAction } from "./actions";
import { showToast } from "@/lib/toast";

type TaskWithUser = Task & {
  assignedUser: { id: string; name: string; email: string } | null;
};

interface QuickAddTaskProps {
  projectId: string;
  status: TaskStatus;
  onCreated: (task: TaskWithUser) => void;
  onCancel: () => void;
}

export function QuickAddTask({
  projectId,
  status,
  onCreated,
  onCancel,
}: QuickAddTaskProps) {
  const [title, setTitle] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus no input
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim() || isLoading) return;

    setIsLoading(true);

    const result = await createTaskAction(projectId, title, status);

    if (result.success && result.task) {
      // Adiciona assignedUser como null para manter o tipo correto
      onCreated({ ...result.task, assignedUser: null });
      setTitle("");
      showToast.success("Task criada!", `"${title.trim()}" adicionada ao ${status === "BACKLOG" ? "Backlog" : status === "TODO" ? "A Fazer" : status}`);
      // Mantém o input focado para adicionar mais
      inputRef.current?.focus();
    } else if (result.success === false) {
      showToast.error("Erro ao criar task", result.error);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Título da task..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
          disabled={isLoading}
        />
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" />
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="p-0.5 rounded hover:bg-[hsl(var(--muted))] transition-colors"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </form>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
        Enter para criar • Esc para cancelar
      </p>
    </div>
  );
}
