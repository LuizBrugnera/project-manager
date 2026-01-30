"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { MoreVertical } from "lucide-react";
import type { Task, TaskStatus } from "@prisma/client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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

interface TasksListViewProps {
  projectId: string;
  tasks: TaskWithUser[];
  teamMembers: TeamMember[];
  onTaskClick: (task: TaskWithUser) => void;
  onTaskUpdate: (task: TaskWithUser) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "A Fazer",
  IN_PROGRESS: "Em Progresso",
  TESTING: "Testes",
  DONE: "Concluído",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: "bg-slate-500",
  TODO: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500",
  TESTING: "bg-purple-500",
  DONE: "bg-emerald-500",
};

function priorityConfig(priority: string) {
  switch (priority) {
    case "URGENT":
      return { label: "Urgente", color: "bg-red-500", textColor: "text-red-400" };
    case "HIGH":
      return { label: "Alta", color: "bg-red-500", textColor: "text-red-400" };
    case "MEDIUM":
      return { label: "Média", color: "bg-yellow-500", textColor: "text-yellow-400" };
    case "LOW":
      return { label: "Baixa", color: "bg-blue-500", textColor: "text-blue-400" };
    default:
      return { label: priority, color: "bg-slate-500", textColor: "text-slate-400" };
  }
}

export function TasksListView({
  projectId,
  tasks,
  teamMembers,
  onTaskClick,
  onTaskUpdate,
}: TasksListViewProps) {
  const handleQuickAssign = async (taskId: string, userId: string | null) => {
    const result = await updateTaskAction(taskId, {
      assignedUserId: userId,
    });

    if (result.success) {
      const updatedTask = tasks.find((t) => t.id === taskId);
      if (updatedTask) {
        const updated: TaskWithUser = {
          ...updatedTask,
          assignedUserId: userId,
          assignedUser: userId
            ? teamMembers.find((m) => m.id === userId) ?? null
            : null,
        };
        onTaskUpdate(updated);
        showToast.success("Atribuição atualizada", "Responsável alterado com sucesso.");
      }
    } else {
      showToast.error("Erro", result.error);
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const result = await updateTaskAction(taskId, {
      status: newStatus,
    });

    if (result.success) {
      const updatedTask = tasks.find((t) => t.id === taskId);
      if (updatedTask) {
        const updated: TaskWithUser = {
          ...updatedTask,
          status: newStatus,
        };
        onTaskUpdate(updated);
        showToast.success("Status atualizado", "Status da tarefa alterado.");
      }
    } else {
      showToast.error("Erro", result.error);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[hsl(var(--muted-foreground))]">
        Nenhuma tarefa encontrada.
      </div>
    );
  }

  return (
    <>
      {/* Desktop: Tabela */}
      <div className="hidden md:block border border-[hsl(var(--border))] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Status</TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead className="w-[130px]">Tema</TableHead>
              <TableHead className="w-[120px]">Prioridade</TableHead>
              <TableHead className="w-[150px]">Responsável</TableHead>
              <TableHead className="w-[120px]">Criado em</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const priority = priorityConfig(task.priority);
              const statusColor = STATUS_COLORS[task.status];

              return (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-[hsl(var(--muted))]/30"
                  onClick={() => onTaskClick(task)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", statusColor)} />
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {STATUS_LABELS[task.status]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1 mt-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.tag ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                        {task.tag}
                      </span>
                    ) : (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="neutral"
                      className={cn("text-xs", priority.textColor)}
                    >
                      <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", priority.color)} />
                      {priority.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignedUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={task.assignedUser.name}
                          src={task.assignedUser.avatar}
                          size="sm"
                        />
                        <span className="text-sm">{task.assignedUser.name.split(" ")[0]}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        Sem responsável
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {format(new Date(task.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onTaskClick(task)}>
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            const newStatus: TaskStatus =
                              task.status === "DONE" ? "TODO" : "DONE";
                            handleQuickStatusChange(task.id, newStatus);
                          }}
                        >
                          {task.status === "DONE" ? "Marcar como pendente" : "Marcar como concluída"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">
                          Atribuir para:
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAssign(task.id, null);
                          }}
                        >
                          <span className="text-xs">Sem responsável</span>
                        </DropdownMenuItem>
                        {teamMembers.map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAssign(task.id, member.id);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar name={member.name} src={member.avatar} size="sm" />
                              <span className="text-xs">{member.name}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {tasks.map((task) => {
          const priority = priorityConfig(task.priority);
          const statusColor = STATUS_COLORS[task.status];

          return (
            <div
              key={task.id}
              className="border border-[hsl(var(--border))] rounded-lg p-4 space-y-3 cursor-pointer hover:bg-[hsl(var(--muted))]/30 transition-colors"
              onClick={() => onTaskClick(task)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                      {task.description}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onTaskClick(task)}>
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus: TaskStatus =
                          task.status === "DONE" ? "TODO" : "DONE";
                        handleQuickStatusChange(task.id, newStatus);
                      }}
                    >
                      {task.status === "DONE" ? "Marcar como pendente" : "Marcar como concluída"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">
                      Atribuir para:
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAssign(task.id, null);
                      }}
                    >
                      <span className="text-xs">Sem responsável</span>
                    </DropdownMenuItem>
                    {teamMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAssign(task.id, member.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={member.name} src={member.avatar} size="sm" />
                          <span className="text-xs">{member.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {task.tag && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    {task.tag}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", statusColor)} />
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
                <Badge
                  variant="neutral"
                  className={cn("text-xs", priority.textColor)}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", priority.color)} />
                  {priority.label}
                </Badge>
                {task.assignedUser && (
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      name={task.assignedUser.name}
                      src={task.assignedUser.avatar}
                      size="sm"
                    />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {task.assignedUser.name.split(" ")[0]}
                    </span>
                  </div>
                )}
                <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                  {format(new Date(task.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
