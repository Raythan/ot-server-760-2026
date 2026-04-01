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

Por padrão escuta em `http://127.0.0.1:3847`. Rotas: `GET /api/health`, `POST /api/register` (retorna `accountId` + `token`), `POST /api/login`, `GET /api/me`, `GET /api/characters`, `POST /api/characters` (autenticadas com `Authorization: Bearer <jwt>`).

Produção: `npm run build`, depois `node dist/index.js`. Use **HTTPS** na frente (nginx, Caddy, etc.) e defina `JWT_SECRET` forte.

## Cliente PWA (`webapp/client`)

1. Opcional: copie `.env.example` para `.env` e alinhe `VITE_DEV_*` com `ports.example.env`.
2. Para produção em outro host, defina `VITE_API_URL` no `.env` antes do build.
3. Em desenvolvimento (com a API rodando):

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
- Rate limiting global e reforçado em registro/login (variáveis `RATE_LIMIT_*`).
