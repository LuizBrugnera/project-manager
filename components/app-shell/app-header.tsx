"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { NotificationsBell } from "./notifications-bell";
import type { ActivityLog } from "@prisma/client";

type ActivityWithUser = ActivityLog & {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
};

interface AppHeaderProps {
  activities?: ActivityWithUser[];
}

export function AppHeader({ activities = [] }: AppHeaderProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
      <div className="h-14 px-4 flex items-center gap-3">
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader>
                <SheetTitle>Navegação</SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100%-57px)]">
                <AppSidebar
                  onNavigate={() => {
                    setOpen(false);
                  }}
                />
              </div>
              <div className="p-3 border-t border-[hsl(var(--border))]">
                <SheetClose asChild>
                  <Button variant="outline" className="w-full">
                    Fechar
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium tracking-tight">Dashboard</div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            Visão geral dos seus projetos
          </div>
        </div>

        <NotificationsBell activities={activities} />

        <Button asChild>
          <Link href="/projects/new">Novo Projeto</Link>
        </Button>
      </div>
    </header>
  );
}

