"use client";

import * as React from "react";
import { ProjectStatus } from "@prisma/client";
import { updateProjectStatusAction } from "@/app/(app)/projects/[id]/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/lib/toast";

interface ProjectStatusSelectProps {
  projectId: string;
  currentStatus: ProjectStatus;
}

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planejamento",
  UX_UI: "UX/UI",
  ARCHITECTURE: "Arquitetura",
  DEVELOPMENT: "Desenvolvimento",
  DEPLOYMENT: "Implantação",
  TESTING: "Testes",
  DELIVERY: "Entrega",
  PUBLISHED: "Publicado",
  SUPPORT: "Suporte",
  ON_HOLD: "Pausado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export function ProjectStatusSelect({
  projectId,
  currentStatus,
}: ProjectStatusSelectProps) {
  const [status, setStatus] = React.useState<ProjectStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    setIsUpdating(true);
    setStatus(newStatus);

    const result = await updateProjectStatusAction(projectId, newStatus);

    if (result.success) {
      showToast.success("Status atualizado", "O status do projeto foi alterado com sucesso.");
    } else {
      setStatus(currentStatus); // Reverte em caso de erro
      showToast.error("Erro ao atualizar", result.error);
    }

    setIsUpdating(false);
  };

  return (
    <Select
      value={status}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecione o status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PLANNING">{statusLabels.PLANNING}</SelectItem>
        <SelectItem value="UX_UI">{statusLabels.UX_UI}</SelectItem>
        <SelectItem value="ARCHITECTURE">{statusLabels.ARCHITECTURE}</SelectItem>
        <SelectItem value="DEVELOPMENT">{statusLabels.DEVELOPMENT}</SelectItem>
        <SelectItem value="DEPLOYMENT">{statusLabels.DEPLOYMENT}</SelectItem>
        <SelectItem value="TESTING">{statusLabels.TESTING}</SelectItem>
        <SelectItem value="DELIVERY">{statusLabels.DELIVERY}</SelectItem>
        <SelectItem value="PUBLISHED">{statusLabels.PUBLISHED}</SelectItem>
        <SelectItem value="SUPPORT">{statusLabels.SUPPORT}</SelectItem>
        <SelectItem value="ON_HOLD">{statusLabels.ON_HOLD}</SelectItem>
        <SelectItem value="COMPLETED">{statusLabels.COMPLETED}</SelectItem>
        <SelectItem value="CANCELLED">{statusLabels.CANCELLED}</SelectItem>
      </SelectContent>
    </Select>
  );
}
