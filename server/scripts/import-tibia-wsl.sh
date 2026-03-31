#!/usr/bin/env bash
# Importa database.sql no MySQL do Windows, a partir do WSL.
# Uso: bash scripts/import-tibia-wsl.sh [host] [user]
# Por omissão: host=172.30.32.1 user=root
# Se o root tiver password: export MYSQL_PWD='tua_senha' antes de correr, ou edita o script para usar -p.

set -euo pipefail
MYSQL_HOST="${1:-172.30.32.1}"
MYSQL_USER="${2:-root}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$(cd "$SCRIPT_DIR/.." && pwd)/database.sql"

if [[ ! -f "$SQL_FILE" ]]; then
  echo "Não encontrado: $SQL_FILE"
  exit 1
fi

echo "A criar base de dados 'tibia' em ${MYSQL_HOST}..."
mysql -h "$MYSQL_HOST" -u"$MYSQL_USER" -e "CREATE DATABASE IF NOT EXISTS tibia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "A importar (pode demorar um pouco)..."
mysql -h "$MYSQL_HOST" -u"$MYSQL_USER" tibia < "$SQL_FILE"

echo "Concluído. Tabelas em 'tibia':"
mysql -h "$MYSQL_HOST" -u"$MYSQL_USER" -e "SHOW TABLES IN tibia;" | head -20
