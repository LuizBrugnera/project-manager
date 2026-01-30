"use client";

import * as React from "react";
import { format, differenceInDays, startOfDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@prisma/client";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  completed: boolean;
  completedAt: Date | null;
}

interface VisualTimelineProps {
  milestones: Milestone[];
  projectStatus: ProjectStatus;
  projectStartDate: Date | null;
  projectDeadline: Date | null;
  onDateChange?: (milestoneId: string, newDate: Date) => void;
}

// Mapeia status do projeto para cores
function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case "PLANNING":
      return "bg-slate-500";
    case "UX_UI":
      return "bg-purple-500";
    case "ARCHITECTURE":
      return "bg-indigo-500";
    case "DEVELOPMENT":
      return "bg-blue-500";
    case "DEPLOYMENT":
      return "bg-cyan-500";
    case "TESTING":
      return "bg-amber-500";
    case "DELIVERY":
      return "bg-orange-500";
    case "PUBLISHED":
      return "bg-emerald-500";
    case "SUPPORT":
      return "bg-teal-500";
    case "ON_HOLD":
      return "bg-gray-500";
    case "COMPLETED":
      return "bg-green-500";
    case "CANCELLED":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
}

export function VisualTimeline({
  milestones,
  projectStatus,
  projectStartDate,
  projectDeadline,
  onDateChange,
}: VisualTimelineProps) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [currentDragX, setCurrentDragX] = React.useState<number>(0);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Calcula o range de datas para a timeline
  const allDates = React.useMemo(() => {
    const dates: Date[] = [];

    if (projectStartDate) dates.push(startOfDay(projectStartDate));
    if (projectDeadline) dates.push(startOfDay(projectDeadline));
    milestones.forEach((m) => dates.push(startOfDay(m.dueDate)));

    if (dates.length === 0) {
      // Se não há datas, usa o mês atual
      const today = new Date();
      dates.push(startOfDay(today));
      dates.push(startOfDay(addDays(today, 30)));
    }

    return dates;
  }, [milestones, projectStartDate, projectDeadline]);

  const minDate = React.useMemo(() => {
    if (allDates.length === 0) return new Date();
    return new Date(Math.min(...allDates.map((d) => d.getTime())));
  }, [allDates]);

  const maxDate = React.useMemo(() => {
    if (allDates.length === 0) return addDays(new Date(), 30);
    return new Date(Math.max(...allDates.map((d) => d.getTime())));
  }, [allDates]);

  const totalDays = differenceInDays(maxDate, minDate) || 30;
  const timelineWidth = 100; // porcentagem

  // Calcula posição de uma data na timeline (0-100%)
  const getDatePosition = (date: Date): number => {
    const daysFromStart = differenceInDays(startOfDay(date), minDate);
    return (daysFromStart / totalDays) * timelineWidth;
  };

  // Converte posição X para data
  const positionToDate = (x: number): Date => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return new Date();

    const relativeX = x - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    const days = (percentage / timelineWidth) * totalDays;

    return addDays(minDate, Math.max(0, Math.round(days)));
  };

  const handleMouseDown = (e: React.MouseEvent, milestoneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(milestoneId);
    setCurrentDragX(e.clientX);
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!draggingId || !timelineRef.current) return;
      setCurrentDragX(e.clientX);
    },
    [draggingId]
  );

  const handleMouseUp = React.useCallback(() => {
    if (!draggingId || !timelineRef.current) {
      setDraggingId(null);
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = currentDragX - rect.left;
    const newDate = positionToDate(currentDragX);

    if (onDateChange) {
      onDateChange(draggingId, newDate);
    }

    setDraggingId(null);
    setCurrentDragX(0);
  }, [draggingId, currentDragX, onDateChange, positionToDate]);

  React.useEffect(() => {
    if (draggingId) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const statusColor = getStatusColor(projectStatus);

  if (milestones.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[hsl(var(--muted-foreground))]">
        Nenhum marco para exibir na timeline.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Container */}
      <div
        ref={timelineRef}
        className="relative w-full h-32 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted))]/20 p-4 overflow-x-auto"
      >
        {/* Grid de datas */}
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: Math.min(totalDays + 1, 50) }).map((_, i) => {
            const date = addDays(minDate, i);
            const isWeekStart = date.getDay() === 0;
            const isMonthStart = date.getDate() === 1;

            return (
              <div
                key={i}
                className={cn(
                  "absolute top-0 bottom-0 border-l",
                  isMonthStart
                    ? "border-[hsl(var(--foreground))]/30"
                    : isWeekStart
                      ? "border-[hsl(var(--border))]"
                      : "border-[hsl(var(--border))]/30"
                )}
                style={{
                  left: `${(i / totalDays) * timelineWidth}%`,
                }}
              >
                {isMonthStart && (
                  <div className="absolute -top-6 left-0 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                    {format(date, "MMM", { locale: ptBR })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Linha de hoje */}
        {(() => {
          const today = startOfDay(new Date());
          if (today >= minDate && today <= maxDate) {
            const todayPos = getDatePosition(today);
            return (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${todayPos}%` }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-red-400 font-medium whitespace-nowrap">
                  Hoje
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Barras de milestones */}
        {milestones.map((milestone) => {
          const isDragging = draggingId === milestone.id;
          let position = getDatePosition(milestone.dueDate);

          // Se está arrastando, calcula nova posição
          if (isDragging && timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            const relativeX = currentDragX - rect.left;
            const percentage = (relativeX / rect.width) * 100;
            position = Math.max(0, Math.min(100, percentage));
          }

          return (
            <div
              key={milestone.id}
              className={cn(
                "absolute top-1/2 flex items-center gap-2 group",
                isDragging ? "z-20 cursor-grabbing" : "cursor-move"
              )}
              style={{
                left: `${position}%`,
                transform: "translateY(-50%)",
              }}
            >
              {/* Handle de arraste */}
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center",
                  milestone.completed
                    ? "bg-emerald-500 border-emerald-400"
                    : statusColor,
                  "border-white/20",
                  "hover:scale-125 cursor-grab active:cursor-grabbing",
                  isDragging && "scale-125"
                )}
                onMouseDown={(e) => handleMouseDown(e, milestone.id)}
              >
                <GripVertical className="h-2 w-2 text-white/60" />
              </div>

              {/* Barra vertical */}
              <div
                className={cn(
                  "w-1 h-8 rounded transition-all",
                  milestone.completed
                    ? "bg-emerald-500/50"
                    : statusColor,
                  "opacity-80 group-hover:opacity-100",
                  isDragging && "shadow-lg scale-110"
                )}
              />

              {/* Label do milestone */}
              <div
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all",
                  milestone.completed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]",
                  "opacity-0 group-hover:opacity-100",
                  isDragging && "opacity-100"
                )}
              >
                {milestone.title}
                <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                  {format(milestone.dueDate, "dd/MM", { locale: ptBR })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", statusColor)} />
          <span>Status: {projectStatus}</span>
        </div>
        <div>
          {format(minDate, "dd/MM/yyyy", { locale: ptBR })} -{" "}
          {format(maxDate, "dd/MM/yyyy", { locale: ptBR })}
        </div>
      </div>
    </div>
  );
}
