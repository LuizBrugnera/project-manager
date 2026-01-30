"use client";

import * as React from "react";
import { Save, Loader2, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { updateCommercialDataAction } from "./actions";

interface CommercialDataFormProps {
  projectId: string;
  initialData: {
    proposalValue: string;
    contractLink: string;
    commercialNotes: string;
  };
}

export function CommercialDataForm({
  projectId,
  initialData,
}: CommercialDataFormProps) {
  const [formData, setFormData] = React.useState(initialData);
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");

  const hasChanges =
    formData.proposalValue !== initialData.proposalValue ||
    formData.contractLink !== initialData.contractLink ||
    formData.commercialNotes !== initialData.commercialNotes;

  const handleSave = async () => {
    setIsSaving(true);
    setStatus("saving");

    const result = await updateCommercialDataAction(projectId, {
      proposalValue: formData.proposalValue || null,
      contractLink: formData.contractLink || null,
      commercialNotes: formData.commercialNotes || null,
    });

    if (result.success) {
      setStatus("saved");
      showToast.success("Dados atualizados", "As informações comerciais foram salvas com sucesso.");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("idle");
      showToast.error("Erro ao salvar", result.error);
    }

    setIsSaving(false);
  };

  // Formata valor monetário para exibição
  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numValue = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isNaN(numValue)) return value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="proposalValue">Valor da Proposta</Label>
        <Input
          id="proposalValue"
          type="text"
          value={formData.proposalValue}
          onChange={(e) => {
            // Permite apenas números, vírgula e ponto
            const value = e.target.value.replace(/[^\d.,]/g, "");
            setFormData({ ...formData, proposalValue: value });
          }}
          placeholder="R$ 0,00"
        />
        {formData.proposalValue && (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {formatCurrency(formData.proposalValue)}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contractLink">Link do Contrato Assinado</Label>
        <div className="flex gap-2">
          <Input
            id="contractLink"
            type="url"
            value={formData.contractLink}
            onChange={(e) =>
              setFormData({ ...formData, contractLink: e.target.value })
            }
            placeholder="https://drive.google.com/... ou https://docusign.com/..."
          />
          {formData.contractLink && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              asChild
            >
              <a
                href={formData.contractLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Link para Google Drive, DocuSign ou outro serviço de armazenamento.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commercialNotes">Observações Comerciais</Label>
        <Textarea
          id="commercialNotes"
          value={formData.commercialNotes}
          onChange={(e) =>
            setFormData({ ...formData, commercialNotes: e.target.value })
          }
          placeholder="Notas sobre negociação, condições comerciais, prazos de pagamento, etc."
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
