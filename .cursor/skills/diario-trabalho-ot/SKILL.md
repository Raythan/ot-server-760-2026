---
name: diario-trabalho-ot
description: >-
  Acrescenta entradas datadas e resumidas ao diário local do projeto OT (DIARIO-TRABALHO-LOCAL.md na raiz do repositório).
  Use quando o usuário pedir registro de passos, histórico de sessão, changelog local, ou após tarefas
  relevantes (build, banco de dados, config, scripts). Inclui formato com data para acompanhamento.
---

# Diário de trabalho OT (resumo com data)

## Objetivo

Manter **`DIARIO-TRABALHO-LOCAL.md`** (raiz do repositório) como registro cronológico **curto** e **acionável**: decisões, arquivos alterados, comandos úteis — não documentação genérica nem cópia de conversas.

## Quando atualizar

- Pedido explícito (“anota no diário”, “registra os passos”).
- Após blocos de trabalho que mudem ambiente, banco, `config.lua`, scripts ou comportamento do servidor.
- Após alterações relevantes na **webapp** (`webapp/server`, `webapp/client`) — API, fluxo de contas/personagens ou protocolo alinhado ao cliente.

## Formato de cada entrada

1. Colocar na seção **## Linha do tempo**, **abaixo das entradas mais recentes do mesmo dia** ou como novo bloco.
2. Cabeçalho obrigatório (data ISO para ordenação e grep):

```markdown
### YYYY-MM-DD — Título em poucas palavras (tema)
```

3. Corpo: bullets curtos; preferir **arquivos com caminho** `` `server/...` ``, **valores** (IPs, contas, flags) quando forem decisões de ambiente.
4. Evitar parágrafos longos; uma entrada típica: **8–25 linhas**.
5. Se várias sessões no mesmo dia: pode haver **vários** `### YYYY-MM-DD — …` com subtemas diferentes.

## Conteúdo mínimo sugerido

- **O quê** mudou e **por quê** (1 frase por bullet se necessário).
- **Onde**: caminhos de código, SQL, `config.lua`, scripts.
- **Comandos** só se forem referência recorrente (opcional).

## Conteúdo a evitar

- Copiar conversas inteiras ou diff linha a linha.
- Datas ambíguas sem ISO (`31/03` só como complemento, nunca sozinha).

## Data de referência

Usar a data indicada pelo usuário ou a data “hoje” do ambiente da conversa quando existir; se não existir, usar a data do sistema no momento da edição e não inventar dia errado.

## Relação com regras

O arquivo **`.cursor/rules/diario-trabalho-local.mdc`** reforça este formato ao editar arquivos `DIARIO*.md`.
