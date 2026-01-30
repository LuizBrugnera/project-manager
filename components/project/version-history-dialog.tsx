"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Clock, RotateCcw, Eye, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import type { ContentVersion, ProjectSectionType } from "@prisma/client";

type VersionWithUser = ContentVersion & {
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
};

interface VersionHistoryDialogProps {
  projectId: string;
  sectionType: ProjectSectionType;
  currentContent: string;
  onRestore?: () => void;
}

export function VersionHistoryDialog({
  projectId,
  sectionType,
  currentContent,
  onRestore,
}: VersionHistoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [versions, setVersions] = React.useState<VersionWithUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = React.useState<VersionWithUser | null>(null);
  const [previewMode, setPreviewMode] = React.useState(false);

  const loadVersions = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/sections/${sectionType}/versions`
      );
      const data = await response.json();
      if (data.success) {
        setVersions(data.versions);
      } else {
        showToast.error("Erro", data.error || "Erro ao carregar versões");
      }
    } catch (error) {
      showToast.error("Erro", "Erro ao carregar histórico de versões");
    } finally {
      setLoading(false);
    }
  }, [projectId, sectionType]);

  React.useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, loadVersions]);

  const handleRestore = async (versionId: string) => {
    if (!confirm("Tem certeza que deseja restaurar esta versão? A versão atual será salva como backup.")) {
      return;
    }

    setRestoring(versionId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/sections/${sectionType}/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ versionId }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast.success("Versão restaurada", "A versão foi restaurada com sucesso.");
        setOpen(false);
        onRestore?.();
      } else {
        showToast.error("Erro", data.error || "Erro ao restaurar versão");
      }
    } catch (error) {
      showToast.error("Erro", "Erro ao restaurar versão");
    } finally {
      setRestoring(null);
    }
  };

  const contentToShow = selectedVersion ? selectedVersion.content : currentContent;
  const isCurrentVersion = !selectedVersion;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-1" />
          Histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Versões</DialogTitle>
          <DialogDescription>
            Visualize e restaure versões anteriores desta seção.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
          {/* Lista de Versões */}
          <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
              <h3 className="text-sm font-semibold">Versões</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Carregando versões...
                </div>
              ) : versions.length === 0 ? (
                <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  Nenhuma versão anterior encontrada.
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--border))]">
                  {/* Versão Atual */}
                  <button
                    onClick={() => setSelectedVersion(null)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-[hsl(var(--muted))]/30 transition-colors",
                      isCurrentVersion && "bg-[hsl(var(--muted))]/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="success" className="text-xs">
                            Atual
                          </Badge>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            Versão atual
                          </span>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Versões Anteriores */}
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={cn(
                        "w-full p-3 text-left hover:bg-[hsl(var(--muted))]/30 transition-colors",
                        selectedVersion?.id === version.id && "bg-[hsl(var(--muted))]/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="neutral" className="text-xs">
                              v{version.version}
                            </Badge>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {format(new Date(version.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar
                              name={version.createdBy.name}
                              src={version.createdBy.avatar}
                              size="sm"
                            />
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {version.createdBy.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview da Versão Selecionada */}
          <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {isCurrentVersion ? "Versão Atual" : `Versão ${selectedVersion.version}`}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={previewMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {previewMode ? "Markdown" : "Preview"}
                </Button>
                {!isCurrentVersion && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleRestore(selectedVersion.id)}
                    disabled={restoring === selectedVersion.id}
                  >
                    {restoring === selectedVersion.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-1" />
                    )}
                    Restaurar
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {previewMode ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 leading-relaxed">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-outside pl-6 mb-4 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-outside pl-6 mb-4 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="[&>p]:inline [&>p]:m-0">{children}</li>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-[hsl(var(--muted))] px-1 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ) : (
                          <code className={className}>{children}</code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="bg-[hsl(var(--muted))] p-4 rounded-lg overflow-x-auto mb-4">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {contentToShow}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                  {contentToShow}
                </pre>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
