#!/usr/bin/env bash
# Sobe o tfs (compilado em build/) a partir da pasta server/; saída em logs/tfs-startup.log
#
# Uso:
#   bash scripts/start-tfs-wsl.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OTDIR="$(cd "$SCRIPT_DIR/.." && pwd)"
mkdir -p "$OTDIR/logs"
LOG="$OTDIR/logs/tfs-startup.log"
TFS_BIN="$OTDIR/build/tfs"

cd "$OTDIR"

echo "=== Diretório do servidor: $OTDIR ==="
echo "=== Trecho do config (ip / MySQL) ==="
grep -E '^ip |^mysqlHost|^mysqlUser|^mysqlPass|^mysqlDatabase' config.lua || true

echo "=== Teste rápido ao MySQL (credenciais do config.lua) ==="
HOST=$(awk -F'"' '/^mysqlHost/{print $2}' config.lua)
USER=$(awk -F'"' '/^mysqlUser/{print $2}' config.lua)
PASS=$(awk -F'"' '/^mysqlPass/{print $2}' config.lua)
DB=$(awk -F'"' '/^mysqlDatabase/{print $2}' config.lua)
if [[ -n "$PASS" ]]; then export MYSQL_PWD="$PASS"; else unset MYSQL_PWD; fi
mysql -h "$HOST" -u "$USER" "$DB" -e "SELECT COUNT(*) AS accounts FROM accounts LIMIT 1;" 2>&1 || {
  echo "ERRO: falha ao conectar no MySQL. Ajuste config.lua (host, user, senha)."
  exit 1
}

if [[ ! -x "$TFS_BIN" ]]; then
  echo "ERRO: não existe $TFS_BIN — compile antes (cmake em build/)."
  exit 1
fi

echo "=== Encerrando tfs anterior (se houver) ==="
pkill -x tfs 2>/dev/null && sleep 1 || true

echo "=== Iniciando tfs ==="
: >"$LOG"
setsid "$TFS_BIN" >>"$LOG" 2>&1 </dev/null &
TFS_PID=$!
echo "PID tfs: $TFS_PID"
sleep 6

echo "=== Log de arranque (trecho) ==="
head -80 "$LOG"

echo "=== Portas 7171 / 7172 ==="
ss -lntp 2>/dev/null | awk 'NR==1 || /:7171|:7172/' || true
