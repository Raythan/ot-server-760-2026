# Conexão à internet: frp + WSL (servidor 7.72)

Este projeto usa o **mesmo esquema** do OT Serviço 8.60: o IP público **144.33.23.83** (OCI) expõe as portas **7171** e **7172** no **frps**; na sua máquina, o **frpc** (no WSL) encaminha para o **tfs** em **127.0.0.1**.

## Por que `127.0.0.1` funciona e `144.33.23.83` não?

| Teste | Significado |
|--------|-------------|
| `Test-NetConnection 127.0.0.1 -Port 7171` = **True** | O **tfs** está ouvindo no WSL e o Windows encaminha para o WSL (modo atual). |
| `Test-NetConnection 144.33.23.83 -Port 7171` = **False** | Normal **no seu PC de casa**: o endereço **144.33.23.83** é a **VM na OCI**, não a sua máquina. O tráfego entra na OCI; quem “liga” o mundo ao seu **tfs** é o **túnel frp + SSH**, não um listener direto no seu Windows. |
| **Ping** para 144.33.23.83 = timeout | Comum: a Security List pode **não** liberar ICMP; isso **não** impede TCP 7171/7172 se estiverem abertos. |

Ou seja: falha ao testar **144.33.23.83** a partir do próprio PC **não prova** que os jogadores não entram — mas se o **frpc** não estiver rodando, **ninguém** de fora chega ao seu **tfs**.

## Fluxo resumido

1. **frps** roda na OCI e escuta (por exemplo) em `127.0.0.1:7000` **dentro da VM**.
2. **SSH** com `-L 7000:127.0.0.1:7000` abre no WSL: **localhost:7000** → mesmo sítio na OCI.
3. **frpc** (config em `server/frp/frpc.toml`) conecta em **127.0.0.1:7000** e publica **7171/7172** no **frps**.
4. **tfs** ouve **127.0.0.1:7171** e **7172** no WSL; o frpc encaminha para essas portas.

Enquanto o **túnel SSH** e o **frpc** estiverem ativos, clientes usam **144.33.23.83:7171** (protocolo/login conforme o cliente).

## Pré-requisitos

- Binário **frpc** em `~/frp/frpc` (mesmo que você já usa no projeto 8.60).
- Chave **SSH** em `~/.ssh/ot_oci.key` (ou defina `SSH_KEY` ao rodar o script).
- Na VM OCI: **frps** escutando na porta usada pelo túnel (ex.: **7000** em loopback).
- **Security List** da OCI: TCP **22**, **7171**, **7172** (e o que mais o frps precisar). A sua lista já inclui 7171/7172.

## Comandos (WSL)

Na pasta do repositório Linux (`/mnt/c/GitHub/ot-server-760-2026/server`):

```bash
sed -i 's/\r$//' scripts/setup-frpc-wsl.sh scripts/start-tfs-wsl.sh
bash scripts/start-tfs-wsl.sh      # sobe o tfs (build/tfs)
bash scripts/setup-frpc-wsl.sh       # túnel SSH + frpc
```

Ordem prática: pode subir o **tfs** antes ou depois do **frpc**; o importante é, para jogadores externos, ter **tfs + túnel + frpc** ativos.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `server/frp/frpc.toml` | Config do **frpc** (proxies 7171/7172; `serverAddr` = 127.0.0.1 por causa do SSH). |
| `server/scripts/setup-frpc-wsl.sh` | Mata instâncias antigas, abre SSH **-L 7000**, inicia **frpc**. |
| `server/scripts/start-tfs-wsl.sh` | Testa MySQL, mata **tfs** antigo, sobe **build/tfs**. |
| `server/scripts/test-ports-oci.sh` | Teste opcional de portas no IP da OCI. |

## Ajustes

- **Outro IP / usuário OCI:** `OCI_HOST`, `OCI_USER` ou `SSH_KEY` ao chamar `setup-frpc-wsl.sh` (exporte antes ou edite o script).
- **Token frp:** deve bater com o **frps** (`auth.token` em `frpc.toml`).

## Projeto 8.60 no mesmo PC

Os dois usam **7171/7172** e o mesmo **`~/frp/frpc.toml`** (cada `setup-frpc-wsl.sh` copia o seu `frp/frpc.toml` para lá). Só um servidor OT pode estar exposto por vez com esse esquema. Para alternar, pare o `tfs` e o `frpc` de um e suba o outro.

## Cliente OT (`otclientv8/`)

- No **OTClient**, o endereço tem de estar no formato **`IP:7171:772`** (três partes). Só `IP:7171` sem **`:772`** faz o cliente usar outra versão no seletor e quebra o handshake.
- O `init.lua` do repositório define `securityKey = "jzlf9hnXJI"` (igual ao `config.lua` do servidor) e `SERVER_VERSION = 772`. A lista **Servers** deve apontar para o mesmo IP público que o frp expõe (ex.: `144.33.23.83:7171:772`).
- A mensagem **“Your connection has been lost (ERROR 2)”** vem do `modules/corelib/net.lua`: erro de socket **após** a conexão TCP abrir — típico quando o **servidor fecha** na hora do login (chave de segurança, RSA, ou estado do mundo), não quando ainda é “connection refused”.

## Cliente OT (geral)

- IP do servidor: **144.33.23.83**, porta **7171** (login), jogo em **7172** conforme o cliente 7.72.
- Conta/senha: conferir na tabela `accounts` do MySQL (projeto usa `passwordType` compatível com o emulador).

## “Connection lost” / ERROR 2 no cliente (depois que a rede já conecta)

Se antes aparecia **10061** e agora **“Your connection has been lost” (ERROR 2)**, o TCP em geral **chegou** ao servidor, mas a sessão caiu no **primeiro pacote de login**.

Neste fork, o `protocollogin.cpp` **fecha a conexão sem mensagem** se:

1. **Security key** — a string enviada pelo cliente não é **igual** a `securityKey` no `config.lua` do servidor (hoje: `jzlf9hnXJI`). O OTClient / OTC costuma ter um campo equivalente (`security`, `password` do servidor, etc.); tem de ser **o mesmo valor**.
2. **RSA** — o pacote criptografado não bate com a chave que o servidor espera (chave **p/q** fixas em `otserv.cpp`, padrão Tibia OT 7.x). O cliente 7.72 precisa usar o **mesmo par RSA público** que esse servidor usa.

**O que fazer:** no cliente, confira **security key** e chaves **RSA** (ou copie a config de um cliente que já funciona com este servidor). Se só a key estiver errada, costuma cair exatamente assim, sem popup de “senha incorreta”.

## Onde ficam os logs (tudo em `server/logs/`)

| Arquivo | Origem |
|---------|--------|
| `console-*.log`, `console-latest.log` | `run-tfs-with-logs.sh` (tfs em primeiro plano com `tee`) |
| `tfs-startup.log` | `scripts/start-tfs-wsl.sh` |
| `ssh-tunnel.log` | erros do SSH ao abrir a porta 7000 |
| `frpc.log` | saída do **frpc** |
| `frpc.pid` | PID do processo **frpc** |
