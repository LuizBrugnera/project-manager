"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updateProjectDatesAction } from "@/app/(app)/projects/[id]/actions";
import { showToast } from "@/lib/toast";

interface ProjectDatesProps {
  projectId: string;
  startDate: Date | null;
  deadline: Date | null;
}

export function ProjectDates({
  projectId,
  startDate,
  deadline,
}: ProjectDatesProps) {
  const [startDateState, setStartDateState] = React.useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [deadlineState, setDeadlineState] = React.useState<Date | undefined>(
    deadline ? new Date(deadline) : undefined
  );
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleSave = async () => {
    setIsUpdating(true);

    const result = await updateProjectDatesAction(
      projectId,
      startDateState ? startDateState.toISOString().split("T")[0] : null,
      deadlineState ? deadlineState.toISOString().split("T")[0] : null
    );

    if (result.success) {
      showToast.success("Datas atualizadas", "As datas do projeto foram atualizadas com sucesso.");
    } else {
      showToast.error("Erro ao atualizar", result.error);
    }

    setIsUpdating(false);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {/* Data de Início */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Data de Início</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDateState && "text-[hsl(var(--muted-foreground))]"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDateState ? (
                format(startDateState, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione a data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDateState}
              onSelect={setStartDateState}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Data de Entrega</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !deadlineState && "text-[hsl(var(--muted-foreground))]"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadlineState ? (
                format(deadlineState, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione a data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={deadlineState}
              onSelect={setDeadlineState}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Botão Salvar */}
      {(startDateState !== (startDate ? new Date(startDate) : undefined) ||
        deadlineState !== (deadline ? new Date(deadline) : undefined)) && (
        <div className="flex items-end">
          <Button onClick={handleSave} disabled={isUpdating} size="sm">
            {isUpdating ? "Salvando..." : "Salvar Datas"}
          </Button>
        </div>
      )}
    </div>
  );
}
