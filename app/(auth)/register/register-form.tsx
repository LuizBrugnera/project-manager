"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAction } from "../actions";
import { showToast } from "@/lib/toast";

export function RegisterForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerAction(formData);

    if (result.success) {
      showToast.success("Conta criada!", "Bem-vindo à plataforma!");
      router.push("/");
      router.refresh();
    } else {
      showToast.error("Erro ao criar conta", result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
          Criar conta
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Leva menos de um minuto. Sem cartão de crédito.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-[hsl(var(--foreground))]"
            htmlFor="name"
          >
            Nome
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Seu nome ou da empresa"
            required
            disabled={isSubmitting}
            className="h-11 rounded-lg border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 transition-all duration-200 placeholder:text-[hsl(var(--muted-foreground))]/70 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50"
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-[hsl(var(--foreground))]"
            htmlFor="email"
          >
            E-mail
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="voce@empresa.com"
            required
            disabled={isSubmitting}
            className="h-11 rounded-lg border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 transition-all duration-200 placeholder:text-[hsl(var(--muted-foreground))]/70 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50"
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-[hsl(var(--foreground))]"
            htmlFor="password"
          >
            Senha
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            disabled={isSubmitting}
            className="h-11 rounded-lg border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 transition-all duration-200 placeholder:text-[hsl(var(--muted-foreground))]/70 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:border-sky-500/50"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white font-medium shadow-lg shadow-sky-500/20 hover:opacity-95 hover:shadow-sky-500/25 transition-all duration-200 disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Criar conta grátis"
        )}
      </Button>

      <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-sky-400 hover:text-sky-300 transition-colors"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
