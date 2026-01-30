import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { projectsWhereUserHasAccess } from "@/lib/project-permissions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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

function typeBadge(type: string) {
  switch (type) {
    case "WEB":
      return <Badge variant="neutral">Web</Badge>;
    case "MOBILE":
      return <Badge variant="neutral">Mobile</Badge>;
    case "FULLSTACK":
      return <Badge variant="neutral">Fullstack</Badge>;
    default:
      return <Badge variant="neutral">{type}</Badge>;
  }
}

type ProjectWithTasks = Prisma.ProjectGetPayload<{
  include: { tasks: { select: { status: true } } };
}>;

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects: ProjectWithTasks[] = await prisma.project.findMany({
    where: projectsWhereUserHasAccess(user.id),
    orderBy: { updatedAt: "desc" },
    include: {
      tasks: {
        select: { status: true },
      },
    },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Meus Projetos</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Todos os projetos que você tem acesso.
          </p>
        </div>

        <Button asChild>
          <Link href="/projects/new">Novo Projeto</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const total = p.tasks.length;
          const done = p.tasks.filter((t) => t.status === "DONE").length;
          const progress = total === 0 ? 0 : Math.round((done / total) * 100);

          return (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="hover:border-white/20 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{p.name}</CardTitle>
                      <CardDescription className="truncate">
                        {p.clientName ? `Cliente: ${p.clientName}` : "Sem cliente"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {statusBadge(p.status)}
                      {typeBadge(p.type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>Progresso</span>
                    <span>
                      {progress}% {total > 0 ? `(${done}/${total})` : ""}
                    </span>
                  </div>
                  <Progress value={progress} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

