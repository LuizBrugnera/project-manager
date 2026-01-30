/** Opções de tema para o modal de geração (preview). Fora de actions.ts para evitar "use server" exportar não-async. */
export const TASK_GENERATION_THEME_OPTIONS = [
  { value: "Stacks e ambiente", label: "Stacks e ambiente" },
  { value: "Back-end", label: "Back-end" },
  { value: "Autenticação", label: "Autenticação" },
  { value: "Frontend", label: "Frontend" },
  { value: "Integração", label: "Integração" },
  { value: "Refinamento", label: "Refinamento" },
] as const;
