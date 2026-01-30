"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";
import { createActivity } from "@/lib/activity-log";
import { serverLog } from "@/lib/server-log";
import type { TaskStatus, TaskPriority } from "@prisma/client";

// ========== CREATE ==========
export async function createTaskAction(
  projectId: string,
  title: string,
  status: TaskStatus = "BACKLOG"
) {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado." };
  }

  if (!title.trim()) {
    return { success: false as const, error: "Título é obrigatório" };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(projectId);
  if (!hasAccess) {
    return { success: false as const, error: "Você não tem acesso a este projeto." };
  }

  // Pega a maior ordem na coluna para adicionar no final
  const maxOrder = await prisma.task.aggregate({
    where: { projectId, status },
    _max: { listOrder: true },
  });

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      projectId,
      status,
      listOrder: (maxOrder._max.listOrder ?? -1) + 1,
    },
  });

  // Cria log de atividade
  await createActivity({
    type: "TASK_CREATED",
    action: "criou uma task",
    message: `${user.name} criou a task "${title.trim()}"`,
    projectId,
    entityId: task.id,
    entityType: "TASK",
  });

  revalidatePath(`/projects/${projectId}/tasks`);

  return { success: true as const, task };
}

// ========== UPDATE ==========
export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedUserId?: string | null;
  }
) {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado." };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, title: true, status: true },
  });

  if (!task) {
    return { success: false as const, error: "Task não encontrada" };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(task.projectId);
  if (!hasAccess) {
    return { success: false as const, error: "Você não tem acesso a este projeto." };
  }

  const oldStatus = task.status;
  const newStatus = data.status;

  await prisma.task.update({
    where: { id: taskId },
    data,
  });

  // Cria log de atividade
  const taskTitle = data.title || task.title;
  if (newStatus && newStatus !== oldStatus) {
    if (newStatus === "DONE") {
      await createActivity({
        type: "TASK_COMPLETED",
        action: "concluiu uma task",
        message: `${user.name} concluiu a task "${taskTitle}"`,
        projectId: task.projectId,
        entityId: taskId,
        entityType: "TASK",
      });
    } else {
      const statusLabels: Record<string, string> = {
        BACKLOG: "Backlog",
        TODO: "A Fazer",
        IN_PROGRESS: "Em Progresso",
        TESTING: "Testes",
        DONE: "Concluído",
      };
      await createActivity({
        type: "TASK_MOVED",
        action: "moveu uma task",
        message: `${user.name} moveu a task "${taskTitle}" para ${statusLabels[newStatus] || newStatus}`,
        projectId: task.projectId,
        entityId: taskId,
        entityType: "TASK",
      });
    }
  } else if (data.assignedUserId !== undefined && data.assignedUserId) {
    await createActivity({
      type: "TASK_ASSIGNED",
      action: "atribuiu uma task",
      message: `${user.name} atribuiu a task "${taskTitle}"`,
      projectId: task.projectId,
      entityId: taskId,
      entityType: "TASK",
    });
  } else if (data.title || data.description || data.priority) {
    await createActivity({
      type: "TASK_UPDATED",
      action: "atualizou uma task",
      message: `${user.name} atualizou a task "${taskTitle}"`,
      projectId: task.projectId,
      entityId: taskId,
      entityType: "TASK",
    });
  }

  revalidatePath(`/projects/${task.projectId}/tasks`);

  return { success: true as const };
}

