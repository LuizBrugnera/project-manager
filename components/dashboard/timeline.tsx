import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  deadline: Date | null;
  status: string;
  clientName: string | null;
};

interface TimelineProps {
  projects: Project[];
}

function getDaysUntilDeadline(deadline: Date | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusBadge(status: string) {
  switch (status) {
    case "PLANNING":
      return <Badge variant="info">Planejamento</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="warning">Em andamento</Badge>;
    case "ON_HOLD":
      return <Badge variant="neutral">Pausado</Badge>;
    case "COMPLETED":
      return <Badge variant="success">Concluído</Badge>;
    case "CANCELLED":
      return <Badge variant="neutral">Cancelado</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function Timeline({ projects }: TimelineProps) {
  // Filtra projetos com deadline e ordena por data
  const projectsWithDeadline = projects
    .filter((p) => p.deadline)
    .sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      return a.deadline.getTime() - b.deadline.getTime();
    });

  if (projectsWithDeadline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Timeline de Entregas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<CalendarDays className="h-12 w-12" />}
            title="Nenhum deadline definido"
            description="Defina deadlines nos seus projetos para acompanhar entregas aqui."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Timeline de Entregas
        </CardTitle>
        <CardDescription>
          Projetos ordenados por data de entrega
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectsWithDeadline.map((project) => {
            const daysUntil = getDaysUntilDeadline(project.deadline);
            const isOverdue = daysUntil !== null && daysUntil < 0;
            const isSoon = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block"
              >
                <div
                  className={cn(
                    "p-4 rounded-lg border border-[hsl(var(--border))] hover:border-white/20 transition-colors",
                    isOverdue && "border-red-500/30 bg-red-500/5",
                    isSoon && !isOverdue && "border-amber-500/30 bg-amber-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{project.name}</h4>
                        {statusBadge(project.status)}
                      </div>
                      {project.clientName && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                          {project.clientName}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <CalendarDays className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-[hsl(var(--muted-foreground))]">
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Sem deadline"}
                        </span>
                        {daysUntil !== null && (
                          <>
                            <span className="text-[hsl(var(--muted-foreground))]">•</span>
                            <span
                              className={cn(
                                "font-medium",
                                isOverdue && "text-red-400",
                                isSoon && !isOverdue && "text-amber-400",
                                !isSoon && !isOverdue && "text-[hsl(var(--muted-foreground))]"
                              )}
                            >
                              {isOverdue
                                ? `${Math.abs(daysUntil)} dias atrasado`
                                : daysUntil === 0
                                ? "Hoje"
                                : daysUntil === 1
                                ? "Amanhã"
                                : `${daysUntil} dias restantes`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Clock
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isOverdue && "text-red-400",
                        isSoon && !isOverdue && "text-amber-400",
                        !isSoon && !isOverdue && "text-[hsl(var(--muted-foreground))]"
                      )}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
