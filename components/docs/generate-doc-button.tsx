"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";

type DocType = "README_TECHNICAL" | "USER_MANUAL" | "EXECUTIVE_SUMMARY";

const DOC_TYPES: { value: DocType; label: string; description: string }[] = [
  {
    value: "README_TECHNICAL",
    label: "README Técnico",
    description: "Documentação técnica completa para desenvolvedores",
  },
  {
    value: "USER_MANUAL",
    label: "Manual do Usuário",
    description: "Guia de uso para usuários finais",
  },
  {
    value: "EXECUTIVE_SUMMARY",
    label: "Resumo Executivo",
    description: "Visão geral executiva do projeto",
  },
];

interface GenerateDocButtonProps {
  projectId: string;
  onGenerate: (docType: DocType, content: string) => void;
  onGenerateStart?: () => void;
  onGenerateEnd?: () => void;
}

export function GenerateDocButton({
  projectId,
  onGenerate,
  onGenerateStart,
  onGenerateEnd,
}: GenerateDocButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<DocType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedType) return;

    setIsGenerating(true);
    setError(null);
    onGenerateStart?.();

    try {
      const response = await fetch("/api/docs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, docType: selectedType }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Mensagens amigáveis baseadas no status
        let friendlyMessage = errorText || "Erro ao gerar documentação";
        if (response.status === 429) {
          friendlyMessage = "Muitas requisições. Aguarde alguns instantes e tente novamente.";
        } else if (response.status === 500) {
          if (errorText.includes("quota") || errorText.includes("QUOTA")) {
            friendlyMessage = "Limite de cota da API excedido. Tente novamente mais tarde.";
          } else if (errorText.includes("conexão") || errorText.includes("network")) {
            friendlyMessage = "Erro de conexão com a API. Verifique sua internet e tente novamente.";
          }
        }
        throw new Error(friendlyMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (!reader) {
        throw new Error("Stream não disponível");
      }

      // Limpa o conteúdo anterior antes de começar
      onGenerate(selectedType, "");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        // Atualiza em tempo real conforme os chunks chegam
        onGenerate(selectedType, accumulatedContent);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao gerar documentação";
      setError(errorMessage);
      showToast.error("Erro ao gerar documentação", errorMessage);
    } finally {
      setIsGenerating(false);
      setSelectedType(null);
      onGenerateEnd?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Seletor de Tipo */}
      <div className="grid gap-3 md:grid-cols-3">
        {DOC_TYPES.map((type) => (
          <Card
            key={type.value}
            className={cn(
              "cursor-pointer transition-all hover:border-white/20",
              selectedType === type.value && "border-white/40 bg-[hsl(var(--muted))]/20"
            )}
            onClick={() => setSelectedType(type.value)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{type.label}</CardTitle>
              <CardDescription className="text-xs">
                {type.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Botão e Erro */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={!selectedType || isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Escrever Documentação
            </>
          )}
        </Button>
        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
      </div>
    </div>
  );
}
