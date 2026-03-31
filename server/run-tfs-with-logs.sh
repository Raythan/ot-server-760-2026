#!/usr/bin/env bash
# Roda o tfs e grava toda a saída do console em logs/ (pasta do servidor).
# Uso (no WSL, a partir desta pasta server/):
#   bash run-tfs-with-logs.sh
# Binário por omissão: ./build/tfs  (sobrepor: TFS_BIN=./tfs bash run-tfs-with-logs.sh)

set -euo pipefail
cd "$(dirname "$0")"
mkdir -p logs

TFS_BIN="${TFS_BIN:-./build/tfs}"
if [[ ! -x "$TFS_BIN" ]]; then
  if [[ -x "./tfs" ]]; then
    TFS_BIN="./tfs"
  else
    echo "Erro: não encontrei executável. Compila em build/ ou define TFS_BIN."
    exit 1
  fi
fi

STAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOG_STAMPED="logs/console-${STAMP}.log"
LOG_LATEST="logs/console-latest.log"

echo "Console + arquivos em logs/:"
echo "  ${LOG_STAMPED}"
echo "  ${LOG_LATEST}"
echo "----"

# tee escreve o mesmo conteúdo nos dois ficheiros e repete no terminal
"$TFS_BIN" 2>&1 | tee "$LOG_STAMPED" "$LOG_LATEST"
