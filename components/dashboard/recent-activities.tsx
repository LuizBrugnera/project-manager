import Link from "next/link";
import { Activity, User, CheckCircle2, Plus, Move, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  type: string;
  message: string;
  userName: string | null;
  projectName: string | null;
  projectId: string | null;
  createdAt: Date;
};

interface RecentActivitiesProps {
  activities: ActivityItem[];
}

function getActivityIcon(type: string) {
  switch (type) {
    case "PROJECT_CREATED":
      return <Plus className="h-4 w-4 text-sky-400" />;
    case "TASK_CREATED":
      return <Plus className="h-4 w-4 text-blue-400" />;
    case "TASK_UPDATED":
      return <Move className="h-4 w-4 text-amber-400" />;
    case "TASK_MOVED":
      return <Move className="h-4 w-4 text-purple-400" />;
    case "TASK_COMPLETED":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "MEMBER_ADDED":
      return <Users className="h-4 w-4 text-emerald-400" />;
    case "MEMBER_REMOVED":
      return <Users className="h-4 w-4 text-red-400" />;
    default:
      return <Activity className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />;
  }
}


function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days === 1 ? "dia" : "dias"} atrás`;
  if (hours > 0) return `${hours} ${hours === 1 ? "hora" : "horas"} atrás`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? "minuto" : "minutos"} atrás`;
  return "Agora";
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Activity className="h-12 w-12" />}
            title="Nenhuma atividade ainda"
            description="As ações realizadas no sistema aparecerão aqui."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
        <CardDescription>
          Últimas ações no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/10 transition-colors"
            >
              <div className="mt-0.5 flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {activity.userName ? (
                    <span className="font-medium">{activity.userName}</span>
                  ) : (
                    <span className="text-[hsl(var(--muted-foreground))]">Sistema</span>
                  )}{" "}
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {activity.message}
                  </span>
                  {activity.projectName && activity.projectId && (
                    <>
                      {" "}
                      em{" "}
                      <Link
                        href={`/projects/${activity.projectId}`}
                        className="font-medium text-sky-400 hover:underline"
                      >
                        {activity.projectName}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
