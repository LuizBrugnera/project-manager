import { FolderKanban, ListTodo, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPICardsProps {
  activeProjects: number;
  pendingTasks: number;
  upcomingDeadlines: number;
}

export function KPICards({
  activeProjects,
  pendingTasks,
  upcomingDeadlines,
}: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total de Projetos Ativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
          <FolderKanban className="h-4 w-4 text-sky-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Projetos em andamento
          </p>
        </CardContent>
      </Card>

      {/* Tasks Pendentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks Pendentes</CardTitle>
          <ListTodo className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingTasks}</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Tasks não concluídas
          </p>
        </CardContent>
      </Card>

      {/* Próximas Entregas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximas Entregas</CardTitle>
          <Calendar className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingDeadlines}</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Deadlines nos próximos 30 dias
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
