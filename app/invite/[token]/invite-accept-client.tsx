"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

export function InviteAcceptClient({
  token,
  inviteEmail,
}: {
  token: string;
  inviteEmail: string | null;
}) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = React.useState(false);

  const accept = async () => {
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) {
        showToast.error("Erro", data.error || "Não foi possível aceitar o convite.");
        setIsAccepting(false);
        return;
      }

      showToast.success("Bem-vindo!", "Você entrou no workspace com sucesso.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      showToast.error("Erro", "Falha ao aceitar convite.");
      setIsAccepting(false);
    }
  };

  return (
    <div className="space-y-3">
      {inviteEmail ? (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          Convite direcionado para: <span className="font-medium">{inviteEmail}</span>
        </div>
      ) : (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          Convite genérico.
        </div>
      )}

      <Button onClick={accept} disabled={isAccepting} className="w-full">
        {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span className={isAccepting ? "ml-2" : ""}>Aceitar convite</span>
      </Button>
    </div>
  );
}

