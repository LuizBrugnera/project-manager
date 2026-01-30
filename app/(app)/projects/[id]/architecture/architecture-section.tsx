"use client";

import { ProjectSectionEditor } from "@/components/project/project-section-editor";
import { updateProjectSection } from "./actions";
import type { ProjectSectionType } from "@prisma/client";

interface ArchitectureSectionProps {
  projectId: string;
  sectionKey: string;
  sectionType: ProjectSectionType;
  initialContent: string;
  initialExternalLinks?: {
    figma?: string;
    github?: string;
    other?: string[];
  };
  observationMode?: boolean;
  placeholder?: string;
}

export function ArchitectureSection({
  projectId,
  sectionKey,
  sectionType,
  initialContent,
  initialExternalLinks,
  observationMode = false,
  placeholder,
}: ArchitectureSectionProps) {
  const handleSave = async (
    content: string,
    externalLinks?: {
      figma?: string;
      github?: string;
      other?: string[];
    }
  ) => {
    return await updateProjectSection(projectId, sectionKey, content, externalLinks);
  };

  const handleRestore = () => {
    window.location.reload();
  };

  return (
    <ProjectSectionEditor
      projectId={projectId}
      sectionKey={sectionKey}
      sectionType={sectionType}
      initialContent={initialContent}
      initialExternalLinks={initialExternalLinks}
      observationMode={observationMode}
      placeholder={placeholder}
      onSave={handleSave}
    />
  );
}
