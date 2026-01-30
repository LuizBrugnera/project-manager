import * as React from "react";

import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
}: {
  value: number; // 0..100
  className?: string;
}) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
    >
      <div
        className="h-full bg-white/90 dark:bg-white transition-[width]"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

