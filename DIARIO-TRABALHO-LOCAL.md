# Diário de trabalho local (projeto OT / TFS)

Registo cronológico de decisões, ambiente e passos de compilação nesta máquina. Serve como memória do projeto, não como documentação oficial upstream.

---

## Contexto fixo

| Item | Valor |
|------|--------|
| Motor | Fork baseado em **The Forgotten Server (TFS)** — executável `tfs` |
| Cliente / protocolo | **772** (7.72) — ver `server/src/definitions.h` (`CLIENT_VERSION_MIN` / `MAX` / `STR`) |
| Repositório (Windows) | `C:\GitHub\ot-server-760-2026` |
| Código-fonte do servidor | Pasta **`server/`** |

---

## Linha do tempo

### 2026-03-31 — Webapp PWA: toasts, navegação compacta e cópia «Senha»

- **`.gitignore`:** pasta **`chaves/`** para credenciais/chaves locais fora do Git.
- **`webapp/client`:** título **Tenebra OT** apenas no **rodapé**; barra superior só com separadores e **Terminar sessão** (sem competir com botões no mobile); `showToast` + **`#toast-root`** no `index.html` **fora** de `#app` (mensagens temporárias, sem bloco fixo no `<main>`); `lang="pt-BR"`.
- **Cópia:** «**Senha**» em vez de «palavra-passe» na UI e mensagens da API (`webapp/server/src/index.ts`).
- **Regra Cursor:** `.cursor/rules/webapp-pwa-client.mdc` — convenções do cliente PWA.

### 2026-03-31 — Lista de personagens: cache 3 min, limite 50 e API (webapp)

- **`webapp/server/src/index.ts`:** `online` normalizado com `mysqlOnlineToBoolean` (bigint/buffer); `GET /api/characters` devolve `limit: 50`; `POST /api/characters` recusa com **400** se `COUNT(*) >= 50` para a conta (`deletion = 0`).
- **`webapp/client/src/charactersCache.ts`:** cache em `localStorage` (`ot_characters_cache_v1`), TTL **3 min**, chave por `accountId` extraído do JWT (payload base64url); `invalidateCharactersCache` em logout, login, registo, criar e eliminar personagem.
- **`webapp/client/src/main.ts`:** lista imediata com cache válido; erros de rede/API com mensagem real; contador **(N/50)**; formulário e botão «Criar» desativados no limite; botão **Atualizar lista** (fetch forçado).
- **`webapp/README.md`:** nota explícita sobre URL do Vite em dev e `VITE_API_URL` / `CORS` em prod.

### 2026-03-31 — Login por e-mail, aprendiz nível 8 e painel de personagens (webapp)

- **Cliente OT (`otclientv8/`, pasta local, ainda ignorada pelo Git):** em **`modules/game_features/features.lua`**, `GameAccountNames` ativado para protocolo **772–839** para enviar **string** (e-mail) no login; **`entergame`**: campo de conta como **TextEdit**, rótulo **E-mail**; tradução **`E-mail:`** em `neededtranslations.lua`.
- **TFS:** **`server/src/iologindata.*`** — `loginserverAuthentication` / `gameworldAuthentication` por **`LOWER(email)`**; **`protocollogin.*`** e **`protocolgame.cpp`** — primeiro identificador **string** (e-mail), não `uint32`; mensagens *Email or password…*; **`protocolgame.cpp`** corrigido para declarar `accountEmail` (merge incompleto que impedia o build).
- **Webapp:** **`webapp/server`**: `POST /api/login` com **e-mail** + senha; `POST /api/register` com verificação de e-mail duplicado; **`GET /api/characters`** com **`online`** via `LEFT JOIN players_online`; **`DELETE /api/characters/:id`** se offline; criação de personagem só **nome + sexo** — **`webapp/server/src/playerDefaults.ts`**: **vocation 0 (None)**, **nível 8**, stats alinhados à vocação **0** em **`server/data/XML/vocations.xml`** (ganhos 1→8) e **`getExpForLevel(8)`** como no TFS.
- **Webapp UI:** **`webapp/client`**: lista com vocação (ex. «Aprendiz»), nível, online/offline, botão eliminar; estilos em **`style.css`**.

### 2026-03-31 — Web app (API + Vite), documentação e diário na raiz

- Pasta **`webapp/`**: API Node (`webapp/server`, Fastify, **mysql2**) e cliente PWA (`webapp/client`, Vite). Senhas **SHA1** alinhadas ao TFS; **`JWT_SECRET`** e credenciais MySQL só em **`.env`** (arquivo ignorado pelo Git; usar **`webapp/server/.env.example`** como modelo).
- **`README.md` na raiz** descreve `server/`, `webapp/` e o diário local. **`webapp/README.md`** documenta portas, proxy, CORS e o detalhe **MySQL no Windows** (`MYSQL_HOST=localhost` vs `127.0.0.1` com MariaDB/XAMPP).
- **`DIARIO-TRABALHO-LOCAL.md`** está na **raiz** (antes havia cópia/caminho sob `server/`). Skill **`.cursor/skills/diario-trabalho-ot/SKILL.md`** e regra **`.cursor/rules/diario-trabalho-local.mdc`** ajustadas ao **português do Brasil** e ao formato de entradas datadas.
- Mensagens de erro da API (**`webapp/server/src/mysqlErrors.ts`**) em pt-BR, com dica de `localhost` quando houver *access denied*.
- Removido **`server/data/spells/spells x 1.xml`** (nome duplicado/errado; o servidor carrega **`server/data/spells/spells.xml`**).

