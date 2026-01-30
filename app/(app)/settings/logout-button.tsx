"use client";

import * as React from "react";
import { LogOut, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (!confirm("Tem certeza que deseja sair?")) {
      return;
    }

    setIsLoggingOut(true);
    await logoutAction();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Ao sair, você precisará fazer login novamente para acessar sua conta.
      </p>
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut}
        variant="destructive"
        className="w-full sm:w-auto"
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saindo...
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4 mr-2" />
            Sair da Conta
          </>
        )}
      </Button>
    </div>
  );
}
