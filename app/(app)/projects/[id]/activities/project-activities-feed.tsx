"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  CheckCircle2,
  FileText,
  UserPlus,
  UserMinus,
  Move,
  Edit,
  Plus,
  Calendar,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ActivityLog, ActivityType } from "@prisma/client";

type ActivityWithUser = ActivityLog & {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
};

interface ProjectActivitiesFeedProps {
  initialActivities: ActivityWithUser[];
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "TASK_CREATED":
      return <Plus className="h-4 w-4" />;
    case "TASK_UPDATED":
    case "TASK_MOVED":
      return <Move className="h-4 w-4" />;
    case "TASK_COMPLETED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "TASK_ASSIGNED":
      return <Users className="h-4 w-4" />;
    case "SECTION_UPDATED":
      return <FileText className="h-4 w-4" />;
    case "PROJECT_STATUS_CHANGED":
      return <Calendar className="h-4 w-4" />;
    case "MEMBER_ADDED":
      return <UserPlus className="h-4 w-4" />;
    case "MEMBER_REMOVED":
      return <UserMinus className="h-4 w-4" />;
    default:
      return <Edit className="h-4 w-4" />;
  }
}

function getActivityColor(type: ActivityType) {
  switch (type) {
    case "TASK_COMPLETED":
      return "text-emerald-400";
    case "TASK_CREATED":
      return "text-blue-400";
    case "TASK_MOVED":
      return "text-amber-400";
    case "SECTION_UPDATED":
      return "text-purple-400";
    case "PROJECT_STATUS_CHANGED":
      return "text-cyan-400";
    case "MEMBER_ADDED":
      return "text-green-400";
    case "MEMBER_REMOVED":
      return "text-red-400";
    default:
      return "text-[hsl(var(--muted-foreground))]";
  }
}

export function ProjectActivitiesFeed({ initialActivities }: ProjectActivitiesFeedProps) {
  const [activities] = React.useState(initialActivities);

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[hsl(var(--muted-foreground))]">
        Nenhuma atividade registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const userName = activity.user?.name || "Usuário desconhecido";
        const userAvatar = activity.user?.avatar;
        const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
          addSuffix: true,
          locale: ptBR,
        });

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/30 transition-colors"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {activity.user ? (
                <Avatar name={userName} src={userAvatar} size="sm" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                  <span className="text-xs">?</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className={cn("flex-shrink-0 mt-0.5", getActivityColor(activity.type))}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{userName}</span>{" "}
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {activity.message}
                    </span>
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {timeAgo}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
