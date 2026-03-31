---
name: diario-trabalho-ot
description: >-
  Acrescenta entradas datadas e resumidas ao diário local do projeto OT (server/DIARIO-TRABALHO-LOCAL.md).
  Use quando o utilizador pedir registo de passos, histórico de sessão, changelog local, ou após tarefas
  relevantes (build, DB, config, scripts). Inclui formato com data para tracking.
---

# Diário de trabalho OT (resumo com data)

## Objetivo

Manter **`server/DIARIO-TRABALHO-LOCAL.md`** como registo cronológico **curto** e **acionável**: decisões, ficheiros alterados, comandos úteis — não documentação genérica.

## Quando atualizar

- Pedido explícito (“anota no diário”, “regista os passos”).
- Após blocos de trabalho que mudem ambiente, DB, `config.lua`, scripts ou comportamento do servidor.

## Formato de cada entrada

1. Colocar na secção **## Linha do tempo**, **por baixo das entradas mais recentes do mesmo dia** ou como novo bloco.
2. Cabeçalho obrigatório (data ISO para ordenação e grep):

```markdown
### YYYY-MM-DD — Título em poucas palavras (tema)
```

3. Corpo: bullets curtos; preferir **ficheiros com path** `` `server/...` ``, **valores** (IPs, contas, flags) quando forem decisões de ambiente.
4. Evitar parágrafos longos; uma entrada típica: **8–25 linhas**.
5. Se várias sessões no mesmo dia: pode haver **vários** `### YYYY-MM-DD — …` com subtemas diferentes.

## Conteúdo mínimo sugerido

- **O quê** mudou e **porquê** (1 frase por bullet se necessário).
- **Onde**: paths de código, SQL, `config.lua`, scripts.
- **Comandos** só se forem comando de referência recorrente (opcional).

## Conteúdo a evitar

- Copiar conversas inteiras ou diff linha a linha.
- Datas ambíguas sem ISO (`31/03` só como complemento, nunca só isso).

## Data de referência

Usar a data indicada pelo utilizador ou a data “hoje” do ambiente da conversa quando existir; se não existir, usar a data do sistema no momento da edição e não inventar dia errado.

## Relação com regras

O ficheiro **`.cursor/rules/diario-trabalho-local.mdc`** reforça este formato ao editar ficheiros `DIARIO*.md`.
