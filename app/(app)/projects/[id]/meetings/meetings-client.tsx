"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { CalendarDays, Plus, Trash2, Edit2, Users, CheckCircle2, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import {
  createMeetingAction,
  updateMeetingAction,
  deleteMeetingAction,
} from "./actions";

interface Meeting {
  id: string;
  date: Date;
  summary: string;
  decisions: string[];
  nextSteps: string[];
  participants: string[]; // Array de nomes para exibição
  participantIds?: string[]; // Array de IDs para edição
}

interface ProjectMember {
  id: string;
  name: string;
  email: string;
}

interface MeetingsClientProps {
  projectId: string;
  initialMeetings: Meeting[];
  projectMembers: ProjectMember[];
}

export function MeetingsClient({
  projectId,
  initialMeetings,
  projectMembers,
}: MeetingsClientProps) {
  const [meetings, setMeetings] = React.useState<Meeting[]>(
    initialMeetings.map((m) => ({
      ...m,
      date: new Date(m.date),
    }))
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingMeeting, setEditingMeeting] = React.useState<Meeting | null>(null);
  const [formData, setFormData] = React.useState({
    date: undefined as Date | undefined,
    summary: "",
    decisions: [] as string[],
    nextSteps: [] as string[],
    participants: [] as string[],
  });
  const [newDecision, setNewDecision] = React.useState("");
  const [newNextStep, setNewNextStep] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const handleOpenDialog = (meeting?: Meeting) => {
    if (meeting) {
      setEditingMeeting(meeting);
      // Busca IDs dos participantes baseado nos nomes
      const participantIds = meeting.participantIds ||
        meeting.participants.map((name) => {
          const member = projectMembers.find((m) => m.name === name);
          return member?.id || "";
        }).filter(Boolean);

      setFormData({
        date: new Date(meeting.date),
        summary: meeting.summary,
        decisions: [...meeting.decisions],
        nextSteps: [...meeting.nextSteps],
        participants: participantIds,
      });
    } else {
      setEditingMeeting(null);
      setFormData({
        date: new Date(),
        summary: "",
        decisions: [],
        nextSteps: [],
        participants: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleAddDecision = () => {
    if (newDecision.trim()) {
      setFormData({
        ...formData,
        decisions: [...formData.decisions, newDecision.trim()],
      });
      setNewDecision("");
    }
  };

  const handleRemoveDecision = (index: number) => {
    setFormData({
      ...formData,
      decisions: formData.decisions.filter((_, i) => i !== index),
    });
  };

  const handleAddNextStep = () => {
    if (newNextStep.trim()) {
      setFormData({
        ...formData,
        nextSteps: [...formData.nextSteps, newNextStep.trim()],
      });
      setNewNextStep("");
    }
  };

  const handleRemoveNextStep = (index: number) => {
    setFormData({
      ...formData,
      nextSteps: formData.nextSteps.filter((_, i) => i !== index),
    });
  };

  const handleToggleParticipant = (memberId: string) => {
    setFormData({
      ...formData,
      participants: formData.participants.includes(memberId)
        ? formData.participants.filter((id) => id !== memberId)
        : [...formData.participants, memberId],
    });
  };

  const handleSave = async () => {
    if (!formData.summary.trim() || !formData.date) {
      showToast.error("Campos obrigatórios", "Preencha data e resumo.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingMeeting) {
        const result = await updateMeetingAction(editingMeeting.id, projectId, {
          date: formData.date.toISOString().split("T")[0],
          summary: formData.summary,
          decisions: formData.decisions,
          nextSteps: formData.nextSteps,
          participants: formData.participants,
        });

        if (result.success) {
          const participantNames = formData.participants.map((id) => {
            const member = projectMembers.find((m) => m.id === id);
            return member?.name || "Desconhecido";
          });

          setMeetings((prev) =>
            prev.map((m) =>
              m.id === editingMeeting.id
                ? {
                  ...m,
                  date: formData.date!,
                  summary: formData.summary,
                  decisions: formData.decisions,
                  nextSteps: formData.nextSteps,
                  participants: participantNames,
                  participantIds: formData.participants,
                }
                : m
            )
          );
          showToast.success("Reunião atualizada", "A reunião foi atualizada com sucesso.");
          setIsDialogOpen(false);
        } else {
          showToast.error("Erro", result.error);
        }
      } else {
        const result = await createMeetingAction(
          projectId,
          formData.date.toISOString().split("T")[0],
          formData.summary,
          formData.decisions,
          formData.nextSteps
        );

        if (result.success && result.meeting) {
          const participantNames = formData.participants.map((id) => {
            const member = projectMembers.find((m) => m.id === id);
            return member?.name || "Desconhecido";
          });

          const newMeeting: Meeting = {
            id: result.meeting.id,
            date: new Date(result.meeting.date),
            summary: result.meeting.summary,
            decisions: result.meeting.decisions ? JSON.parse(result.meeting.decisions) : [],
            nextSteps: result.meeting.nextSteps ? JSON.parse(result.meeting.nextSteps) : [],
            participants: participantNames,
            participantIds: formData.participants,
          };
          setMeetings((prev) => [newMeeting, ...prev]);
          showToast.success("Reunião criada", "A reunião foi criada com sucesso.");
          setIsDialogOpen(false);
        } else if ("error" in result) {
          showToast.error("Erro", result.error);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta reunião?")) return;

    const result = await deleteMeetingAction(meetingId, projectId);

    if (result.success) {
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      showToast.success("Reunião excluída", "A reunião foi excluída com sucesso.");
    } else {
      showToast.error("Erro", result.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Histórico de Reuniões</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Reunião
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMeeting ? "Editar Reunião" : "Nova Reunião"}
              </DialogTitle>
              <DialogDescription>
                Registre os detalhes da reunião, decisões tomadas e próximos passos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Data */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Data da Reunião *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-[hsl(var(--muted-foreground))]"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(formData.date, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData({ ...formData, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Participantes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Participantes</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-[hsl(var(--border))] rounded-md p-2">
                  {projectMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`participant-${member.id}`}
                        checked={formData.participants.includes(member.id)}
                        onCheckedChange={() => handleToggleParticipant(member.id)}
                      />
                      <label
                        htmlFor={`participant-${member.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {member.name} ({member.email})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Resumo da Conversa *</label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  placeholder="Descreva o que foi discutido na reunião..."
                  rows={5}
                />
              </div>

              {/* Decisões */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Decisões Tomadas</label>
                <div className="flex gap-2">
                  <Input
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddDecision()}
                    placeholder="Adicionar decisão..."
                  />
                  <Button onClick={handleAddDecision} size="sm" variant="outline">
                    Adicionar
                  </Button>
                </div>
                {formData.decisions.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {formData.decisions.map((decision, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-2 bg-[hsl(var(--muted))]/30 rounded"
                      >
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                        <span className="flex-1 text-sm">{decision}</span>
                        <Button
                          onClick={() => handleRemoveDecision(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Próximos Passos */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Próximos Passos</label>
                <div className="flex gap-2">
                  <Input
                    value={newNextStep}
                    onChange={(e) => setNewNextStep(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNextStep()}
                    placeholder="Adicionar próximo passo..."
                  />
                  <Button onClick={handleAddNextStep} size="sm" variant="outline">
                    Adicionar
                  </Button>
                </div>
                {formData.nextSteps.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {formData.nextSteps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-2 bg-[hsl(var(--muted))]/30 rounded"
                      >
                        <ArrowRight className="h-4 w-4 mt-0.5 text-sky-400 flex-shrink-0" />
                        <span className="flex-1 text-sm">{step}</span>
                        <Button
                          onClick={() => handleRemoveNextStep(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
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
                {isSaving ? "Salvando..." : editingMeeting ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Nenhuma reunião registrada ainda.
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              size="sm"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar Primeira Reunião
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <CardTitle className="text-base">
                        {format(meeting.date, "PPP", { locale: ptBR })}
                      </CardTitle>
                    </div>
                    {meeting.participants.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <Users className="h-3 w-3" />
                        <span>{meeting.participants.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(meeting)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(meeting.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Resumo</h4>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
                    {meeting.summary}
                  </p>
                </div>

                {/* Decisões */}
                {meeting.decisions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Decisões Tomadas</h4>
                    <ul className="space-y-1">
                      {meeting.decisions.map((decision, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Próximos Passos */}
                {meeting.nextSteps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Próximos Passos</h4>
                    <ul className="space-y-1">
                      {meeting.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 mt-0.5 text-sky-400 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
