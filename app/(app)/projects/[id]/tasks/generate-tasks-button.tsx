"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GenerateTasksModal } from "./generate-tasks-modal";
import type { Task } from "@prisma/client";

type TaskWithUser = Task & {
  assignedUser: { id: string; name: string; email: string } | null;
};

interface GenerateTasksButtonProps {
  projectId: string;
  onTasksGenerated?: (tasks: TaskWithUser[]) => void;
}

export function GenerateTasksButton({
  projectId,
  onTasksGenerated,
}: GenerateTasksButtonProps) {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant="outline"
        size="sm"
      >
        <Sparkles className="h-4 w-4 mr-1" />
        Gerar Tasks com IA (por fases)
      </Button>
      <GenerateTasksModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        onSuccess={onTasksGenerated}
      />
    </>
  );
}
