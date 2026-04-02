# Web app Tenebra OT: contas e personagens (base `tibia`)

Aplicação própria (sem PHP / MyAAC / Znote): **API Node (Fastify)** + **cliente PWA (Vite)** para **Tenebra OT**. Senhas em **SHA1** (alinhado a `passwordType` no TFS). IDs de `accounts` e `players` gerados com **`LOCK TABLES` + `MAX(id)`** quando não há `AUTO_INCREMENT`.

## Portas, proxy e CORS

Referência central: **`webapp/ports.example.env`** — copie os valores para `webapp/server/.env` e `webapp/client/.env` para manter **a mesma porta** na API e no proxy do Vite.

| Serviço | Variável | Valor típico (dev) |
|--------|----------|---------------------|
| API Node | `PORT` | `3847` |
| Vite (site) | `VITE_DEV_CLIENT_PORT` | `5173` |
| Proxy `/api` no Vite | `VITE_DEV_API_HOST`, `VITE_DEV_API_PORT` | `127.0.0.1`, `3847` |

**Desenvolvimento:** abra o site pelo endereço do Vite (ex. `http://localhost:5173`). O navegador só fala com o Vite; os pedidos vão a `/api/...` **no mesmo host**, e o Vite encaminha para a API. **Não há CORS entre origens diferentes** nesse modo.

**Produção:** se o site estático e a API estiverem em **domínios diferentes**, defina `VITE_API_URL` no build do cliente e `CORS_ORIGIN` na API com a origem exata do site (ou `true` só em testes).

## MySQL no Windows (XAMPP / MariaDB) e a API Node

A API costuma rodar **no Windows** enquanto o TFS pode rodar no **WSL** e acessar o MySQL pelo IP do host (`server/config.lua`).

- **`MYSQL_HOST`:** em muitos setups no Windows, use **`localhost`** (named pipe) em vez de `127.0.0.1`. O driver **mysql2** às vezes falha autenticação com `127.0.0.1` contra MariaDB/XAMPP, com mensagem tipo *Access denied for user …@localhost*.
- **Credenciais:** o `.env` deve bater com um usuário que tenha permissão na base **`MYSQL_DATABASE`** (normalmente `tibia`). Pode ser o mesmo usuário do `config.lua` ou um usuário só para a API (ex.: `GRANT` só em `tibia.*`).
- **Segredos:** nunca commite `webapp/server/.env`; use `.env.example` como modelo. O repositório ignora `.env` pelo `.gitignore` na raiz.

## Requisitos

- Node.js 20+
- MySQL/MariaDB com o schema do servidor (ex. `tibia` importada a partir de `server/database.sql`)

## Servidor API (`webapp/server`)

1. Copie `.env.example` para `.env` e ajuste credenciais e `JWT_SECRET`.
2. Instale e suba:

```bash
cd webapp/server
npm install
npm run dev
```

Por padrão escuta em `http://127.0.0.1:3847`.

### Migração SQL (contas: chaves e redefinição de senha)

Execute **uma vez** na base do jogo (ex.: `tibia`), após backup:

- Ficheiro: [`webapp/server/sql/alter-accounts-web-recovery.sql`](webapp/server/sql/alter-accounts-web-recovery.sql)

Sem estas colunas, `POST /api/login` e os fluxos abaixo falham com erro de coluna desconhecida.

### Rotas principais

| Rota | Descrição |
|------|-----------|
| `GET /api/health` | Estado da API |
| `POST /api/register` | Cria conta → `accountId`, `token` |
| `POST /api/login` | Entrar → `token`, `accountId`; na **primeira vez** em que a conta ainda não tinha chaves web, também `recoveryKeys` (array de 5 strings, mostrar uma vez) |
| `POST /api/forgot-password` | Corpo `{ email }` ou `{ email, recoveryKey }`. Com **só e-mail**: resposta **sempre** `{ message }` genérica (não revela se o e-mail existe); se existir conta, envia e-mail com link `/?redefinir=…`. Com **e-mail + chave**: mesma `message` em falha; em sucesso inclui `resetToken` para o cliente abrir o ecrã de nova senha |
| `POST /api/reset-password` | Corpo `{ token, password }` — conclui a redefinição; se o pedido veio de uma chave, essa chave é consumida |
| `GET /api/me`, `GET /api/characters`, `POST /api/characters`, `DELETE /api/characters/:id` | Com `Authorization: Bearer <jwt>` |

