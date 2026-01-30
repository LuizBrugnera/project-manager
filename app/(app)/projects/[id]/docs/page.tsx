import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { DocsEditor } from "./docs-editor";

export default async function ProjectDocsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  return <DocsEditor projectId={id} projectName={project.name} />;
}
