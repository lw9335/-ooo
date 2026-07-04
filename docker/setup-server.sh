#!/usr/bin/env bash
# One-click server bootstrap for Aliyun ECS (Ubuntu).
# Run as root on the server:
#   curl -fsSL https://raw.githubusercontent.com/lw9335/-ooo/main/docker/setup-server.sh | PUBLIC_IP=8.148.193.66 bash
set -euo pipefail

PUBLIC_IP="${PUBLIC_IP:-8.148.193.66}"
REPO="https://github.com/lw9335/-ooo.git"
INSTALL_DIR="/opt/qixiu"
COMPOSE_DIR="${INSTALL_DIR}/docker"

echo "=========================================="
echo " QiXiu Dispatch System - Server Setup"
echo " Public IP: $PUBLIC_IP"
echo "=========================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo bash setup-server.sh"
  exit 1
fi

ensure_swap() {
  local mem_mb
  mem_mb=$(free -m | awk '/^Mem:/{print $2}')
  if [ "$mem_mb" -lt 3500 ] && [ ! -f /swapfile ]; then
    echo "  Low RAM (${mem_mb}MB), adding 2G swap..."
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
}

free_port_80() {
  if ss -tlnp 2>/dev/null | grep -q ':80 '; then
    echo "  Port 80 busy — stopping frps/frpc if present..."
    systemctl stop frps frpc 2>/dev/null || true
    systemctl disable frps frpc 2>/dev/null || true
    sleep 1
  fi
}

configure_docker() {
  mkdir -p /etc/docker
  cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ],
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
  systemctl restart docker
  sleep 2
}

install_docker() {
  apt-get update -qq
  apt-get install -y -qq docker.io docker-compose-v2 curl git ca-certificates openssl
  systemctl enable --now docker
}

ensure_swap
free_port_80

echo "[1/7] Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  install_docker || {
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun || install_docker
    systemctl enable --now docker
  }
fi
docker --version
docker compose version 2>/dev/null || docker-compose --version

echo "[2/7] Configuring Docker mirrors..."
configure_docker

echo "[3/7] Cloning/updating repository..."
if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR"
  git fetch origin
  git reset --hard origin/main
else
  git clone "$REPO" "$INSTALL_DIR"
fi

echo "[4/7] Generating .env..."
cd "$COMPOSE_DIR"
if [ ! -f .env ]; then
  DB_PASS=$(openssl rand -hex 16)
  JWT_SEC=$(openssl rand -hex 32)
  cat > .env <<EOF
POSTGRES_USER=qixiu
POSTGRES_PASSWORD=${DB_PASS}
POSTGRES_DB=qixiu
JWT_SECRET=${JWT_SEC}
JWT_EXPIRES_IN=7d
AUTO_IDLE_HOURS=5
WEWORK_CORP_ID=
WEWORK_AGENT_ID=
WEWORK_SECRET=
MOBILE_BASE_URL=http://${PUBLIC_IP}:8081
PUBLIC_URL=http://${PUBLIC_IP}
EOF
  echo "  Created docker/.env"
else
  # Keep secrets but refresh public URLs
  sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=http://${PUBLIC_IP}|" .env
  sed -i "s|^MOBILE_BASE_URL=.*|MOBILE_BASE_URL=http://${PUBLIC_IP}:8081|" .env
  echo "  .env exists, updated PUBLIC_URL"
fi

echo "[5/7] Building images (first run may take 15-20 min on 2G RAM)..."
docker compose --env-file .env build --no-cache

echo "[6/7] Starting containers..."
docker compose --env-file .env up -d

echo "[7/7] Waiting for API health..."
ok=0
for i in $(seq 1 40); do
  if curl -sf "http://127.0.0.1/api/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  echo "  waiting... ($i/40)"
  sleep 5
done

if [ "$ok" -ne 1 ]; then
  echo "ERROR: API did not become healthy. Logs:"
  docker compose logs api --tail 40
  exit 1
fi

echo "Seeding database..."
docker compose exec -T api npx prisma db seed

echo ""
echo "=========================================="
echo " DEPLOY SUCCESS"
echo "=========================================="
echo " Admin:  http://${PUBLIC_IP}/"
echo " Mobile: http://${PUBLIC_IP}:8081/"
echo " API:    http://${PUBLIC_IP}/api/health"
echo " Login:  admin / admin123  (change password after login)"
echo "=========================================="
docker compose ps
