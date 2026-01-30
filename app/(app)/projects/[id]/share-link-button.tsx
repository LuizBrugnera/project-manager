"use client";

import * as React from "react";
import { Copy, ExternalLink, Link as LinkIcon, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { generatePublicTokenAction, revokePublicTokenAction } from "./actions";

interface ShareLinkButtonProps {
  projectId: string;
  currentToken: string | null;
}

export function ShareLinkButton({
  projectId,
  currentToken,
}: ShareLinkButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isRevoking, setIsRevoking] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const router = useRouter();

  const [publicUrl, setPublicUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentToken && typeof window !== "undefined") {
      setPublicUrl(`${window.location.origin}/share/${currentToken}`);
    }
  }, [currentToken]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generatePublicTokenAction(projectId);
    if (result.success) {
      router.refresh();
    }
    setIsGenerating(false);
  };

  const handleRevoke = async () => {
    if (!confirm("Tem certeza que deseja revogar o link público?")) return;
    setIsRevoking(true);
    const result = await revokePublicTokenAction(projectId);
    if (result.success) {
      router.refresh();
    }
    setIsRevoking(false);
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentToken) {
    return (
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        variant="outline"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <LinkIcon className="h-4 w-4 mr-1" />
            Gerar Link Público
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded font-mono truncate max-w-[200px]">
        /share/{currentToken.slice(0, 8)}...
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        title="Copiar link"
      >
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <Button variant="outline" size="icon" asChild>
        <a href={publicUrl!} target="_blank" rel="noopener noreferrer" title="Abrir em nova aba">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRevoke}
        disabled={isRevoking}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
      >
        {isRevoking ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Revogar"
        )}
      </Button>
    </div>
  );
}