### 2026-03-31 — Compilação no WSL (Ubuntu 24.04)

**Ambiente**

- WSL2, distribuição **`Ubuntu`** (24.04 LTS “noble”) — o nome `Ubuntu-24.04` não existe no `wsl -l`; usar `wsl -d Ubuntu`.
- Caminho Linux do repo: `/mnt/c/GitHub/ot-server-760-2026`.
- Toolchain: GCC 13.x, CMake 3.28, Boost 1.83.

**Dependências instaladas (APT)**

- `build-essential`, `cmake`
- `libboost-system-dev`, `libboost-filesystem-dev`
- `libgmp-dev`, `libpugixml-dev`
- `liblua5.2-dev`, `libluajit-5.1-dev` (LuaJIT opcional; build abaixo usa Lua 5.2)
- `default-libmysqlclient-dev`, `pkg-config`

**Problemas encontrados e correções no código**

1. **Boost.DateTime + `posix_time::seconds`**  
   Enums anónimos `read_timeout` / `write_timeout` em `Connection` não eram aceites como tipo integral pelo construtor de `seconds` (Boost 1.83).  
   *Correção:* `static constexpr int` em `server/src/connection.h`.

2. **`std::allocate_shared` + alocador em pool (`LockfreePoolingAllocator`)**  
   GCC 13 valida `std::allocator_traits` com mais rigor; faltava `rebind` coerente e construtor por omissão.  
   *Correção:* `server/src/lockfree.h` — `rebind`, construtor default, construtor de cópia entre especializações; `server/src/outputmessage.cpp` — uso directo de `LockfreePoolingAllocator<OutputMessage, …>`.

3. **Linkagem Lua inconsistente**  
   O CMake podia apanhar **includes Lua 5.2** e ligar **`libluajit-5.1.so`**, gerando símbolos indefinidos (`lua_pcallk`, `lua_getglobal`, etc.).  
   *Correção de configuração:* passar `-DLUA_INCLUDE_DIR` e `-DLUA_LIBRARY` explicitamente para Lua 5.2; `server/cmake/FindLuaJIT.cmake` actualizado com `include/luajit-2.1` para futuras builds com LuaJIT no Ubuntu recente.

**Resultado**

- Binário gerado: `server/build/tfs` (ELF x86-64, Linux).
- Ligação verificada: `liblua5.2`, `libmysqlclient`, Boost filesystem, PugiXML, GMP, etc.

---

## Comando de referência (rebuild limpo)

Executar dentro do WSL, a partir da pasta `server`:

```bash
cd /mnt/c/GitHub/ot-server-760-2026/server
rm -rf build && mkdir build && cd build

cmake .. -DCMAKE_BUILD_TYPE=Release \
  -DUSE_LUAJIT=OFF \
  -DLUA_INCLUDE_DIR=/usr/include/lua5.2 \
  -DLUA_LIBRARY=/usr/lib/x86_64-linux-gnu/liblua5.2.so

cmake --build . -j"$(nproc)"
```

**Nota:** compilar em `/mnt/c/` (disco Windows) é mais lento; para builds frequentes, pode copiar o árvore para `~/proj` no ext4 do WSL.

---

### 2026-03-31 — MySQL no Windows, servidor no WSL

- **MySQL** corre **localmente no Windows** (Workbench, XAMPP, MariaDB instalador, etc.).
- O **`tfs`** liga-se ao MySQL pelo IP do **host Windows** visto a partir do WSL (`mysqlHost` em `server/config.lua`, por omissão `172.30.32.1` — igual ao padrão usado no outro projeto OTServico 8.60). Se o IP mudar após reboot/rede, actualizar `mysqlHost` ou usar o comando indicado no comentário do `server/config.lua`.
- No Windows, o serviço MySQL/MariaDB tem de **aceitar ligações TCP** na porta 3306 a partir do WSL (firewall / `bind-address` em `my.ini` — por vezes é preciso `0.0.0.0` ou `172.30.32.1` em vez de só `127.0.0.1`).
- Utilizador e senha do MySQL no Windows preenchem-se em `mysqlUser` / `mysqlPass` em `server/config.lua`.

**Import do `database.sql`**

- Foi criada a base **`tibia`** e importado `database.sql` a partir do WSL com o cliente `mysql` a apontar para `172.30.32.1` (MySQL no Windows). Script reutilizável: `server/scripts/import-tibia-wsl.sh` (correr no WSL; se o ficheiro tiver CRLF, `sed -i 's/\r$//' scripts/import-tibia-wsl.sh` uma vez).
- Para repetir ou noutra máquina: com `root` e password, usar `export MYSQL_PWD='...'` antes do script ou import manual no MySQL Workbench (escolher a base `tibia` e executar o SQL).