// ========== DELETE ==========
export async function deleteTaskAction(taskId: string) {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado." };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) {
    return { success: false as const, error: "Task não encontrada" };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(task.projectId);
  if (!hasAccess) {
    return { success: false as const, error: "Você não tem acesso a este projeto." };
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath(`/projects/${task.projectId}/tasks`);

  return { success: true as const };
}

// ========== MOVE (Drag & Drop) ==========
export async function moveTaskAction(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
) {
  // Verifica autenticação
  const user = await getCurrentUser();
  if (!user) {
    return { success: false as const, error: "Você precisa estar logado." };
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, status: true, listOrder: true },
  });

  if (!task) {
    return { success: false as const, error: "Task não encontrada" };
  }

  // Verifica acesso ao projeto
  const { hasAccess } = await hasProjectAccess(task.projectId);
  if (!hasAccess) {
    return { success: false as const, error: "Você não tem acesso a este projeto." };
  }

  const oldStatus = task.status;
  const oldOrder = task.listOrder;

  // Se mudou de coluna
  if (oldStatus !== newStatus) {
    // Atualiza ordens na coluna antiga (decrementa itens após o removido)
    await prisma.task.updateMany({
      where: {
        projectId: task.projectId,
        status: oldStatus,
        listOrder: { gt: oldOrder },
      },
      data: {
        listOrder: { decrement: 1 },
      },
    });

    // Atualiza ordens na nova coluna (incrementa itens a partir da nova posição)
    await prisma.task.updateMany({
      where: {
        projectId: task.projectId,
        status: newStatus,
        listOrder: { gte: newOrder },
      },
      data: {
        listOrder: { increment: 1 },
      },
    });

    // Move a task
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        listOrder: newOrder,
      },
    });
  } else {
    // Mesma coluna, só reordena
    if (newOrder > oldOrder) {
      // Movendo para baixo
      await prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          status: oldStatus,
          listOrder: { gt: oldOrder, lte: newOrder },
        },
        data: {
          listOrder: { decrement: 1 },
        },
      });
    } else if (newOrder < oldOrder) {
      // Movendo para cima
      await prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          status: oldStatus,
          listOrder: { gte: newOrder, lt: oldOrder },
        },
        data: {
          listOrder: { increment: 1 },
        },
      });
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { listOrder: newOrder },
    });
  }

  revalidatePath(`/projects/${task.projectId}/tasks`);

  return { success: true as const };
}

// ========== GENERATE TASKS WITH AI (por fases/temas) ==========

const GENERATION_PHASES: { tag: string; instruction: string }[] = [
  {
    tag: "Stacks e ambiente",
    instruction:
      "Foque em stacks, ferramentas e ambiente: linguagens, frameworks, versões, IDE, Docker, env vars, scripts, repositório e tudo que define o ambiente de desenvolvimento e produção.",
  },
  {
    tag: "Back-end",
    instruction:
      "Foque em back-end: APIs, modelagem de dados, regras de negócio, endpoints, serviços, camada de persistência, migrações e integrações server-side.",
  },
  {
    tag: "Autenticação",
    instruction:
      "Foque em autenticação e autorização: login, logout, sessão, tokens, perfis, permissões, recuperação de senha e segurança.",
  },
  {
    tag: "Frontend",
    instruction:
      "Foque em frontend: telas, componentes, fluxos de UI, formulários, navegação, estado da aplicação e experiência do usuário.",
  },
  {
    tag: "Integração",
    instruction:
      "Foque em integração: comunicação front-back, APIs externas, webhooks, deploy, CI/CD, monitoramento e conciliação de sistemas.",
  },
  {
    tag: "Refinamento",
    instruction:
      "Foque em refinamento: testes (unitários, integração, E2E), documentação, revisão de código, acessibilidade, performance e ajustes finais.",
  },
];

function extractJsonFromGeminiResponse(text: string): string {
  let out = text.trim();
  if (out.includes("```json")) {
    out = out.split("```json")[1].split("```")[0].trim();
  } else if (out.includes("```")) {
    out = out.split("```")[1].split("```")[0].trim();
  }
  return out;
}

function handleGeminiError(err: unknown): { success: false; error: string } | null {
  const msg = err instanceof Error ? err.message : String(err);
  const causeMsg = (err as { cause?: { message?: string } })?.cause?.message ?? "";
  const full = [msg, causeMsg].filter(Boolean).join(" ");
  const low = full.toLowerCase();
  const any = err as { status?: number; cause?: unknown };
  serverLog.debug("handleGeminiError:", err);
  serverLog.error("[generateTasksAction] Gemini API error:", msg);
  if (any.status != null) serverLog.error("[generateTasksAction] HTTP status:", any.status);
  if (any.cause) serverLog.error("[generateTasksAction] cause:", any.cause);

  if (
    any.status === 400 ||
    any.status === 401 ||
    any.status === 403 ||
    low.includes("api key") ||
    low.includes("api_key") ||
    low.includes("invalid_argument") ||
    low.includes("permission_denied") ||
    low.includes("invalid api key") ||
    low.includes("api key not valid")
  ) {
    return {
      success: false as const,
      error:
        "Chave da API Gemini inválida ou sem permissão. Verifique GOOGLE_GEMINI_API_KEY no .env e o acesso em https://aistudio.google.com/app/apikey",
    };
  }
  if (low.includes("quota") || low.includes("resource_exhausted")) {
    return { success: false as const, error: "Limite de cota da API excedido. Tente novamente mais tarde." };
  }
  if (any.status === 429 || low.includes("429") || low.includes("rate limit")) {
    return { success: false as const, error: "Muitas requisições. Aguarde alguns instantes e tente novamente." };
  }
  if (
    low.includes("network") ||
    low.includes("fetch") ||
    low.includes("econnrefused") ||
    low.includes("enotfound") ||
    low.includes("etimedout") ||
    low.includes("fetch failed")
  ) {
    return {
      success: false as const,
      error:
        "Erro de conexão com a API Gemini. Verifique sua internet, firewall/proxy e se https://generativelanguage.googleapis.com está acessível.",
    };
  }
  return null;
}

