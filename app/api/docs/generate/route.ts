import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/project-permissions";

export async function POST(req: Request) {
  try {
    // Verifica autenticação
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Não autorizado", { status: 401 });
    }

    const { projectId, docType } = await req.json();

    if (!projectId || !docType) {
      return new Response("projectId e docType são obrigatórios", {
        status: 400,
      });
    }

    // Verifica acesso ao projeto
    const { hasAccess } = await hasProjectAccess(projectId);
    if (!hasAccess) {
      return new Response("Você não tem acesso a este projeto", {
        status: 403,
      });
    }

    // Busca dados do projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sections: {
          where: {
            type: { in: ["CONTEXT", "SCOPE"] },
          },
        },
        tasks: {
          select: {
            title: true,
            description: true,
            status: true,
            priority: true,
          },
          orderBy: { listOrder: "asc" },
        },
      },
    });

    if (!project) {
      return new Response("Projeto não encontrado", { status: 404 });
    }

    const contextSection = project.sections.find((s) => s.type === "CONTEXT");
    const scopeSection = project.sections.find((s) => s.type === "SCOPE");

    // Monta o contexto do projeto
    const projectContext = `
**Nome do Projeto:** ${project.name}
**Descrição:** ${project.description || "Não informado"}
**Tipo:** ${project.type}
**Status:** ${project.status}
${project.clientName ? `**Cliente:** ${project.clientName}` : ""}

**Contexto:**
${contextSection?.content || "Não informado"}

**Escopo:**
${scopeSection?.content || "Não informado"}

**Tarefas do Projeto:**
${project.tasks.length > 0 ? project.tasks.map((t, i) => `${i + 1}. **${t.title}** (${t.status}, ${t.priority})${t.description ? `\n   ${t.description}` : ""}`).join("\n") : "Nenhuma tarefa cadastrada"}
`;

    // Define o prompt baseado no tipo de doc
    const prompts = {
      "README_TECHNICAL": `Você é um Tech Writer experiente. Crie um README técnico profissional em Markdown para este projeto de software.

Use o contexto abaixo e gere uma documentação completa incluindo:
- Título e descrição do projeto
- Tecnologias utilizadas (inferir do contexto)
- Estrutura do projeto
- Como instalar e configurar
- Como executar
- Scripts disponíveis
- Estrutura de pastas
- Variáveis de ambiente
- Dependências
- Contribuindo
- Licença (se aplicável)

Formate estritamente em Markdown profissional com:
- Títulos hierárquicos (# ## ###)
- Listas ordenadas e não ordenadas
- Code blocks com syntax highlighting
- Tabelas quando apropriado
- Links e referências

**Contexto do Projeto:**
${projectContext}

Gere APENAS o conteúdo Markdown, sem explicações adicionais.`,

      "USER_MANUAL": `Você é um Tech Writer experiente. Crie um Manual do Usuário profissional em Markdown para este projeto.

Use o contexto abaixo e gere uma documentação focada no usuário final incluindo:
- Introdução ao produto
- Como começar
- Funcionalidades principais
- Guia passo a passo de uso
- Screenshots/ilustrações (descreva onde devem ir)
- Perguntas frequentes (FAQ)
- Troubleshooting
- Suporte

Formate estritamente em Markdown profissional com:
- Títulos hierárquicos (# ## ###)
- Listas ordenadas e não ordenadas
- Code blocks quando necessário
- Tabelas quando apropriado
- Links e referências

**Contexto do Projeto:**
${projectContext}

Gere APENAS o conteúdo Markdown, sem explicações adicionais.`,

      "EXECUTIVE_SUMMARY": `Você é um Tech Writer experiente. Crie um Resumo Executivo profissional em Markdown para este projeto.

Use o contexto abaixo e gere uma documentação executiva incluindo:
- Visão geral do projeto
- Objetivos e metas
- Escopo e entregas
- Status atual
- Próximos passos
- Riscos e desafios
- Conclusão

Formate estritamente em Markdown profissional com:
- Títulos hierárquicos (# ## ###)
- Listas ordenadas e não ordenadas
- Tabelas quando apropriado
- Destaques e callouts

**Contexto do Projeto:**
${projectContext}

Gere APENAS o conteúdo Markdown, sem explicações adicionais.`,
    };

    const prompt = prompts[docType as keyof typeof prompts];
    if (!prompt) {
      return new Response("Tipo de documento inválido", { status: 400 });
    }

    // Configura Gemini
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("API Key do Google Gemini não configurada", {
        status: 500,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Cria stream usando ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await model.generateContentStream(prompt);
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              // Envia cada chunk imediatamente para efeito de streaming
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          
          controller.close();
        } catch (error: any) {
          console.error("Erro no stream:", error);
          
          // Mensagens amigáveis para erros específicos
          let errorMessage = "Erro ao gerar documentação";
          if (error?.message?.includes("quota") || error?.message?.includes("QUOTA")) {
            errorMessage = "Limite de cota da API excedido. Tente novamente mais tarde.";
          } else if (error?.message?.includes("network") || error?.message?.includes("fetch") || error?.message?.includes("ECONNREFUSED")) {
            errorMessage = "Erro de conexão com a API. Verifique sua internet e tente novamente.";
          } else if (error?.status === 429 || error?.message?.includes("rate limit")) {
            errorMessage = "Muitas requisições. Aguarde alguns instantes e tente novamente.";
          }
          
          controller.enqueue(encoder.encode(`\n\n---\n\n**Erro:** ${errorMessage}`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar documentação:", error);
    
    // Mensagens amigáveis para erros comuns
    let errorMessage = "Erro ao gerar documentação";
    if (error instanceof Error) {
      if (error.message.includes("quota") || error.message.includes("QUOTA")) {
        errorMessage = "Limite de cota da API excedido. Tente novamente mais tarde.";
      } else if (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Erro de conexão com a API. Verifique sua internet e tente novamente.";
      } else if (error.message.includes("429") || error.message.includes("rate limit")) {
        errorMessage = "Muitas requisições. Aguarde alguns instantes e tente novamente.";
      }
    }
    
    return new Response(errorMessage, { status: 500 });
  }
}
