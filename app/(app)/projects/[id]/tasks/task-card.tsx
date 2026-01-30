"use client";

import * as React from "react";
import type { Task } from "@prisma/client";
import { User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTaskAction } from "./actions";
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

function priorityConfig(priority: string) {
  switch (priority) {
    case "URGENT":
      return { label: "Urgente", variant: "warning" as const, dot: "bg-red-500", textColor: "text-red-400" };
    case "HIGH":
      return { label: "Alta", variant: "warning" as const, dot: "bg-red-500", textColor: "text-red-400" };
    case "MEDIUM":
      return { label: "Média", variant: "neutral" as const, dot: "bg-yellow-500", textColor: "text-yellow-400" };
    case "LOW":
      return { label: "Baixa", variant: "neutral" as const, dot: "bg-blue-500", textColor: "text-blue-400" };
    default:
      return { label: priority, variant: "neutral" as const, dot: "bg-slate-500", textColor: "text-slate-400" };
  }
}

interface TaskCardProps {
  task: TaskWithUser;
  onClick: () => void;
  teamMembers: TeamMember[];
  onTaskUpdate?: (task: TaskWithUser) => void;
}

export function TaskCard({ task, onClick, teamMembers, onTaskUpdate }: TaskCardProps) {
  const priority = priorityConfig(task.priority);

  const handleAssignChange = async (userId: string | null) => {
    const result = await updateTaskAction(task.id, {
      assignedUserId: userId,
    });

    if (result.success && onTaskUpdate) {
      const updated: TaskWithUser = {
        ...task,
        assignedUserId: userId,
        assignedUser: userId
          ? teamMembers.find((m) => m.id === userId) ?? null
          : null,
      };
      onTaskUpdate(updated);
      showToast.success("Atribuição atualizada", "Responsável alterado com sucesso.");
    } else if (!result.success) {
      showToast.error("Erro", result.error);
    }
  };

  return (
    <div
      className={cn(
        "group rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3",
        "hover:border-white/20 hover:shadow-sm transition-all"
      )}
    >
      {/* Priority Indicator */}
      <div className="flex items-start gap-2 mb-2">
        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", priority.dot)} />
        <h4
          className="text-sm font-medium leading-tight flex-1 cursor-pointer"
          onClick={onClick}
        >
          {task.title}
        </h4>
      </div>

      {/* Description Preview */}
      {task.description && (
        <p
          className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mb-2 ml-4 cursor-pointer"
          onClick={onClick}
        >
          {task.description}
        </p>
      )}

      {/* Tag (fase IA) */}
      {task.tag && (
        <div className="ml-4 mb-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
            {task.tag}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 ml-4">
        <Badge
          variant={priority.variant}
          className={cn("text-[10px] px-1.5 py-0", priority.textColor)}
        >
          <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", priority.dot)} />
          {priority.label}
        </Badge>

        {/* Avatar/Select de Atribuição */}
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.assignedUserId || "none"}
            onValueChange={(value) => handleAssignChange(value === "none" ? null : value)}
          >
            <SelectTrigger className="h-7 w-auto px-1.5 border-none bg-transparent hover:bg-[hsl(var(--muted))]/50">
              <SelectValue>
                {task.assignedUser ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      name={task.assignedUser.name}
                      src={task.assignedUser.avatar}
                      size="sm"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full border border-dashed border-[hsl(var(--muted-foreground))]/30 flex items-center justify-center">
                      <User className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                    </div>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Sem responsável</span>
                </div>
              </SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <Avatar name={member.name} src={member.avatar} size="sm" />
                    <span>{member.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
