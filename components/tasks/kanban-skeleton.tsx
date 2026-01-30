import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[500px]">
      {[1, 2, 3, 4, 5].map((col) => (
        <div key={col} className="flex flex-col rounded-lg bg-[hsl(var(--muted))]/30 p-2">
          {/* Column Header */}
          <div className="flex items-center justify-between px-2 py-1 mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>

          {/* Tasks Skeleton */}
          <div className="flex-1 space-y-2">
            {[1, 2, 3].map((task) => (
              <Skeleton key={task} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