### 2026-03-31 — IP público 144.33.23.83 e MySQL 8 dentro do WSL

- **`ip`** em `server/config.lua` = **`144.33.23.83`** — endereço anunciado aos clientes (login); o `tfs` continua a escutar em todas as interfaces com `bindOnlyGlobalAddress = false` (portas 7171/7172), compatível com frp/túnel na OCI.
- **Base de dados** passou a ser **MySQL 8 no próprio WSL** (`mysqlHost = 127.0.0.1`), utilizador **`tfs`** / password **`otserver760`** na base **`tibia`** (criado pelo script `server/scripts/setup-mysql-wsl.sh`). Alterar a password no MySQL e em `server/config.lua` em produção.
- Script de preparação (executar no WSL como root): `wsl -d Ubuntu -u root -- bash /mnt/c/GitHub/ot-server-760-2026/server/scripts/setup-mysql-wsl.sh`

---

## Próximos passos sugeridos (a preencher)

- [x] Base de dados: importar `database.sql` na base `tibia` (feito neste ambiente; validar credenciais em `server/config.lua`).
- [ ] Teste: arrancar `./tfs` e validar login / jogo com cliente 7.72.
- [ ] Opcional: experimentar `-DUSE_LUAJIT=ON` com includes LuaJIT correctos após ajuste do `FindLuaJIT`.

---

### Logs de consola

- Pasta **`server/logs/`**: tudo relacionado a saída de processos (sem `/tmp`): `console-*.log` / `console-latest.log` (`run-tfs-with-logs.sh`), `tfs-startup.log` (`start-tfs-wsl.sh`), `ssh-tunnel.log`, `frpc.log`, `frpc.pid` (`setup-frpc-wsl.sh`).
- Arranque com registo: na pasta `server/` no WSL, `bash run-tfs-with-logs.sh` (usa `./build/tfs` por omissão). O `tfs` só imprime para `stdout`; não há logger nativo em arquivo.

### 2026-03-31 — frp + scripts WSL (acesso 144.33.23.83)

- Documentação: **`server/docs/CONEXAO-FRP-WSL.md`** (por que `127.0.0.1` responde e o teste ao IP público no PC de casa pode falhar; fluxo SSH + frpc + frps).
- Scripts (equivalentes ao projeto 8.60): `server/scripts/start-tfs-wsl.sh`, `server/scripts/setup-frpc-wsl.sh`, config `server/frp/frpc.toml`.
- O **frpc** precisa estar rodando no WSL para o mundo alcançar o `tfs` pelo IP da OCI; sem túnel, conexão externa recusa (ex.: erro 10061 no cliente).

### 2026-03-31 — Contas na base `tibia`, MySQL Windows, correções TFS

**Base de dados (`tibia`, password SHA1 quando `passwordType = sha1`)**

- Script **`server/scripts/setup-account-123.sql`**: conta **123**, senha **`ray`**, personagens de teste (incl. grupo god em `AdminRay`).
- Script **`server/scripts/setup-accounts-raythan.sql`** (executado no MySQL): conta **2** / senha **`123`** com 6 personagens god (`Adm …`); contas **50001–50005** / senha **`123`** com `email` = `raythan`…`rodrigo` (o cliente OT usa **número de conta**, não texto). Em cada 5000x há 4 personagens (voc 1–4: sorcerer, druid, paladin, knight).
- **`server/scripts/grant-tfs-wsl-access.sql`**: `GRANT` para `tfs`@`%` quando o acesso vem do WSL (evita *Access denied* para `tfs`@`172.30.x.x`).

**`server/config.lua`**

- Comentário de referência ao projeto anterior: **`C:\GitHub\ot-server-860-2026`**.
- MySQL no **host Windows** a partir do WSL: `mysqlHost = 172.30.32.1`, utilizador **`root`** (senha vazia ou a definir localmente).

**Código (`server/src/iologindata.cpp`)**

- Correcção do **save do jogador**: `PlayerSex_t` (base `uint8_t`) era escrito no SQL como carácter em vez de número, gerando byte inválido no `UPDATE` → cast para inteiro em `` `sex` ``.

**Removido (pedido do utilizador)**

- Scripts de migração entre bases `Global` e `tibia` (não fazem parte do repo actual).

**Tracking / formato de diário**

- Skill do projeto: **`.cursor/skills/diario-trabalho-ot/SKILL.md`** — como acrescentar entradas datadas e resumidas neste ficheiro.
- Regra Cursor: **`.cursor/rules/diario-trabalho-local.mdc`** — aplica-se ao editar `DIARIO*.md`.

---

## Como usar este ficheiro

- Acrescentar **novas entradas na secção “Linha do tempo”** com data (ISO `YYYY-MM-DD`) e o que foi feito (bugs, flags, versões).
- Manter **comandos copy-paste** actualizados quando o fluxo de build mudar.
- **Formato resumido com tracking:** ver skill `.cursor/skills/diario-trabalho-ot/SKILL.md` e regra `.cursor/rules/diario-trabalho-local.mdc`.
