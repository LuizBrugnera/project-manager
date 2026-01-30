"use client";

import * as React from "react";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { updateClientDataAction } from "./actions";

interface ClientDataFormProps {
  projectId: string;
  initialData: {
    company: string;
    contactName: string;
    contactEmail: string;
    notes: string;
  };
}

export function ClientDataForm({ projectId, initialData }: ClientDataFormProps) {
  const [formData, setFormData] = React.useState(initialData);
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");

  const hasChanges =
    formData.company !== initialData.company ||
    formData.contactName !== initialData.contactName ||
    formData.contactEmail !== initialData.contactEmail ||
    formData.notes !== initialData.notes;

  const handleSave = async () => {
    setIsSaving(true);
    setStatus("saving");

    const result = await updateClientDataAction(projectId, {
      clientCompany: formData.company,
      clientContactName: formData.contactName,
      clientContactEmail: formData.contactEmail,
      clientNotes: formData.notes,
    });

    if (result.success) {
      setStatus("saved");
      showToast.success("Dados atualizados", "As informações do cliente foram salvas com sucesso.");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("idle");
      showToast.error("Erro ao salvar", result.error);
    }

    setIsSaving(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Empresa</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            placeholder="Nome da empresa do cliente"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName">Contato Principal</Label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) =>
              setFormData({ ...formData, contactName: e.target.value })
            }
            placeholder="Nome do contato principal"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Email</Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) =>
            setFormData({ ...formData, contactEmail: e.target.value })
          }
          placeholder="email@exemplo.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          placeholder="Observações sobre o cliente, preferências, histórico, etc."
          rows={6}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {status === "saving" && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Salvando...
            </span>
          )}
          {status === "saved" && (
            <span className="text-emerald-400">Dados salvos com sucesso!</span>
          )}
          {status === "idle" && hasChanges && (
            <span className="text-amber-400">Alterações não salvas</span>
          )}
        </div>

        <Button type="submit" disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
