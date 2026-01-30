"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import type { Task, TaskStatus } from "@prisma/client";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { KanbanColumn } from "./kanban-column";
import { TaskSheet } from "./task-sheet";
import { GenerateTasksModal } from "./generate-tasks-modal";
import { QuickAddTask } from "./quick-add-task";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
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

const COLUMNS: { status: TaskStatus; title: string; color: string }[] = [
  { status: "BACKLOG", title: "Backlog", color: "text-slate-400" },
  { status: "TODO", title: "A Fazer", color: "text-blue-400" },
  { status: "IN_PROGRESS", title: "Em Progresso", color: "text-amber-400" },
  { status: "TESTING", title: "Testes", color: "text-purple-400" },
  { status: "DONE", title: "Concluído", color: "text-emerald-400" },
];

interface KanbanBoardProps {
  projectId: string;
  initialTasks: TaskWithUser[];
  teamMembers: TeamMember[];
}

export function KanbanBoard({
  projectId,
  initialTasks,
  teamMembers,
}: KanbanBoardProps) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [selectedTask, setSelectedTask] = React.useState<TaskWithUser | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [generateModalOpen, setGenerateModalOpen] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  // Atualiza tasks quando initialTasks mudar (após revalidação)
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleTaskClick = (task: TaskWithUser) => {
    setSelectedTask(task);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedTask(null);
  };

  const handleTaskUpdate = (updatedTask: TaskWithUser) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    handleSheetClose();
  };

  const handleTaskCreate = (newTask: TaskWithUser) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);
    const validStatuses = COLUMNS.map((c) => c.status);
    const newStatus: TaskStatus | null = validStatuses.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : (tasks.find((t) => t.id === overId)?.status ?? null);
    if (!newStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    const result = await updateTaskAction(taskId, { status: newStatus });
    if (result.success) {
      showToast.success("Status atualizado", "Task movida com sucesso.");
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      showToast.error("Erro", result.error);
    }
  };

  const totalTasks = tasks.length;

  return (
    <>
      {/* Empty State - Quando não há tasks */}
      {totalTasks === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16">
            {showCreateForm ? (
              <div className="max-w-md mx-auto">
                <p className="text-sm font-medium mb-3 text-center text-[hsl(var(--muted-foreground))]">
                  Criar primeira task no Backlog
                </p>
                <QuickAddTask
                  projectId={projectId}
                  status="BACKLOG"
                  onCreated={(task) => {
                    handleTaskCreate(task);
                    setShowCreateForm(false);
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            ) : (
              <EmptyState
                icon={<Sparkles className="h-16 w-16" />}
                title="Nenhuma task ainda"
                description="Gere tasks com IA a partir do escopo do projeto ou crie sua primeira task manualmente."
                actions={[
                  {
                    label: "Gerar com IA",
                    onClick: () => setGenerateModalOpen(true),
                    variant: "default",
                  },
                  {
                    label: "Criar manualmente",
                    onClick: () => setShowCreateForm(true),
                    variant: "outline",
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        /* Kanban Grid com drag-and-drop */
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[500px]">
            {COLUMNS.map((column) => {
              const columnTasks = tasks
                .filter((t) => t.status === column.status)
                .sort((a, b) => a.listOrder - b.listOrder);

              return (
                <KanbanColumn
                  key={column.status}
                  projectId={projectId}
                  status={column.status}
                  title={column.title}
                  color={column.color}
                  tasks={columnTasks}
                  teamMembers={teamMembers}
                  onTaskClick={handleTaskClick}
                  onTaskCreate={handleTaskCreate}
                  onTaskUpdate={handleTaskUpdate}
                />
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Modal Gerar Tasks com IA (usado no empty state) */}
      <GenerateTasksModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        projectId={projectId}
        onSuccess={(newTasks) => {
          setTasks((prev) => [...prev, ...newTasks]);
          setGenerateModalOpen(false);
        }}
      />

      {/* Task Detail Sheet */}
      <TaskSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={selectedTask}
        teamMembers={teamMembers}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        onClose={handleSheetClose}
      />
    </>
  );
}
