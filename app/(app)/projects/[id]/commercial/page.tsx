import { notFound, redirect } from "next/navigation";
import { Lock, DollarSign, FileText, AlertCircle } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess, isProjectOwner } from "@/lib/project-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CommercialDataForm } from "./commercial-data-form";

export default async function ProjectCommercialPage({
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

  // Verifica se é Owner
  const isOwner = await isProjectOwner(id);

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      proposalValue: true,
      contractLink: true,
      commercialNotes: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Se não for Owner, mostra apenas mensagem de acesso restrito
  if (!isOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Comercial & Contratos</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Informações comerciais e contratos do projeto.
          </p>
        </div>

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Apenas o dono do projeto pode visualizar e editar informações comerciais e contratos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Comercial & Contratos</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Informações comerciais sensíveis e links de contratos. Apenas o dono do projeto tem acesso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            Dados Comerciais
          </CardTitle>
          <CardDescription>
            Valores da proposta e informações comerciais confidenciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommercialDataForm
            projectId={id}
            initialData={{
              proposalValue:
                project.proposalValue !== null
                  ? project.proposalValue.toString()
                  : "",
              contractLink: project.contractLink || "",
              commercialNotes: project.commercialNotes || "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