export async function generateTasksAction(projectId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false as const, error: "Você precisa estar logado." };
    }

    const { hasAccess } = await hasProjectAccess(projectId);
    if (!hasAccess) {
      return { success: false as const, error: "Você não tem acesso a este projeto." };
    }

    const apiKey = "AIzaSyBaN_KDXtFJQolUtpwhLgSrf7onH0cWmRc";
    if (!apiKey) {
      return { success: false as const, error: "API Key do Google Gemini não configurada" };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sections: true,
      },
    });

    if (!project) {
      return { success: false as const, error: "Projeto não encontrado" };
    }

    const contextSection = project.sections.find((s) => s.type === "CONTEXT");
    const scopeSection = project.sections.find((s) => s.type === "SCOPE");
    const rolesSection = project.sections.find((s) => s.type === "ROLES");
    const archSections = project.sections.filter((s) =>
      ["BACKEND_MODELAGEM", "BACKEND_DIAGRAMAS", "BACKEND_ARQUITETURA", "FRONTEND_FLUXO", "FRONTEND_UI_DESIGN", "FRONTEND_PROTOTIPO"].includes(s.type)
    );

    if (!contextSection && !scopeSection) {
      return {
        success: false as const,
        error: "É necessário preencher pelo menos Contexto ou Escopo do projeto",
      };
    }

    const section = (title: string, content: string | undefined) =>
      content?.trim() ? `**${title}:**\n${content.trim()}` : "";
    const projectContext = [
      section("CONTEXTO", contextSection?.content),
      section("ESCOPO", scopeSection?.content),
      section("PAPÉIS E RESPONSABILIDADES", rolesSection?.content),
      ...archSections.map((s) => section(s.title, s.content)),
    ]
      .filter(Boolean)
      .join("\n\n");

    serverLog.debug("[generateTasksAction] ========== ENTRADA ==========");
    serverLog.debug("[generateTasksAction] projectId:", projectId);
    serverLog.debug("[generateTasksAction] ---------- CONTEXTO DO PROJETO (usado em todas as fases) ----------");
    serverLog.debug("[generateTasksAction]", projectContext);

    const modelId = "gemini-2.5-flash";//process.env.GEMINI_MODEL || "gemini-1.5-flash-latest";
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    serverLog.debug("[generateTasksAction] modelId:", modelId);

    const maxOrderResult = await prisma.task.aggregate({
      where: { projectId, status: "BACKLOG" },
      _max: { listOrder: true },
    });
    let currentOrder = (maxOrderResult._max.listOrder ?? -1) + 1;
    const allCreated: Awaited<ReturnType<typeof prisma.task.create>>[] = [];

    for (const phase of GENERATION_PHASES) {
      const prompt = `Você é um Tech Lead experiente. Com base no contexto do projeto abaixo, gere tarefas técnicas APENAS para o tema: **${phase.tag}**.

${phase.instruction}

**CONTEXTO DO PROJETO:**
${projectContext}

Gere tarefas suficientes para cobrir TODO o contexto do projeto relacionado a esse tema. Seja específico e técnico. Tarefas pequenas e executáveis.

Retorne APENAS um JSON válido:
{
  "tasks": [
    {
      "title": "Título claro da tarefa",
      "description": "Descrição detalhada do que fazer"
    }
  ]
}`;

      serverLog.debug("[generateTasksAction] ---------- FASE:", phase.tag, "----------");
      serverLog.debug("[generateTasksAction] INSTRUÇÃO:", phase.instruction);
      serverLog.debug("[generateTasksAction] PROMPT COMPLETO:", prompt);

      let text: string;
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        serverLog.debug("[generateTasksAction] RESPOSTA FASE", phase.tag + ":", text);
      } catch (apiErr) {
        serverLog.error("[generateTasksAction] apiErr fase", phase.tag + ":", apiErr);
        const friendly = handleGeminiError(apiErr);
        if (friendly) return friendly;
        throw apiErr;
      }

      const jsonText = extractJsonFromGeminiResponse(text);
      serverLog.debug("[generateTasksAction] jsonText extraído:", jsonText);
      let parsed: { tasks?: { title: string; description?: string }[] };
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        return {
          success: false as const,
          error: `A IA não retornou JSON válido na fase "${phase.tag}". Tente novamente.`,
        };
      }

      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      for (const t of tasks) {
        const title = String(t?.title ?? "").trim();
        if (!title) continue;
        const task = await prisma.task.create({
          data: {
            title,
            description: (t?.description && String(t.description).trim()) || null,
            projectId,
            status: "BACKLOG",
            priority: "MEDIUM",
            listOrder: currentOrder++,
            tag: phase.tag,
          },
        });
        allCreated.push(task);
      }
    }

    revalidatePath(`/projects/${projectId}/tasks`);

    return {
      success: true as const,
      count: allCreated.length,
      tasks: allCreated,
    };
  } catch (error) {
    serverLog.error("Erro ao gerar tasks com IA:", error);
    const friendly = handleGeminiError(error);
    if (friendly) return friendly;
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false as const,
      error:
        process.env.NODE_ENV === "development"
          ? `Falha na API Gemini: ${msg.slice(0, 200)}. Veja o terminal para mais detalhes.`
          : "Erro ao gerar tarefas. Tente novamente ou verifique GOOGLE_GEMINI_API_KEY e a conexão.",
    };
  }
}

