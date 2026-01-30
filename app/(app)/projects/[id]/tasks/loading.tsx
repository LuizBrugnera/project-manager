import { KanbanSkeleton } from "@/components/tasks/kanban-skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="h-7 w-32 bg-[hsl(var(--muted))] rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-[hsl(var(--muted))] rounded animate-pulse" />
        </div>
        <div className="h-9 w-40 bg-[hsl(var(--muted))] rounded animate-pulse" />
      </div>
      <KanbanSkeleton />
    </div>
  );
}
