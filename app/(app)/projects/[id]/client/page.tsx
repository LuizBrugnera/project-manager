import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDataForm } from "./client-data-form";

export default async function ProjectClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(id);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      clientCompany: true,
      clientContactName: true,
      clientContactEmail: true,
      clientNotes: true,
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Dados do Cliente</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Informações de contato e observações sobre o cliente do projeto.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>
            Mantenha os dados de contato do cliente atualizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientDataForm
            projectId={id}
            initialData={{
              company: project.clientCompany || "",
              contactName: project.clientContactName || "",
              contactEmail: project.clientContactEmail || "",
              notes: project.clientNotes || "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