type PreviewTask = { id: string; title: string; description: string | null };

async function getProjectContextForGeneration(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { sections: true },
  });
  if (!project) return { error: "Projeto não encontrado" as const };
  const contextSection = project.sections.find((s) => s.type === "CONTEXT");
  const scopeSection = project.sections.find((s) => s.type === "SCOPE");
  const rolesSection = project.sections.find((s) => s.type === "ROLES");
  const archSections = project.sections.filter((s) =>
    ["BACKEND_MODELAGEM", "BACKEND_DIAGRAMAS", "BACKEND_ARQUITETURA", "FRONTEND_FLUXO", "FRONTEND_UI_DESIGN", "FRONTEND_PROTOTIPO"].includes(s.type)
  );
  if (!contextSection && !scopeSection) {
    return { error: "É necessário preencher pelo menos Contexto ou Escopo do projeto" as const };
  }
  const section = (title: string, content: string | undefined) =>
    content?.trim() ? `**${title}:**\n${content.trim()}` : "";
  const projectContext = [
    section("CONTEXTO", contextSection?.content),
    section("ESCOPO", scopeSection?.content),
    section("PAPÉIS E RESPONSABILIDADES", rolesSection?.content),
    ...archSections.map((s) => section(s.title, s.content)),
  ]
    .filter(Boolean)
    .join("\n\n");
  return { projectContext };
}

