#!/usr/bin/env bash
# Executar no WSL como root: wsl -d Ubuntu -u root -- bash /mnt/c/GitHub/ot-server-760-2026/server/scripts/setup-mysql-wsl.sh
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$REPO/database.sql"

mysql -e "SELECT VERSION();"
mysql -e "CREATE DATABASE IF NOT EXISTS tibia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if [[ -f "$SQL" ]]; then
  echo "A importar database.sql em tibia..."
  mysql tibia < "$SQL"
  echo "Import concluído."
else
  echo "AVISO: $SQL não encontrado — base tibia criada vazia."
fi

# Utilizador dedicado para o tfs (password em variável ou vazio para dev local)
TFS_USER="${TFS_DB_USER:-tfs}"
TFS_PASS="${TFS_DB_PASS:-otserver760}"
mysql -e "CREATE USER IF NOT EXISTS '${TFS_USER}'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '${TFS_PASS}';"
mysql -e "CREATE USER IF NOT EXISTS '${TFS_USER}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${TFS_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON tibia.* TO '${TFS_USER}'@'127.0.0.1'; GRANT ALL PRIVILEGES ON tibia.* TO '${TFS_USER}'@'localhost'; FLUSH PRIVILEGES;"
echo "User ${TFS_USER} criado/atualizado para a base tibia."
echo "Password (definir em config.lua mysqlPass): ${TFS_PASS}"
