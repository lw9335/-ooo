#!/usr/bin/env bash
# Native deploy on Aliyun ECS when Docker Hub / mirrors are unavailable.
# Run as root on Ubuntu 24.04:
#   curl -fsSL https://raw.githubusercontent.com/lw9335/-ooo/main/docker/deploy-native.sh | PUBLIC_IP=8.148.193.66 bash
set -e

PUBLIC_IP="${PUBLIC_IP:-8.148.193.66}"
INSTALL_DIR="/opt/qixiu"
REPO="https://github.com/lw9335/-ooo.git"

echo "=========================================="
echo " QiXiu Native Deploy (no Docker images pull)"
echo " Public IP: $PUBLIC_IP"
echo "=========================================="

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

echo "[1/8] Installing system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx postgresql postgresql-contrib redis-server openssl ca-certificates

echo "[2/8] Installing Node.js 20..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
node -v
npm -v

echo "[3/8] Cloning repository..."
if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR" && git pull --ff-only
else
  git clone "$REPO" "$INSTALL_DIR"
fi

echo "[4/8] Configuring PostgreSQL..."
DB_PASS=$(grep POSTGRES_PASSWORD "$INSTALL_DIR/docker/.env" 2>/dev/null | cut -d= -f2)
if [ -z "$DB_PASS" ] || [ "$DB_PASS" = "please_change_this_password" ]; then
  DB_PASS=$(openssl rand -hex 16)
fi
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='qixiu'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER qixiu WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='qixiu'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE qixiu OWNER qixiu;"
sudo -u postgres psql -c "ALTER USER qixiu WITH PASSWORD '${DB_PASS}';"

JWT_SEC=$(openssl rand -hex 32)
cat > "$INSTALL_DIR/apps/api/.env" <<EOF
NODE_ENV=production
API_PORT=3000
DATABASE_URL=postgresql://qixiu:${DB_PASS}@127.0.0.1:5432/qixiu?schema=public
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=${JWT_SEC}
JWT_EXPIRES_IN=7d
AUTO_IDLE_HOURS=5
WEWORK_CORP_ID=
WEWORK_AGENT_ID=
WEWORK_SECRET=
MOBILE_BASE_URL=http://${PUBLIC_IP}:8081
EOF

echo "[5/8] Building API..."
cd "$INSTALL_DIR/apps/api"
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npx prisma db seed || true

echo "[6/8] Building admin & mobile..."
cd "$INSTALL_DIR/apps/admin"
npm install
npm run build

cd "$INSTALL_DIR/apps/mobile"
npm install
VITE_API_BASE_URL="http://${PUBLIC_IP}" npm run build

echo "[7/8] Installing PM2 and starting API..."
npm install -g pm2
cd "$INSTALL_DIR/apps/api"
pm2 delete qixiu-api 2>/dev/null || true
pm2 start dist/main.js --name qixiu-api
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "[8/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/qixiu <<NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    location / {
        root ${INSTALL_DIR}/apps/admin/dist;
        try_files \$uri \$uri/ /index.html;
    }
}

server {
    listen 8081;
    listen [::]:8081;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host \$host;
    }

    location / {
        root ${INSTALL_DIR}/apps/mobile/dist;
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/qixiu /etc/nginx/sites-enabled/qixiu
nginx -t && systemctl reload nginx

echo ""
echo "=========================================="
echo " DEPLOY SUCCESS (Native Mode)"
echo "=========================================="
echo " Admin:  http://${PUBLIC_IP}/"
echo " Mobile: http://${PUBLIC_IP}:8081/"
echo " API:    http://${PUBLIC_IP}/api/health"
echo " Login:  admin / admin123"
echo " DB password saved in: ${INSTALL_DIR}/apps/api/.env"
echo "=========================================="
pm2 status
