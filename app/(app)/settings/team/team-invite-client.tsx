"use client";

import * as React from "react";
import { Copy, Link2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import { generateInviteAction } from "./actions";

type Invite = {
  id: string;
  token: string;
  email: string | null;
  createdAt: Date;
};

export function TeamInviteClient({
  initialInvites,
}: {
  initialInvites: Invite[];
}) {
  const [email, setEmail] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [invites, setInvites] = React.useState(initialInvites);
  const [origin, setOrigin] = React.useState<string>("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateInviteAction(email || undefined);
    setIsGenerating(false);

    if (!result.success) {
      showToast.error("Erro", result.error);
      return;
    }

    const token = result.token;
    showToast.success("Convite criado", "Link de convite gerado com sucesso.");

    setInvites((prev) => [
      { id: token, token, email: email.trim() ? email.trim() : null, createdAt: new Date() },
      ...prev,
    ]);
  };

  const copyLink = async (token: string) => {
    const url = `${origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast.success("Copiado", "Link de convite copiado.");
    } catch {
      showToast.error("Erro", "Não foi possível copiar o link.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail (opcional) para direcionar o convite"
        />
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          <span className="ml-2">Gerar convite</span>
        </Button>
      </div>

      {invites.length > 0 && (
        <div className="space-y-2">
          {invites.map((inv) => (
            <div
              key={inv.token}
              className="flex items-center justify-between gap-3 rounded-md border border-[hsl(var(--border))] p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {origin ? `${origin}/invite/${inv.token}` : `/invite/${inv.token}`}
                </div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                  {inv.email ? `Direcionado para: ${inv.email}` : "Convite genérico"}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyLink(inv.token)} disabled={!origin}>
                <Copy className="h-4 w-4" />
                <span className="ml-2">Copiar</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

