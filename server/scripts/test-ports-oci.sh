#!/usr/bin/env bash
# Testa conectividade TCP a portas no IP público da OCI (requer bash com /dev/tcp).
# Uso: bash scripts/test-ports-oci.sh
HOST="${1:-144.33.23.83}"
for p in 22 7171 7172 7000; do
  if timeout 3 bash -c "echo >/dev/tcp/$HOST/$p" 2>/dev/null; then
    echo "PORT_${p}=ABERTA"
  else
    echo "PORT_${p}=fechada_ou_filtrada"
  fi
done
