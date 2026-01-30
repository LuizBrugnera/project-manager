"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { CalendarDays, CheckCircle2, Circle, Plus, Trash2, Edit2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-shadcn";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { VisualTimeline } from "@/components/roadmap/visual-timeline";
import {
  createMilestoneAction,
  updateMilestoneAction,
  deleteMilestoneAction,
} from "./actions";
import type { ProjectStatus } from "@prisma/client";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  completed: boolean;
  completedAt: Date | null;
}

interface RoadmapClientProps {
  projectId: string;
  initialMilestones: Milestone[];
  projectStatus: ProjectStatus;
  projectStartDate: Date | null;
  projectDeadline: Date | null;
}

export function RoadmapClient({
  projectId,
  initialMilestones,
  projectStatus,
  projectStartDate,
  projectDeadline,
}: RoadmapClientProps) {
  const [milestones, setMilestones] = React.useState<Milestone[]>(
    initialMilestones.map((m) => ({
      ...m,
      dueDate: new Date(m.dueDate),
      completedAt: m.completedAt ? new Date(m.completedAt) : null,
    }))
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<Milestone | null>(null);
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    dueDate: undefined as Date | undefined,
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleOpenDialog = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        title: milestone.title,
        description: milestone.description || "",
        dueDate: new Date(milestone.dueDate),
      });
    } else {
      setEditingMilestone(null);
      setFormData({
        title: "",
        description: "",
        dueDate: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.dueDate) {
      showToast.error("Campos obrigatórios", "Preencha título e data.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingMilestone) {
        const result = await updateMilestoneAction(editingMilestone.id, projectId, {
          title: formData.title,
          description: formData.description || null,
          dueDate: formData.dueDate.toISOString().split("T")[0],
        });

        if (result.success) {
          setMilestones((prev) =>
            prev.map((m) =>
              m.id === editingMilestone.id
                ? {
                  ...m,
                  title: formData.title,
                  description: formData.description || null,
                  dueDate: formData.dueDate!,
                }
                : m
            )
          );
          showToast.success("Marco atualizado", "O marco foi atualizado com sucesso.");
          setIsDialogOpen(false);
        } else {
          showToast.error("Erro", result.error);
        }
      } else {
        const result = await createMilestoneAction(
          projectId,
          formData.title,
          formData.description || null,
          formData.dueDate.toISOString().split("T")[0]
        );

        if (result.success && result.milestone) {
          setMilestones((prev) => [
            ...prev,
            {
              ...result.milestone,
              dueDate: new Date(result.milestone.dueDate),
              completedAt: null,
            },
          ]);
          showToast.success("Marco criado", "O marco foi criado com sucesso.");
          setIsDialogOpen(false);
        } else if ("error" in result) {
          showToast.error("Erro", result.error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (milestone: Milestone) => {
    const result = await updateMilestoneAction(milestone.id, projectId, {
      completed: !milestone.completed,
    });

    if (result.success) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestone.id
            ? {
              ...m,
              completed: !m.completed,
              completedAt: !m.completed ? new Date() : null,
            }
            : m
        )
      );
      showToast.success(
        milestone.completed ? "Marco reaberto" : "Marco concluído",
        milestone.completed
          ? "O marco foi marcado como não concluído."
          : "O marco foi marcado como concluído."
      );
    } else {
      showToast.error("Erro", result.error);
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!confirm("Tem certeza que deseja excluir este marco?")) return;

    const result = await deleteMilestoneAction(milestoneId, projectId);

    if (result.success) {
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      showToast.success("Marco excluído", "O marco foi excluído com sucesso.");
    } else {
      showToast.error("Erro", result.error);
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const handleDateChange = async (milestoneId: string, newDate: Date) => {
    const result = await updateMilestoneAction(milestoneId, projectId, {
      dueDate: newDate.toISOString().split("T")[0],
    });

    if (result.success) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId ? { ...m, dueDate: newDate } : m
        )
      );
      showToast.success("Data atualizada", "A data do marco foi atualizada.");
    } else {
      showToast.error("Erro", result.error);
    }
  };

  // Normaliza datas para Date objects
  const normalizedStartDate = projectStartDate
    ? new Date(projectStartDate)
    : null;
  const normalizedDeadline = projectDeadline ? new Date(projectDeadline) : null;

  return (
    <div className="space-y-4">
      {/* Tabs: Visual / Lista */}
      <Tabs defaultValue="visual" className="w-full">
        <TabsList>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-6">
              <VisualTimeline
                milestones={milestones.map((m) => ({
                  ...m,
                  dueDate: new Date(m.dueDate),
                }))}
                projectStatus={projectStatus}
                projectStartDate={normalizedStartDate}
                projectDeadline={normalizedDeadline}
                onDateChange={handleDateChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Marcos do Projeto</h3>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Marco
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMilestone ? "Editar Marco" : "Novo Marco"}
                  </DialogTitle>
                  <DialogDescription>
                    Defina um marco importante para o projeto.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Ex: Entrega do Protótipo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Descrição opcional do marco..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.dueDate && "text-[hsl(var(--muted-foreground))]"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {formData.dueDate ? (
                            format(formData.dueDate, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) =>
                            setFormData({ ...formData, dueDate: date })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Salvando..." : editingMilestone ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {sortedMilestones.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarDays className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Nenhum marco definido ainda.
                </p>
                <Button
                  onClick={() => handleOpenDialog()}
                  size="sm"
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Criar Primeiro Marco
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedMilestones.map((milestone) => (
                <Card
                  key={milestone.id}
                  className={cn(
                    milestone.completed && "opacity-60"
                  )}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <button
                      onClick={() => handleToggleComplete(milestone)}
                      className="mt-1"
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4
                            className={cn(
                              "font-semibold",
                              milestone.completed && "line-through"
                            )}
                          >
                            {milestone.title}
                          </h4>
                          {milestone.description && (
                            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                              {milestone.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                            <CalendarDays className="h-3 w-3" />
                            <span>
                              {format(milestone.dueDate, "PPP", { locale: ptBR })}
                            </span>
                            {milestone.completed && milestone.completedAt && (
                              <>
                                <span>•</span>
                                <span>
                                  Concluído em{" "}
                                  {format(new Date(milestone.completedAt), "PPP", {
                                    locale: ptBR,
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(milestone)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(milestone.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
