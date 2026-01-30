import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DefinitionEditor } from "./definition-editor";

export default async function ProjectDefinitionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string } | null>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const observationMode = resolvedSearchParams?.view === "observation";

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(id);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sections: {
        where: {
          type: { in: ["CONTEXT", "SCOPE", "ROLES"] },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const contextSection = project.sections.find((s) => s.type === "CONTEXT");
  const scopeSection = project.sections.find((s) => s.type === "SCOPE");
  const rolesSection = project.sections.find((s) => s.type === "ROLES");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Definição do Projeto</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Documente o contexto, escopo e papéis envolvidos no projeto.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contexto */}
        <Card>
          <CardHeader>
            <CardTitle>Contexto</CardTitle>
            <CardDescription>
              Descreva o cenário, problema ou oportunidade que originou este projeto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DefinitionEditor
              projectId={id}
              sectionType="CONTEXT"
              initialContent={contextSection?.content ?? ""}
              observationMode={observationMode}
              placeholder="## Contexto do Projeto

Descreva aqui:
- Qual problema estamos resolvendo?
- Qual é o cenário atual?
- Por que este projeto é importante?"
            />
          </CardContent>
        </Card>

        {/* Escopo */}
        <Card>
          <CardHeader>
            <CardTitle>Escopo</CardTitle>
            <CardDescription>
              Defina o que está incluído e excluído deste projeto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DefinitionEditor
              projectId={id}
              sectionType="SCOPE"
              initialContent={scopeSection?.content ?? ""}
              observationMode={observationMode}
              placeholder="## Escopo do Projeto

### Incluído
- Feature A
- Feature B

### Excluído
- Feature X (fora do MVP)

### Entregáveis
- [ ] Entregável 1
- [ ] Entregável 2"
            />
          </CardContent>
        </Card>

        {/* Papéis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Papéis e Responsabilidades</CardTitle>
            <CardDescription>
              Defina quem são os stakeholders e suas responsabilidades.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DefinitionEditor
              projectId={id}
              sectionType="ROLES"
              initialContent={rolesSection?.content ?? ""}
              observationMode={observationMode}
              placeholder="## Papéis

### Product Owner
- Nome: 
- Responsabilidades: Definir prioridades, validar entregas

### Tech Lead
- Nome:
- Responsabilidades: Decisões técnicas, code review

### Desenvolvedores
- Nome:
- Responsabilidades: Implementação, testes

### Cliente
- Nome:
- Responsabilidades: Feedback, aprovação"
              rows={10}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
