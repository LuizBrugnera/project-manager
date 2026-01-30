"use client";

import * as React from "react";
import { LayoutGrid, List, Filter } from "lucide-react";
import type { Task } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { KanbanBoard } from "./kanban-board";
import { TasksListView } from "./tasks-list-view";
import { GenerateTasksButton } from "./generate-tasks-button";
import { TaskSheet } from "./task-sheet";

type TaskWithUser = Task & {
  assignedUser: { id: string; name: string; email: string; avatar?: string | null } | null;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

interface TasksPageClientProps {
  projectId: string;
  initialTasks: TaskWithUser[];
  teamMembers: TeamMember[];
  currentUserId: string | null;
}

type ViewMode = "kanban" | "list";

export function TasksPageClient({
  projectId,
  initialTasks,
  teamMembers,
  currentUserId,
}: TasksPageClientProps) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [viewMode, setViewMode] = React.useState<ViewMode>("kanban");
  const [filterMyTasks, setFilterMyTasks] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<TaskWithUser | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Atualiza quando initialTasks mudar (após refresh)
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleTasksGenerated = (newTasks: TaskWithUser[]) => {
    setTasks((prev) => [...prev, ...newTasks]);
  };

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

  // Filtra tarefas
  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;

    if (filterMyTasks && currentUserId) {
      filtered = filtered.filter((t) => t.assignedUserId === currentUserId);
    }

    return filtered;
  }, [tasks, filterMyTasks, currentUserId]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Gerencie as tarefas do projeto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro Minhas Tarefas */}
          <Button
            variant={filterMyTasks ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterMyTasks(!filterMyTasks)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Minhas Tarefas
          </Button>

          {/* Toggle de Visualização */}
          <div className="flex items-center gap-1 border border-[hsl(var(--border))] rounded-md p-1">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-7 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <GenerateTasksButton
            projectId={projectId}
            onTasksGenerated={handleTasksGenerated}
          />
        </div>
      </div>

      {/* Visualização Condicional */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          projectId={projectId}
          initialTasks={filteredTasks}
          teamMembers={teamMembers}
        />
      ) : (
        <TasksListView
          projectId={projectId}
          tasks={filteredTasks}
          teamMembers={teamMembers}
          onTaskClick={handleTaskClick}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {/* Task Detail Sheet - Reutiliza do KanbanBoard */}
      {selectedTask && (
        <TaskSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          task={selectedTask}
          teamMembers={teamMembers}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onClose={handleSheetClose}
        />
      )}
    </>
  );
}
