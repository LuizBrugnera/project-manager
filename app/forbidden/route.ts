import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>403 - Acesso negado</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#0b0b0f; color:#e5e7eb; margin:0; }
      .wrap { max-width: 720px; margin: 10vh auto; padding: 24px; }
      .card { border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 20px; background: rgba(255,255,255,.03); }
      a { color:#38bdf8; text-decoration:none; }
      a:hover { text-decoration:underline; }
      .muted { color: rgba(229,231,235,.7); }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1 style="margin:0 0 8px 0;">403 — Acesso negado</h1>
        <p class="muted" style="margin:0 0 16px 0;">
          Você não tem permissão para acessar este recurso.
        </p>
        <p style="margin:0;">
          Voltar para o <a href="/dashboard">Dashboard</a>
        </p>
      </div>
    </div>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

