import { NextResponse } from "next/server";
import { restoreSectionVersion } from "@/app/(app)/projects/[id]/definition/actions";
import { ProjectSectionType } from "@prisma/client";

const VALID_SECTION_TYPES: string[] = Object.values(ProjectSectionType);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sectionType: string }> }
) {
  const { projectId, sectionType: sectionTypeParam } = await params;

  if (!VALID_SECTION_TYPES.includes(sectionTypeParam as ProjectSectionType)) {
    return NextResponse.json(
      { success: false, error: "Tipo de seção inválido" },
      { status: 400 }
    );
  }

  const sectionType = sectionTypeParam as ProjectSectionType;
  const body = await request.json();
  const { versionId } = body;

  if (!versionId) {
    return NextResponse.json(
      { success: false, error: "ID da versão não fornecido" },
      { status: 400 }
    );
  }

  const result = await restoreSectionVersion(projectId, sectionType, versionId);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
