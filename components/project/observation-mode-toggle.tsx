"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEW_PARAM = "view";
const OBSERVATION_VALUE = "observation";

export function ObservationModeToggle({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isObservation = searchParams.get(VIEW_PARAM) === OBSERVATION_VALUE;

  const toggle = () => {
    const next = new URLSearchParams(searchParams.toString());
    if (isObservation) {
      next.delete(VIEW_PARAM);
    } else {
      next.set(VIEW_PARAM, OBSERVATION_VALUE);
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Button
      type="button"
      variant={isObservation ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      className={cn("shrink-0", className)}
      title={isObservation ? "Sair do modo observação e editar" : "Ativar modo observação (somente leitura)"}
    >
      {isObservation ? (
        <>
          <Pencil className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">Modo edição</span>
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 md:mr-1.5" />
          <span className="hidden md:inline">Modo observação</span>
        </>
      )}
    </Button>
  );
}

/** Hook-style helper: read observation mode from URL (use in client components that need it) */
export function useObservationMode(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get(VIEW_PARAM) === OBSERVATION_VALUE;
}
