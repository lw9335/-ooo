#!/usr/bin/env bash
# One-click server bootstrap for Aliyun ECS (Ubuntu).
# Run as root on the server:
#   curl -fsSL https://raw.githubusercontent.com/lw9335/-ooo/main/docker/setup-server.sh | bash
set -e

PUBLIC_IP="${PUBLIC_IP:-8.148.193.66}"
REPO="https://github.com/lw9335/-ooo.git"
INSTALL_DIR="/opt/qixiu"

echo "=========================================="
echo " QiXiu Dispatch System - Server Setup"
echo " Public IP: $PUBLIC_IP"
echo "=========================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root: sudo bash setup-server.sh"
  exit 1
fi

echo "[1/6] Installing Docker..."
install_docker() {
  apt-get update -qq
  apt-get install -y -qq docker.io docker-compose-v2 curl git ca-certificates openssl
  systemctl enable --now docker
}
if ! command -v docker >/dev/null 2>&1; then
  echo "  Using Ubuntu apt (works on Aliyun, no download.docker.com)..."
  install_docker || {
    echo "  apt install failed, trying Aliyun mirror..."
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun || install_docker
    systemctl enable --now docker
  }
fi
docker --version
docker compose version 2>/dev/null || docker-compose --version

echo "[3/6] Cloning repository..."
if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR"
  git pull --ff-only
else
  git clone "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "[4/6] Generating .env..."
cd "$INSTALL_DIR/docker"
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
  echo "  Created docker/.env with random DB password and JWT secret"
else
  echo "  .env already exists, keeping it"
fi

echo "[5/6] Building and starting containers (may take 5-10 min on first run)..."
docker compose --env-file .env up -d --build

echo "[6/6] Waiting for API and seeding database..."
sleep 15
docker compose exec -T api npx prisma db seed || true

echo ""
echo "=========================================="
echo " DEPLOY SUCCESS"
echo "=========================================="
echo " Admin:  http://${PUBLIC_IP}/"
echo " Mobile: http://${PUBLIC_IP}:8081/"
echo " API:    http://${PUBLIC_IP}/api/health"
echo " Login:  admin / admin123  (change password after login)"
echo ""
echo " Security group must allow: 22, 80, 8081"
echo " WeCom: fill WEWORK_* in ${INSTALL_DIR}/docker/.env then:"
echo "   cd ${INSTALL_DIR}/docker && docker compose up -d --build api mobile"
echo "=========================================="
docker compose ps
