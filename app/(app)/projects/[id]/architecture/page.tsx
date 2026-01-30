import { notFound, redirect } from "next/navigation";
import { Database, Code, Layout, GitBranch, Palette, Zap } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hasProjectAccess } from "@/lib/project-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArchitectureSection } from "./architecture-section";

export default async function ProjectArchitecturePage({
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
          type: {
            in: [
              "BACKEND_MODELAGEM",
              "BACKEND_DIAGRAMAS",
              "BACKEND_ARQUITETURA",
              "FRONTEND_FLUXO",
              "FRONTEND_UI_DESIGN",
              "FRONTEND_PROTOTIPO",
            ],
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Organiza seções por categoria
  const backendSections = {
    modelagem: project.sections.find((s) => s.type === "BACKEND_MODELAGEM"),
    diagramas: project.sections.find((s) => s.type === "BACKEND_DIAGRAMAS"),
    arquitetura: project.sections.find((s) => s.type === "BACKEND_ARQUITETURA"),
  };

  const frontendSections = {
    fluxo: project.sections.find((s) => s.type === "FRONTEND_FLUXO"),
    uiDesign: project.sections.find((s) => s.type === "FRONTEND_UI_DESIGN"),
    prototipo: project.sections.find((s) => s.type === "FRONTEND_PROTOTIPO"),
  };

  // Helper para parsear externalLinks
  const parseExternalLinks = (section: typeof project.sections[0] | undefined) => {
    if (!section?.externalLinks) return undefined;
    try {
      return JSON.parse(section.externalLinks);
    } catch {
      return undefined;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Arquitetura & Design</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Documente a arquitetura técnica, design e fluxos do projeto.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["backend", "frontend"]} className="space-y-4">
        {/* Back-end Section */}
        <Card>
          <CardHeader>
            <AccordionItem value="backend" className="border-none">
              <AccordionTrigger className="hover:no-underline">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-400" />
                  Back-end
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardDescription className="pt-2">
                  Documentação técnica do backend: modelagem de dados, diagramas e arquitetura.
                </CardDescription>
              </AccordionContent>
            </AccordionItem>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {/* Modelagem de Banco */}
              <AccordionItem value="backend-modelagem">
                <AccordionTrigger className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-cyan-400" />
                  <span>Modelagem de Banco</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ArchitectureSection
                    projectId={id}
                    sectionKey="backend_modelagem"
                    sectionType="BACKEND_MODELAGEM"
                    initialContent={backendSections.modelagem?.content || ""}
                    initialExternalLinks={parseExternalLinks(backendSections.modelagem)}
                    observationMode={observationMode}
                    placeholder={`## Modelagem de Banco de Dados

Descreva aqui:
- Entidades principais
- Relacionamentos
- Constraints e índices
- Migrações importantes`}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Diagramas */}
              <AccordionItem value="backend-diagramas">
                <AccordionTrigger className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-purple-400" />
                  <span>Diagramas</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ArchitectureSection
                    projectId={id}
                    sectionKey="backend_diagramas"
                    sectionType="BACKEND_DIAGRAMAS"
                    initialContent={backendSections.diagramas?.content || ""}
                    initialExternalLinks={parseExternalLinks(backendSections.diagramas)}
                    observationMode={observationMode}
                    placeholder={`## Diagramas Técnicos

Descreva aqui:
- Diagramas de sequência
- Diagramas de classes
- Fluxos de dados
- Arquitetura de componentes`}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Arquitetura */}
              <AccordionItem value="backend-arquitetura">
                <AccordionTrigger className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-emerald-400" />
                  <span>Arquitetura</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ArchitectureSection
                    projectId={id}
                    sectionKey="backend_arquitetura"
                    sectionType="BACKEND_ARQUITETURA"
                    initialContent={backendSections.arquitetura?.content || ""}
                    initialExternalLinks={parseExternalLinks(backendSections.arquitetura)}
                    observationMode={observationMode}
                    placeholder={`## Arquitetura do Backend

Descreva aqui:
- Padrões arquiteturais utilizados
- Estrutura de pastas
- APIs e endpoints principais
- Integrações externas`}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Front-end Section */}
        <Card>
          <CardHeader>
            <AccordionItem value="frontend" className="border-none">
              <AccordionTrigger className="hover:no-underline">
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-pink-400" />
                  Front-end
                </CardTitle>
              </AccordionTrigger>
              <AccordionContent>
                <CardDescription className="pt-2">
                  Documentação do frontend: fluxos de usuário, design e protótipos.
                </CardDescription>
              </AccordionContent>
            </AccordionItem>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-4">
              {/* Fluxo de Usuário */}
              <AccordionItem value="frontend-fluxo">
                <AccordionTrigger className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Fluxo de Usuário</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ArchitectureSection
                    projectId={id}
                    sectionKey="frontend_fluxo"
                    sectionType="FRONTEND_FLUXO"
                    initialContent={frontendSections.fluxo?.content || ""}
                    initialExternalLinks={parseExternalLinks(frontendSections.fluxo)}
                    observationMode={observationMode}
                    placeholder={`## Fluxo de Usuário

Descreva aqui:
- Jornadas do usuário
- Fluxos de navegação
- Estados da aplicação
- Transições e animações`}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* UI Design */}
              <AccordionItem value="frontend-ui-design">
                <AccordionTrigger className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-rose-400" />
                  <span>UI Design</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ArchitectureSection
                    projectId={id}
                    sectionKey="frontend_ui_design"
                    sectionType="FRONTEND_UI_DESIGN"
                    initialContent={frontendSections.uiDesign?.content || ""}
                    initialExternalLinks={parseExternalLinks(frontendSections.uiDesign)}
                    observationMode={observationMode}
                    placeholder={`## UI Design

Descreva aqui:
- Design system utilizado
- Componentes principais
- Paleta de cores
- Tipografia
- Espaçamentos`}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Protótipo */}
              <AccordionItem value="frontend-prototipo">
                <AccordionTrigger className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Protótipo</span>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ArchitectureSection
                    projectId={id}
                    sectionKey="frontend_prototipo"
                    sectionType="FRONTEND_PROTOTIPO"
                    initialContent={frontendSections.prototipo?.content || ""}
                    initialExternalLinks={parseExternalLinks(frontendSections.prototipo)}
                    observationMode={observationMode}
                    placeholder={`## Protótipo

Descreva aqui:
- Fidelidade do protótipo
- Interações principais
- Breakpoints responsivos
- Testes de usabilidade`}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </Accordion>
    </div>
  );
}