/** Gera tasks em preview (sem salvar). theme = tag de uma fase ou "custom"; se custom, customThemeLabel obrigatório. */
export async function generateTasksPreviewAction(
  projectId: string,
  theme: string,
  customThemeLabel: string | null,
  optionalText: string | null
): Promise<
  | { success: true; tasks: PreviewTask[]; tag: string }
  | { success: false; error: string }
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Você precisa estar logado." };
    const { hasAccess } = await hasProjectAccess(projectId);
    if (!hasAccess) return { success: false, error: "Você não tem acesso a este projeto." };
    const apiKey = "AIzaSyBaN_KDXtFJQolUtpwhLgSrf7onH0cWmRc";//"AIzaSyBaN_KDXtFJQolUtpwhLgSrf7onH0cWmRc";
    if (!apiKey) return { success: false, error: "API Key do Google Gemini não configurada" };

    const ctx = await getProjectContextForGeneration(projectId);
    if ("error" in ctx) return { success: false, error: ctx.error ?? "Erro ao carregar contexto." };

    const isCustom = theme === "custom";
    const tag = isCustom ? (customThemeLabel?.trim() || "Custom") : theme;
    const phase = GENERATION_PHASES.find((p) => p.tag === theme);
    const instruction = phase
      ? phase.instruction
      : `Foque no tema "${tag}". Gere tarefas técnicas que cubram o contexto do projeto para esse tema.`;

    const extra = optionalText?.trim() ? `\n\n**INSTRUÇÕES ADICIONAIS:**\n${optionalText.trim()}` : "";
    const prompt = `Você é um Tech Lead experiente. Com base no contexto do projeto abaixo, gere tarefas técnicas APENAS para o tema: **${tag}**.

${instruction}
${extra}

**CONTEXTO DO PROJETO:**
${ctx.projectContext}

Gere tarefas suficientes para cobrir o contexto do projeto relacionado a esse tema. Seja específico e técnico. Tarefas pequenas e executáveis.

Retorne APENAS um JSON válido:
{
  "tasks": [
    {
      "title": "Título claro da tarefa",
      "description": "Descrição detalhada do que fazer"
    }
  ]
}`;

    serverLog.debug("[generateTasksPreviewAction] ========== ENTRADA ==========");
    serverLog.debug("[generateTasksPreviewAction] projectId:", projectId);
    serverLog.debug("[generateTasksPreviewAction] theme:", theme, "| tag:", tag);
    serverLog.debug("[generateTasksPreviewAction] optionalText:", optionalText ?? "(vazio)");
    serverLog.debug("[generateTasksPreviewAction] INSTRUÇÃO DA FASE:", instruction);
    serverLog.debug("[generateTasksPreviewAction] ---------- CONTEXTO DO PROJETO ----------");
    serverLog.debug("[generateTasksPreviewAction]", ctx.projectContext);
    serverLog.debug("[generateTasksPreviewAction] ---------- PROMPT COMPLETO ENVIADO AO GEMINI ----------");
    serverLog.debug("[generateTasksPreviewAction]", prompt);

    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    serverLog.debug("[generateTasksPreviewAction] modelId:", modelId);

    let text: string;
    try {
      const result = await model.generateContent(prompt);
      text = (await result.response).text();
      serverLog.debug("[generateTasksPreviewAction] ---------- RESPOSTA DO GEMINI ----------");
      serverLog.debug("[generateTasksPreviewAction]", text);
    } catch (apiErr) {
      const friendly = handleGeminiError(apiErr);
      if (friendly) return { success: false, error: friendly.error };
      serverLog.error("generateTasksPreviewAction:", apiErr);
      throw apiErr;
    }

    const jsonText = extractJsonFromGeminiResponse(text);
    let parsed: { tasks?: { title: string; description?: string }[] };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { success: false, error: "A IA não retornou JSON válido. Tente novamente." };
    }

    const list = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const tasks: PreviewTask[] = [];
    for (const t of list) {
      const title = String(t?.title ?? "").trim();
      if (!title) continue;
      tasks.push({
        id: `preview-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        description: (t?.description && String(t.description).trim()) || null,
      });
    }

    return { success: true, tasks, tag };
  } catch (e) {
    serverLog.error("generateTasksPreviewAction:", e);
    const friendly = handleGeminiError(e);
    if (friendly) return { success: false, error: friendly.error };
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erro ao gerar preview.",
    };
  }
}

/** Regera uma única task em preview (sem salvar). */
export async function regenerateSingleTaskPreviewAction(
  projectId: string,
  theme: string,
  customThemeLabel: string | null,
  optionalText: string | null,
  currentTitle: string,
  currentDescription: string | null
): Promise<
  | { success: true; task: { title: string; description: string | null } }
  | { success: false; error: string }
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Você precisa estar logado." };
    const { hasAccess } = await hasProjectAccess(projectId);
    if (!hasAccess) return { success: false, error: "Você não tem acesso a este projeto." };
    const apiKey = "AIzaSyBaN_KDXtFJQolUtpwhLgSrf7onH0cWmRc";
    if (!apiKey) return { success: false, error: "API Key do Google Gemini não configurada" };

    const ctx = await getProjectContextForGeneration(projectId);
    if ("error" in ctx) return { success: false, error: ctx.error ?? "Erro ao carregar contexto." };

    const isCustom = theme === "custom";
    const tag = isCustom ? (customThemeLabel?.trim() || "Custom") : theme;
    const phase = GENERATION_PHASES.find((p) => p.tag === theme);
    const instruction = phase
      ? phase.instruction
      : `Foque no tema "${tag}". Gere uma única tarefa técnica que cubra o contexto do projeto para esse tema.`;

    const extra = optionalText?.trim() ? `\n\n**INSTRUÇÕES ADICIONAIS:**\n${optionalText.trim()}` : "";
    const desc = currentDescription?.trim() ? `\nDescrição: ${currentDescription}` : "";
    const prompt = `Você é um Tech Lead. Regenere UMA única tarefa técnica que SUBSTITUA a seguinte, no mesmo tema e nível de detalhe.

Tema: **${tag}**.
${instruction}
${extra}

**CONTEXTO DO PROJETO:**
${ctx.projectContext}

**TAREFA ATUAL A SUBSTITUIR:**
Título: ${currentTitle}${desc}

Retorne APENAS um JSON válido com uma única tarefa:
{
  "tasks": [
    {
      "title": "Novo título",
      "description": "Nova descrição"
    }
  ]
}`;

    serverLog.debug("[regenerateSingleTaskPreviewAction] ========== ENTRADA ==========");
    serverLog.debug("[regenerateSingleTaskPreviewAction] projectId:", projectId, "| theme:", theme, "| tag:", tag);
    serverLog.debug("[regenerateSingleTaskPreviewAction] currentTitle:", currentTitle, "| currentDescription:", currentDescription ?? "(vazio)");
    serverLog.debug("[regenerateSingleTaskPreviewAction] INSTRUÇÃO:", instruction);
    serverLog.debug("[regenerateSingleTaskPreviewAction] ---------- CONTEXTO DO PROJETO ----------");
    serverLog.debug("[regenerateSingleTaskPreviewAction]", ctx.projectContext);
    serverLog.debug("[regenerateSingleTaskPreviewAction] ---------- PROMPT COMPLETO ----------");
    serverLog.debug("[regenerateSingleTaskPreviewAction]", prompt);

    const modelId = "gemini-2.5-flash";
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });

    let text: string;
    try {
      const result = await model.generateContent(prompt);
      text = (await result.response).text();
      serverLog.debug("[regenerateSingleTaskPreviewAction] ---------- RESPOSTA ----------");
      serverLog.debug("[regenerateSingleTaskPreviewAction]", text);
    } catch (apiErr) {
      const friendly = handleGeminiError(apiErr);
      if (friendly) return { success: false, error: friendly.error };
      throw apiErr;
    }

    const jsonText = extractJsonFromGeminiResponse(text);
    let parsed: { tasks?: { title: string; description?: string }[] };
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return { success: false, error: "A IA não retornou JSON válido. Tente novamente." };
    }

    const list = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const first = list[0];
    const title = first && String(first?.title ?? "").trim();
    if (!title) return { success: false, error: "A IA não retornou uma tarefa válida." };

    return {
      success: true,
      task: {
        title,
        description: (first?.description && String(first.description).trim()) || null,
      },
    };
  } catch (e) {
    serverLog.error("regenerateSingleTaskPreviewAction:", e);
    const friendly = handleGeminiError(e);
    if (friendly) return { success: false, error: friendly.error };
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erro ao regenerar.",
    };
  }
}

/** Persiste no projeto apenas as tasks selecionadas (mantidas) a partir do preview. */
export async function createTasksFromPreviewAction(
  projectId: string,
  tag: string,
  tasks: { title: string; description: string | null }[]
): Promise<
  | { success: true; count: number; tasks: Awaited<ReturnType<typeof prisma.task.create>>[] }
  | { success: false; error: string }
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Você precisa estar logado." };
    const { hasAccess } = await hasProjectAccess(projectId);
    if (!hasAccess) return { success: false, error: "Você não tem acesso a este projeto." };

    const maxOrder = await prisma.task.aggregate({
      where: { projectId, status: "BACKLOG" },
      _max: { listOrder: true },
    });
    let order = (maxOrder._max.listOrder ?? -1) + 1;
    const created: Awaited<ReturnType<typeof prisma.task.create>>[] = [];

    for (const t of tasks) {
      const title = t.title.trim();
      if (!title) continue;
      const task = await prisma.task.create({
        data: {
          title,
          description: t.description?.trim() || null,
          projectId,
          status: "BACKLOG",
          priority: "MEDIUM",
          listOrder: order++,
          tag,
        },
      });
      created.push(task);
    }

    if (created.length) {
      await createActivity({
        type: "TASK_CREATED",
        action: "criou tasks",
        message: `${user.name} adicionou ${created.length} task(s) ao backlog (geração com IA)`,
        projectId,
        entityType: "TASK",
      });
    }

    revalidatePath(`/projects/${projectId}/tasks`);
    return { success: true, count: created.length, tasks: created };
  } catch (e) {
    serverLog.error("createTasksFromPreviewAction:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erro ao criar tasks.",
    };
  }
}
