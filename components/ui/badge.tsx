import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border border-[hsl(var(--border))] px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        info: "bg-sky-500/10 text-sky-300 border-sky-500/20",
        neutral: "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
        destructive: "bg-red-500/10 text-red-300 border-red-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

