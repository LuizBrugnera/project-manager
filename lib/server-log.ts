/**
 * Logger para Server Actions: escreve em arquivo .txt para você ver os logs
 * que rodam no servidor ("use server") e não aparecem no console do browser.
 *
 * Arquivo: logs/task-actions-debug.txt (na raiz do projeto)
 * Ative com: DEBUG_TASK_ACTIONS=1 ou em NODE_ENV=development (sempre grava).
 */

import fs from "fs";
import path from "path";

const LOG_DIR = "logs";
const LOG_FILE = "task-actions-debug.txt";
const MAX_STRINGIFY_LENGTH = 8000;

function getLogPath(): string {
  const base = process.cwd();
  return path.join(base, LOG_DIR, LOG_FILE);
}

function ensureLogDir(): void {
  const dir = path.join(process.cwd(), LOG_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  try {
    const s = JSON.stringify(value, null, 2);
    return s.length > MAX_STRINGIFY_LENGTH ? s.slice(0, MAX_STRINGIFY_LENGTH) + "\n...[truncado]" : s;
  } catch {
    return String(value);
  }
}

function line(level: string, args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const message = args.map(formatValue).join(" ");
  return `[${timestamp}] [${level}] ${message}\n`;
}

function shouldWrite(): boolean {
  if (process.env.DEBUG_TASK_ACTIONS === "1") return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}

function writeToFile(level: string, args: unknown[]): void {
  if (!shouldWrite()) return;
  try {
    ensureLogDir();
    const filePath = getLogPath();
    fs.appendFileSync(filePath, line(level, args), "utf8");
  } catch (err) {
    // fallback: pelo menos no stderr do servidor
    process.stderr?.write?.(`[server-log] falha ao escrever arquivo: ${err}\n`);
  }
}

/** Log de debug (equivalente a console.log) – grava em logs/task-actions-debug.txt */
export function serverLogDebug(...args: unknown[]): void {
  writeToFile("DEBUG", args);
}

/** Log de erro (equivalente a console.error) – grava em logs/task-actions-debug.txt */
export function serverLogError(...args: unknown[]): void {
  writeToFile("ERROR", args);
}

/** Objeto com os dois métodos para usar no actions: serverLog.debug(...) e serverLog.error(...) */
export const serverLog = {
  debug: serverLogDebug,
  error: serverLogError,
};
