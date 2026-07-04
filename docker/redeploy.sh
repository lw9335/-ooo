#!/usr/bin/env bash
# Re-deploy latest code on an existing ECS instance (run as root).
#   cd /opt/qixiu && bash docker/redeploy.sh
set -euo pipefail

PUBLIC_IP="${PUBLIC_IP:-8.148.193.66}"
INSTALL_DIR="/opt/qixiu"
COMPOSE_DIR="${INSTALL_DIR}/docker"

cd "$INSTALL_DIR"
git fetch origin
git reset --hard origin/main

cd "$COMPOSE_DIR"
mkdir -p nginx/certs
sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=http://${PUBLIC_IP}|" .env 2>/dev/null || true
sed -i "s|^MOBILE_BASE_URL=.*|MOBILE_BASE_URL=http://${PUBLIC_IP}:8081|" .env 2>/dev/null || true

docker compose --env-file .env build --no-cache
docker compose --env-file .env up -d

ok=0
for i in $(seq 1 40); do
  if curl -sf "http://127.0.0.1/api/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  echo "waiting for API... ($i/40)"
  sleep 5
done

if [ "$ok" -ne 1 ]; then
  docker compose logs api --tail 40
  exit 1
fi

docker compose exec -T api npx prisma db seed
echo "OK: http://${PUBLIC_IP}/  admin/admin123"
docker compose ps
