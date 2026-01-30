/**
 * Adiciona a coluna `tag` na tabela Task (migração manual).
 * Rode: node scripts/add-task-tag.mjs
 * Requer .env com DATABASE_URL na raiz do projeto.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.error("Arquivo .env não encontrado na raiz do projeto.");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] = val;
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida no .env");
  process.exit(1);
}

const prisma = new PrismaClient();
const sql = "ALTER TABLE `Task` ADD COLUMN `tag` VARCHAR(191) NULL";

async function main() {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("Coluna Task.tag adicionada com sucesso.");
  } catch (e) {
    const msg = e?.message || String(e);
    if (msg.includes("Duplicate column") || msg.includes("duplicate column")) {
      console.log("Coluna Task.tag já existe. Nada a fazer.");
    } else {
      console.error("Erro ao adicionar coluna:", msg);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
