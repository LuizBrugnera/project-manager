import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NewProjectForm } from "./new-project-form";

export default function NewProjectPage() {
  return (
    <section className="max-w-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Novo Projeto</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Comece com o básico — você ajusta o restante depois.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">Voltar</Link>
        </Button>
      </div>

      <NewProjectForm />
    </section>
  );
}

