"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  exact?: boolean;
}

export function Tabs({
  tabs,
  className,
}: {
  tabs: Tab[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex gap-1 border-b border-[hsl(var(--border))] overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
              active
                ? "border-white text-[hsl(var(--foreground))]"
                : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
