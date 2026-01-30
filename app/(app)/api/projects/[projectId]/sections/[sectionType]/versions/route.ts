import { NextResponse } from "next/server";
import { getSectionVersions } from "@/app/(app)/projects/[id]/definition/actions";
import { ProjectSectionType } from "@prisma/client";

const VALID_SECTION_TYPES: string[] = Object.values(ProjectSectionType);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; sectionType: string }> }
) {
  const { projectId, sectionType: sectionTypeParam } = await params;

  if (!VALID_SECTION_TYPES.includes(sectionTypeParam)) {
    return NextResponse.json(
      { success: false, error: "Tipo de seção inválido" },
      { status: 400 }
    );
  }

  const sectionType = sectionTypeParam as ProjectSectionType;
  const result = await getSectionVersions(projectId, sectionType);

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
