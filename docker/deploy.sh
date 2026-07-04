#!/usr/bin/env bash
# One-command deploy script for Aliyun ECS.
# Usage: bash docker/deploy.sh
set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "[deploy] docker/.env not found. Copy .env.example to .env and fill in values."
  exit 1
fi

echo "[deploy] Pulling latest code..."
git -C .. pull --ff-only || true

echo "[deploy] Building and starting containers..."
docker compose --env-file .env up -d --build

echo "[deploy] Cleaning dangling images..."
docker image prune -f

echo "[deploy] Running database seed..."
for i in 1 2 3 4 5; do
  if docker compose exec -T api npx prisma db seed; then
    break
  fi
  echo "[deploy] seed retry $i..."
  sleep 5
done

echo "[deploy] Done. Services:"
docker compose ps
