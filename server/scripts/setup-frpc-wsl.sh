#!/usr/bin/env bash
# Abre túnel SSH (localhost:7000 -> frps na OCI) e inicia o frpc no WSL.
# Pré-requisitos: binário ~/frp/frpc, chave ~/.ssh/ot_oci.key, frps na VM OCI escutando em 127.0.0.1:7000.
#
# Uso (na pasta server/ ou com caminho completo):
#   bash scripts/setup-frpc-wsl.sh
#
# Variáveis opcionais: OCI_HOST, OCI_USER, SSH_KEY, FRP_DIR

set -euo pipefail

OCI_HOST="${OCI_HOST:-144.33.23.83}"
OCI_USER="${OCI_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ot_oci.key}"
FRP_DIR="${FRP_DIR:-$HOME/frp}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
mkdir -p "$SERVER_DIR/logs"
TUNNEL_LOG="$SERVER_DIR/logs/ssh-tunnel.log"
FRPC_LOG="$SERVER_DIR/logs/frpc.log"
REPO_TOML="$SERVER_DIR/frp/frpc.toml"

if [[ ! -f "$SSH_KEY" ]]; then
  echo "ERRO: chave SSH não encontrada: $SSH_KEY"
  exit 1
fi
if [[ ! -x "$FRP_DIR/frpc" ]]; then
  echo "ERRO: frpc não encontrado ou sem permissão de execução: $FRP_DIR/frpc"
  exit 1
fi

if [[ -f "$REPO_TOML" ]]; then
  cp "$REPO_TOML" "$FRP_DIR/frpc.toml"
  echo "Copiado: $REPO_TOML -> $FRP_DIR/frpc.toml"
fi

echo "=== Parando processos anteriores (760) ==="
pkill -f "ssh.*7000:127.0.0.1:7000.*$OCI_HOST" 2>/dev/null && sleep 1 || true
pkill -f "frpc.*frpc.toml" 2>/dev/null && sleep 1 || true

echo "=== Abrindo túnel SSH (localhost:7000 -> OCI:7000) ==="
: > "$TUNNEL_LOG"
ssh -o StrictHostKeyChecking=no \
  -o BatchMode=yes \
  -o ConnectTimeout=10 \
  -o ServerAliveInterval=15 \
  -o ServerAliveCountMax=4 \
  -o ExitOnForwardFailure=yes \
  -i "$SSH_KEY" \
  -L 7000:127.0.0.1:7000 \
  -N -f \
  "$OCI_USER@$OCI_HOST" \
  2>>"$TUNNEL_LOG"

sleep 1

if ! ss -lntp 2>/dev/null | grep -q ':7000'; then
  echo "ERRO: túnel SSH não abriu a porta 7000 localmente."
  cat "$TUNNEL_LOG"
  exit 1
fi
echo "Túnel OK — localhost:7000 ativo"

echo "=== Iniciando frpc ==="
: > "$FRPC_LOG"
setsid "$FRP_DIR/frpc" -c "$FRP_DIR/frpc.toml" >>"$FRPC_LOG" 2>&1 </dev/null &
FRPC_PID=$!
echo "$FRPC_PID" >"$SERVER_DIR/logs/frpc.pid"

sleep 4
echo "=== Início do log do frpc ==="
sed -n '1,50p' "$FRPC_LOG"

if ps -p "$FRPC_PID" >/dev/null 2>&1; then
  echo ""
  echo "frpc em execução (PID $FRPC_PID). Log: $FRPC_LOG"
else
  echo "AVISO: frpc pode ter encerrado — ver $FRPC_LOG (loginFailExit=false tenta reconectar)"
fi