### E-mail de redefinição de senha

O envio usa o módulo [`webapp/server/src/email.ts`](webapp/server/src/email.ts). **Escolha do transporte** (por omissão detecta automaticamente):

| Ordem (se `EMAIL_TRANSPORT` não estiver definido) | Variável que activa |
|---------------------------------------------------|---------------------|
| 1. SMTP | `SMTP_HOST` |
| 2. Resend (API HTTP) | `RESEND_API_KEY` |
| 3. Web3Forms (legado) | `WEB3FORMS_ACCESS_KEY` |

Pode forçar com `EMAIL_TRANSPORT=smtp`, `resend`, `web3forms` ou `none` (não envia e-mail; o fluxo «esqueci senha» continua a responder de forma genérica).

**SMTP (recomendado para “só configurar”):** funciona com [Brevo](https://www.brevo.com/) (SMTP relay gratuito com limites), Gmail (senha de app), Outlook, etc. Exemplo típico Brevo: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` e `SMTP_PASSWORD` do painel SMTP, `SMTP_FROM="Nome <email@verificado>"` (o remetente deve estar autorizado no provedor).

**Resend:** crie conta em [resend.com](https://resend.com), defina `RESEND_API_KEY` e `RESEND_FROM` (ex.: `onboarding@resend.dev` em testes ou domínio verificado).

**Web3Forms:** útil só para testes rápidos; limitações conhecidas (destino da mensagem, planos). Ver `WEB3FORMS_*` no `.env.example`.

Defina sempre `WEBAPP_PUBLIC_URL` com o URL **público** do site (sem barra final) — o link no e-mail usa `/?redefinir=<token>`.

Variáveis: `webapp/server/.env.example` (`WEBAPP_PUBLIC_URL`, `PASSWORD_RESET_TTL_SEC`, `RATE_LIMIT_*`, SMTP, Resend ou Web3Forms).

Produção: `npm run build`, depois `node dist/index.js`. Use **HTTPS** na frente (nginx, Caddy, etc.) e defina `JWT_SECRET` forte.

## Cliente PWA (`webapp/client`)

1. Opcional: copie `.env.example` para `.env` e alinhe `VITE_DEV_*` com `ports.example.env`.
2. Para produção em outro host, defina `VITE_API_URL` no `.env` antes do build.
3. **Lista de personagens e `/api`:** em desenvolvimento, abra sempre o site pelo URL do Vite (ex. `http://localhost:5173`) para os pedidos a `/api` serem encaminhados pelo proxy. Em produção, se o site estático e a API tiverem origens diferentes, configure `VITE_API_URL` no build do cliente (URL base da API, sem barra final) e ajuste `CORS_ORIGIN` na API.
4. Em desenvolvimento (com a API rodando):

```bash
cd webapp/client
npm install
npm run dev
```

Abra a URL indicada pelo Vite (geralmente `http://localhost:5173`).

Build de produção:

```bash
npm run build
```

Sirva os arquivos em `dist/` atrás do mesmo domínio que a API ou configure `VITE_API_URL` no build. O manifest PWA fica em `dist/manifest.webmanifest`; você pode substituir `public/pwa-192.png` e `public/pwa-512.png` por ícones reais.

## Segurança

- Credenciais MySQL e `JWT_SECRET` só em variáveis de ambiente (nunca no browser).
- Rate limiting global e reforçado em registo/login e nos fluxos de redefinição (variáveis `RATE_LIMIT_*`).
- Chaves de recuperação: geradas no **primeiro** login web após a migração (cinco códigos, armazenados como hash); cada chave pode ser usada uma vez com o e-mail em «Esqueci minha senha» (fluxo e-mail + chave).
