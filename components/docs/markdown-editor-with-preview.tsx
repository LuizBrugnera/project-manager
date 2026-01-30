"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Eye, Code } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MarkdownEditorWithPreviewProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditorWithPreview({
  value,
  onChange,
  placeholder = "Digite sua documentação em Markdown...",
  className,
}: MarkdownEditorWithPreviewProps) {
  const [viewMode, setViewMode] = React.useState<"edit" | "preview" | "split">("split");

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-2 bg-[hsl(var(--muted))]/30">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <span className="text-sm font-medium">Editor Markdown</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "edit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("edit")}
          >
            <Code className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant={viewMode === "split" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("split")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Dividido
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div className={cn("flex-1 flex flex-col", viewMode === "split" && "border-r border-[hsl(var(--border))]")}>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 w-full p-4 font-mono text-sm bg-transparent resize-none outline-none placeholder:text-[hsl(var(--muted-foreground))] overflow-auto"
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={cn("flex-1 overflow-auto p-4", viewMode === "split" && "bg-[hsl(var(--muted))]/10")}>
            {value.trim() ? (
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
                      <pre className="bg-[hsl(var(--muted))] p-4 rounded-lg overflow-x-auto mb-4">
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="min-w-full border border-[hsl(var(--border))]">
                          {children}
                        </table>
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
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-[hsl(var(--muted-foreground))] py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Preview aparecerá aqui</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
