"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Check, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { VersionHistoryDialog } from "@/components/project/version-history-dialog";
import { saveSectionAction } from "./actions";
import { showToast } from "@/lib/toast";
import type { ProjectSectionType } from "@prisma/client";

const proseClasses = {
  h1: "text-2xl font-bold mt-6 mb-4",
  h2: "text-xl font-semibold mt-5 mb-3",
  h3: "text-lg font-semibold mt-4 mb-2",
  p: "mb-4 leading-relaxed",
  ul: "list-disc list-outside pl-6 mb-4 space-y-1",
  ol: "list-decimal list-outside pl-6 mb-4 space-y-1",
  li: "[&>p]:inline [&>p]:m-0",
  code: "bg-[hsl(var(--muted))] px-1 py-0.5 rounded text-sm",
  pre: "bg-[hsl(var(--muted))] p-3 md:p-4 rounded-lg overflow-x-auto mb-4 text-xs md:text-sm",
  blockquote: "border-l-4 border-[hsl(var(--muted-foreground))] pl-4 italic my-4",
};

interface DefinitionEditorProps {
  projectId: string;
  sectionType: ProjectSectionType;
  initialContent: string;
  observationMode?: boolean;
  placeholder?: string;
  rows?: number;
}

export function DefinitionEditor({
  projectId,
  sectionType,
  initialContent,
  observationMode = false,
  placeholder,
  rows = 12,
}: DefinitionEditorProps) {
  const [content, setContent] = React.useState(initialContent);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const hasChanges = content !== initialContent;

  const handleRestore = () => {
    window.location.reload();
  };

  const handleSave = async () => {
    setStatus("saving");
    setError(null);

    const result = await saveSectionAction(projectId, sectionType, content);

    if (result.success) {
      setStatus("saved");
      showToast.success("Seção salva!", "Alterações salvas com sucesso.");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setError(result.error);
      showToast.error("Erro ao salvar", result.error);
    }
  };

  const timeoutRef = React.useRef<number | ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: string) => {
    setContent(value);
    setStatus("idle");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      if (value !== initialContent) handleSave();
    }, 3000);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (observationMode) {
    return (
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 p-4 overflow-auto max-h-[70vh]">
        {content.trim() ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className={proseClasses.h1}>{children}</h1>,
                h2: ({ children }) => <h2 className={proseClasses.h2}>{children}</h2>,
                h3: ({ children }) => <h3 className={proseClasses.h3}>{children}</h3>,
                p: ({ children }) => <p className={proseClasses.p}>{children}</p>,
                ul: ({ children }) => <ul className={proseClasses.ul}>{children}</ul>,
                ol: ({ children }) => <ol className={proseClasses.ol}>{children}</ol>,
                li: ({ children }) => <li className={proseClasses.li}>{children}</li>,
                code: ({ children, className }) => (
                  <code className={className ?? proseClasses.code}>{children}</code>
                ),
                pre: ({ children }) => <pre className={proseClasses.pre}>{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className={proseClasses.blockquote}>{children}</blockquote>
                ),
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--muted-foreground))] italic">Nenhum conteúdo nesta seção.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <MarkdownEditor
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {status === "saving" && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Salvando...
            </span>
          )}
          {status === "saved" && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="h-3 w-3" />
              Salvo
            </span>
          )}
          {status === "error" && <span className="text-red-400">{error}</span>}
          {status === "idle" && hasChanges && (
            <span className="text-amber-400">Alterações não salvas</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <VersionHistoryDialog
            projectId={projectId}
            sectionType={sectionType}
            currentContent={content}
            onRestore={handleRestore}
          />
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
            <span className="ml-1">Salvar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
