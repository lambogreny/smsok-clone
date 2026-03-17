#!/usr/bin/env bash
set -euo pipefail

# SMSOK Deploy Script — run on server 103.114.203.44
# Usage: ssh root@103.114.203.44 'bash -s' < scripts/deploy.sh

echo "=== SMSOK Deploy $(date '+%Y-%m-%d %H:%M:%S') ==="

# 1. smsok-clone
echo "[1/2] Deploying smsok-clone..."
cd /root/smsok-clone
git pull origin main
bun install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
bun run build
# Copy static assets for standalone mode (Next.js standalone doesn't include these)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp .env .next/standalone/.env 2>/dev/null || true
pm2 restart smsok || pm2 start bun --name smsok -- run start
echo "[1/2] smsok-clone deployed!"

# 2. smsok-backoffice
echo "[2/2] Deploying smsok-backoffice..."
cd /root/smsok-backoffice
git pull origin main
bun install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d --build
echo "[2/2] smsok-backoffice deployed!"

# Post-deploy verification
echo ""
echo "--- Post-deploy verification ---"
sleep 3
CLONE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/ready || echo "FAIL")
echo "smsok-clone health: $CLONE_STATUS"
BACKOFFICE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login || echo "FAIL")
echo "smsok-backoffice: $BACKOFFICE_STATUS"

if [ "$CLONE_STATUS" = "200" ] && [ "$BACKOFFICE_STATUS" = "200" ]; then
  echo "=== DEPLOY SUCCESS ==="
else
  echo "=== DEPLOY WARNING: check failed services ==="
  exit 1
fi
