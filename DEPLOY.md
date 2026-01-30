# Primeiro início do projeto (produção)

Ordem dos comandos para subir o projeto pela primeira vez em ambiente de produção.

## 1. Instalar dependências

```bash
npm install
```

(O `postinstall` já roda `prisma generate`.)

## 2. Configurar ambiente

Crie o arquivo `.env` na raiz com as variáveis de **produção**:

- `DATABASE_URL` – conexão MySQL do servidor de produção
- `JWT_SECRET` – segredo forte (ex.: `openssl rand -base64 32`)

Opcional: `GOOGLE_GEMINI_API_KEY` se for usar IA.

## 3. Aplicar migrations no banco de produção

```bash
npx prisma migrate deploy
```

Em produção use sempre `migrate deploy` (aplica migrations existentes). Não use `migrate dev` (é para desenvolvimento e pode pedir confirmações).

## 4. Build

```bash
npm run build
```

## 5. Iniciar o app

```bash
npm run start
```

O script sobe na porta **3012**. Para outra porta: `next start -p SUA_PORTA`.

---

## Resumo (copiar e colar)

```bash
npm install
# Configurar .env (DATABASE_URL, JWT_SECRET)
npx prisma migrate deploy
npm run build
npm run start
```

---

## Dica

Em servidor (PM2, systemd, Docker etc.), use `npm run start` como comando de start. O build deve ser feito antes (no CI/CD ou no deploy).
