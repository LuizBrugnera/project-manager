"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MarkdownEditorProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function MarkdownEditor({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder,
  className,
  rows = 12,
}: MarkdownEditorProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        <span>Suporta Markdown</span>
        <span className="text-[hsl(var(--border))]">|</span>
        <span>**negrito**</span>
        <span>*itálico*</span>
        <span># título</span>
        <span>- lista</span>
      </div>
      <textarea
        id={id}
        name={name}
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm font-mono shadow-sm transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
      />
    </div>
  );
}
