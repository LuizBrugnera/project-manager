"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

interface NotificationsBellProps {
  activities: ActivityWithUser[];
}

export function NotificationsBell({ activities }: NotificationsBellProps) {
  const unreadCount = activities.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Atividades Recentes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activities.length === 0 ? (
          <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Nenhuma atividade recente
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {activities.map((activity) => {
              const userName = activity.user?.name || "Usuário desconhecido";
              const userAvatar = activity.user?.avatar;
              const projectName = activity.project?.name || "Projeto";
              const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
                locale: ptBR,
              });

              return (
                <DropdownMenuItem
                  key={activity.id}
                  asChild
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <Link href={activity.projectId ? `/projects/${activity.projectId}/activities` : "#"}>
                    <Avatar name={userName} src={userAvatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight">
                        <span className="font-medium">{userName}</span>{" "}
                        <span className="text-[hsl(var(--muted-foreground))]">
                          {activity.message}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {projectName}
                        </span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">•</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        {activities.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="text-center w-full">
                Ver todas as atividades
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
