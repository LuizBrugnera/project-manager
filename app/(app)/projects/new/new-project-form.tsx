"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createProjectAction } from "./actions";
import { showToast } from "@/lib/toast";

export function NewProjectForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await createProjectAction(formData);

    if (result.success === false) {
      showToast.error("Erro ao criar projeto", result.error);
      setIsSubmitting(false);
      return;
    }
    showToast.success("Projeto criado!", "Redirecionando...");
    router.push(`/projects/${result.projectId}`);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações iniciais</CardTitle>
        <CardDescription>Nome, descrição e cliente.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nome
            </label>
            <Input id="name" name="name" placeholder="Ex: App do Cliente X" required disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <label htmlFor="clientName" className="text-sm font-medium">
              Cliente
            </label>
            <Input id="clientName" name="clientName" placeholder="Ex: Empresa X" disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Descreva o objetivo do projeto em 1-2 frases..."
              className="min-h-28 w-full rounded-md border border-[hsl(var(--border))] bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Projeto"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
