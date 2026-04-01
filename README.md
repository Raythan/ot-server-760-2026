# ot-server-760-2026

Servidor **Tenebra OT** (fork **The Forgotten Server**), cliente **7.72**. Este repositório concentra o binário e dados em **`server/`**, a **web app** de contas em **`webapp/`**, e um **diário local** opcional na raiz.

## Estrutura

| Pasta / arquivo | Conteúdo |
|-----------------|----------|
| **`server/`** | Código C++ do TFS, Lua (`data/`), `config.lua`, `database.sql`, scripts WSL |
| **`webapp/`** | API Node (Fastify) + cliente Vite para registro/login e personagens na base `tibia` |
| **`DIARIO-TRABALHO-LOCAL.md`** | Diário datado de ambiente, build e decisões (não é documentação oficial upstream; formato na skill `.cursor/skills/diario-trabalho-ot/SKILL.md`) |

## Documentação rápida

- **Compilar o TFS (WSL), MySQL e rede:** entradas em `DIARIO-TRABALHO-LOCAL.md` e, quando existir, `server/docs/`.
- **Web app (portas, `.env`, MySQL no Windows):** `webapp/README.md`.

## Requisitos gerais

- **Cliente / protocolo:** 772 — ver `server/src/definitions.h` (`CLIENT_VERSION_*`).
- **Base de dados:** MySQL/MariaDB com o schema esperado pelo TFS (ex. import de `server/database.sql` na base `tibia`).
