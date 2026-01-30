import { TaskStatus } from "@prisma/client";

/**
 * Calcula a porcentagem de conclusão do projeto baseado nas tasks
 */
export function calculateProjectProgress(tasks: { status: TaskStatus }[]): number {
  if (tasks.length === 0) return 0;

  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const percentage = Math.round((doneTasks / tasks.length) * 100);

  return Math.min(100, Math.max(0, percentage));
}

/**
 * Formata uma data para exibição
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "Não definido";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Formata uma data para input HTML
 */
export function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
