import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline";
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  /** Múltiplas ações (ex: "Gerar com IA" e "Criar manualmente"). Se definido, ignora `action`. */
  actions?: EmptyStateAction[];
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actions,
  className,
}: EmptyStateProps) {
  const list = actions ?? (action ? [action] : []);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[hsl(var(--muted-foreground))] opacity-50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mb-6">
        {description}
      </p>
      {list.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {list.map((a, i) =>
            a.href ? (
              <Button key={i} variant={a.variant ?? "default"} asChild>
                <Link href={a.href}>{a.label}</Link>
              </Button>
            ) : a.onClick ? (
              <Button key={i} variant={a.variant ?? "default"} onClick={a.onClick}>
                {a.label}
              </Button>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
