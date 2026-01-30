"use client";

import * as React from "react";
import { Plus, ListTodo } from "lucide-react";
import type { Task, TaskStatus } from "@prisma/client";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import { QuickAddTask } from "./quick-add-task";

type TaskWithUser = Task & {
  assignedUser: { id: string; name: string; email: string; avatar?: string | null } | null;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

interface KanbanColumnProps {
  projectId: string;
  status: TaskStatus;
  title: string;
  color: string;
  tasks: TaskWithUser[];
  teamMembers: TeamMember[];
  onTaskClick: (task: TaskWithUser) => void;
  onTaskCreate: (task: TaskWithUser) => void;
  onTaskUpdate?: (task: TaskWithUser) => void;
}

function DraggableTaskCard({
  task,
  teamMembers,
  onTaskClick,
  onTaskUpdate,
}: {
  task: TaskWithUser;
  teamMembers: TeamMember[];
  onTaskClick: (task: TaskWithUser) => void;
  onTaskUpdate?: (task: TaskWithUser) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(isDragging && "opacity-50")}
    >
      <TaskCard
        task={task}
        teamMembers={teamMembers}
        onClick={() => onTaskClick(task)}
        onTaskUpdate={onTaskUpdate}
      />
    </div>
  );
}

export function KanbanColumn({
  projectId,
  status,
  title,
  color,
  tasks,
  teamMembers,
  onTaskClick,
  onTaskCreate,
  onTaskUpdate,
}: KanbanColumnProps) {
  const [isAdding, setIsAdding] = React.useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col rounded-lg bg-[hsl(var(--muted))]/30 p-2">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <div className="flex items-center gap-2">
          <h3 className={cn("text-sm font-medium", color)}>{title}</h3>
          <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded hover:bg-[hsl(var(--muted))] transition-colors"
          aria-label="Adicionar task"
        >
          <Plus className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>

      {/* Tasks List (droppable) */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 min-h-[100px] overflow-y-auto transition-colors rounded-md",
          isOver && "bg-[hsl(var(--primary))]/10 ring-1 ring-[hsl(var(--primary))]/30"
        )}
        data-status={status}
      >
        {/* Quick Add Input */}
        {isAdding && (
          <QuickAddTask
            projectId={projectId}
            status={status}
            onCreated={(task) => {
              onTaskCreate(task);
              setIsAdding(false);
            }}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {/* Task Cards (draggable) */}
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            teamMembers={teamMembers}
            onTaskClick={onTaskClick}
            onTaskUpdate={onTaskUpdate}
          />
        ))}

        {/* Empty State */}
        {tasks.length === 0 && !isAdding && (
          <div
            className="border border-dashed border-[hsl(var(--border))] rounded-lg p-6 text-center cursor-pointer hover:border-[hsl(var(--muted-foreground))] transition-colors"
            onClick={() => setIsAdding(true)}
          >
            <ListTodo className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--muted-foreground))] opacity-50" />
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium mb-1">
              Nenhuma task aqui
            </p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Clique para adicionar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
