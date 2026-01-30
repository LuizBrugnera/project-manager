"use client";

import * as React from "react";
import { FileText, Save, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkdownEditorWithPreview } from "@/components/docs/markdown-editor-with-preview";
import { GenerateDocButton } from "@/components/docs/generate-doc-button";

interface DocsEditorProps {
  projectId: string;
  projectName: string;
}

export function DocsEditor({ projectId, projectName }: DocsEditorProps) {
  const [content, setContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saved" | "error">("idle");

  const handleGenerateStart = () => {
    setIsGenerating(true);
    setContent("");
  };

  const handleGenerate = (docType: string, generatedContent: string) => {
    setContent(generatedContent);
    setSaveStatus("idle");
  };

  const handleGenerateEnd = () => {
    setIsGenerating(false);
  };

  const handleSave = async () => {
    // Por enquanto, apenas salva no localStorage
    // Futuramente pode salvar no banco de dados
    setIsSaving(true);
    try {
      localStorage.setItem(`doc_${projectId}`, content);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  // Carrega conteúdo salvo do localStorage ao montar
  React.useEffect(() => {
    const saved = localStorage.getItem(`doc_${projectId}`);
    if (saved) {
      setContent(saved);
    }
  }, [projectId]);

  const hasChanges = content !== (localStorage.getItem(`doc_${projectId}`) || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Documentação</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Crie e edite documentação profissional para o projeto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "saved" && (
            <span className="text-xs text-emerald-400">Salvo!</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-400">Erro ao salvar</span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="sm"
            variant={hasChanges ? "default" : "outline"}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Salvar
          </Button>
        </div>
      </div>

      {/* Gerador de Documentação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Documentação com IA
          </CardTitle>
          <CardDescription>
            Selecione o tipo de documentação e deixe a IA criar para você
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateDocButton 
            projectId={projectId} 
            onGenerate={handleGenerate}
            onGenerateStart={handleGenerateStart}
            onGenerateEnd={handleGenerateEnd}
          />
        </CardContent>
      </Card>

      {/* Editor */}
      <Card className="h-[600px] flex flex-col relative">
        {isGenerating && (
          <div className="absolute inset-0 bg-[hsl(var(--background))]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-sky-400" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Gerando documentação...
              </p>
            </div>
          </div>
        )}
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Editor de Documentação</CardTitle>
          <CardDescription className="text-xs">
            Edite o conteúdo gerado ou crie sua própria documentação
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <MarkdownEditorWithPreview
            value={content}
            onChange={setContent}
            placeholder="Comece a escrever ou gere documentação com IA acima..."
            className="h-full"
          />
        </CardContent>
      </Card>
    </div>
  );
}
