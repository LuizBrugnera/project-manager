"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Code, Save, Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { VersionHistoryDialog } from "./version-history-dialog";
import type { ProjectSectionType } from "@prisma/client";

interface ProjectSectionEditorProps {
  projectId: string;
  sectionKey: string;
  sectionType?: ProjectSectionType;
  initialContent: string;
  initialExternalLinks?: {
    figma?: string;
    github?: string;
    other?: string[];
  };
  observationMode?: boolean;
  placeholder?: string;
  onSave?: (content: string, externalLinks?: { figma?: string; github?: string; other?: string[] }) => Promise<{ success: boolean; error?: string }>;
  className?: string;
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc list-outside pl-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal list-outside pl-6 mb-4 space-y-1">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="[&>p]:inline [&>p]:m-0">{children}</li>,
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-[hsl(var(--muted))] px-1 py-0.5 rounded text-sm">{children}</code>
    ) : (
      <code className={className}>{children}</code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-[hsl(var(--muted))] p-3 md:p-4 rounded-lg overflow-x-auto mb-4 -mx-3 md:mx-0 text-xs md:text-sm">
      {children}
    </pre>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto mb-4 -mx-3 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full border border-[hsl(var(--border))]">{children}</table>
      </div>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border border-[hsl(var(--border))] px-4 py-2 bg-[hsl(var(--muted))] font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-[hsl(var(--border))] px-4 py-2">{children}</td>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-[hsl(var(--muted-foreground))] pl-4 italic my-4">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} className="text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function ProjectSectionEditor({
  projectId,
  sectionKey,
  sectionType,
  initialContent,
  initialExternalLinks,
  observationMode = false,
  placeholder = "Digite seu conteúdo em Markdown...",
  onSave,
  className,
}: ProjectSectionEditorProps) {
  const [content, setContent] = React.useState(initialContent);
  const [externalLinks, setExternalLinks] = React.useState({
    figma: initialExternalLinks?.figma || "",
    github: initialExternalLinks?.github || "",
    other: initialExternalLinks?.other || [] as string[],
  });
  const [newOtherLink, setNewOtherLink] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"edit" | "preview">("edit");
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const handleRestore = () => {
    window.location.reload();
  };

  const hasChanges = content !== initialContent ||
    externalLinks.figma !== (initialExternalLinks?.figma || "") ||
    externalLinks.github !== (initialExternalLinks?.github || "") ||
    JSON.stringify(externalLinks.other) !== JSON.stringify(initialExternalLinks?.other || []);

  const handleSave = async () => {
    if (!onSave) return;

    setStatus("saving");
    setError(null);

    const result = await onSave(content, externalLinks);

    if (result.success) {
      setStatus("saved");
      showToast.success("Seção salva!", "Alterações salvas com sucesso.");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setError(result.error || "Erro ao salvar");
      showToast.error("Erro ao salvar", result.error || "Erro desconhecido");
    }
  };

  const handleAddOtherLink = () => {
    if (newOtherLink.trim()) {
      setExternalLinks({
        ...externalLinks,
        other: [...externalLinks.other, newOtherLink.trim()],
      });
      setNewOtherLink("");
    }
  };

  const handleRemoveOtherLink = (index: number) => {
    setExternalLinks({
      ...externalLinks,
      other: externalLinks.other.filter((_, i) => i !== index),
    });
  };

  if (observationMode) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
          <div className="p-3 md:p-4 overflow-auto max-h-[600px]">
            {content.trim() ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))] italic">Nenhum conteúdo nesta seção.</p>
            )}
          </div>
        </div>
        {(externalLinks.figma || externalLinks.github || externalLinks.other.length > 0) && (
          <div className="border border-[hsl(var(--border))] rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold mb-2">Links Externos</h4>
            <ul className="space-y-1.5 text-sm">
              {externalLinks.figma && (
                <li>
                  <a href={externalLinks.figma} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                    Figma
                  </a>
                </li>
              )}
              {externalLinks.github && (
                <li>
                  <a href={externalLinks.github} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                    GitHub
                  </a>
                </li>
              )}
              {externalLinks.other.map((link, i) => (
                <li key={i}>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline truncate block">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[hsl(var(--border))] pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "edit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("edit")}
          >
            <Code className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Visualizar</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="text-xs text-[hsl(var(--muted-foreground))]">
            {status === "saving" && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Salvando...</span>
              </span>
            )}
            {status === "saved" && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="h-3 w-3" />
                <span className="hidden sm:inline">Salvo</span>
              </span>
            )}
            {status === "error" && (
              <span className="text-red-400 text-xs truncate max-w-[150px] sm:max-w-none">{error}</span>
            )}
            {status === "idle" && hasChanges && (
              <span className="text-amber-400 text-xs hidden sm:inline">Alterações não salvas</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {sectionType && (
              <VersionHistoryDialog
                projectId={projectId}
                sectionType={sectionType}
                currentContent={content}
                onRestore={handleRestore}
              />
            )}
            <Button
              onClick={handleSave}
              disabled={status === "saving" || !hasChanges}
              size="sm"
              variant={hasChanges ? "default" : "outline"}
            >
              {status === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Salvar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Editor/Preview */}
      <div className="border border-[hsl(var(--border))] rounded-lg overflow-hidden">
        {viewMode === "edit" ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={15}
            className="w-full p-3 md:p-4 font-mono text-sm bg-transparent resize-y outline-none placeholder:text-[hsl(var(--muted-foreground))] overflow-x-auto"
            style={{ minHeight: "200px" }}
          />
        ) : (
          <div className="p-3 md:p-4 overflow-auto max-h-[600px]">
            {content.trim() ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-outside pl-6 mb-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside pl-6 mb-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="[&>p]:inline [&>p]:m-0">{children}</li>,
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-[hsl(var(--muted))] px-1 py-0.5 rounded text-sm">{children}</code>
                      ) : (
                        <code className={className}>{children}</code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-[hsl(var(--muted))] p-3 md:p-4 rounded-lg overflow-x-auto mb-4 -mx-3 md:mx-0 text-xs md:text-sm">
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-4 -mx-3 md:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full border border-[hsl(var(--border))]">
                            {children}
                          </table>
                        </div>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-[hsl(var(--border))] px-4 py-2 bg-[hsl(var(--muted))] font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-[hsl(var(--border))] px-4 py-2">
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[hsl(var(--muted-foreground))] pl-4 italic my-4">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a href={href} className="text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-[hsl(var(--muted-foreground))] py-12">
                <p>Nenhum conteúdo para visualizar</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* External Links Section */}
      <div className="border border-[hsl(var(--border))] rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-semibold mb-3">Links Externos</h4>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">
              Figma
            </label>
            <input
              type="url"
              value={externalLinks.figma}
              onChange={(e) => setExternalLinks({ ...externalLinks, figma: e.target.value })}
              placeholder="https://figma.com/file/..."
              className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-md bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </div>

          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">
              GitHub
            </label>
            <input
              type="url"
              value={externalLinks.github}
              onChange={(e) => setExternalLinks({ ...externalLinks, github: e.target.value })}
              placeholder="https://github.com/org/repo"
              className="w-full px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-md bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            />
          </div>

          <div>
            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">
              Outros Links
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newOtherLink}
                onChange={(e) => setNewOtherLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddOtherLink()}
                placeholder="https://..."
                className="flex-1 px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-md bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              />
              <Button onClick={handleAddOtherLink} size="sm" variant="outline">
                Adicionar
              </Button>
            </div>
            {externalLinks.other.length > 0 && (
              <ul className="mt-2 space-y-1">
                {externalLinks.other.map((link, index) => (
                  <li key={index} className="flex items-center justify-between text-sm p-2 bg-[hsl(var(--muted))]/30 rounded">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline truncate flex-1">
                      {link}
                    </a>
                    <Button
                      onClick={() => handleRemoveOtherLink(index)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 ml-2"
                    >
                      ×
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
