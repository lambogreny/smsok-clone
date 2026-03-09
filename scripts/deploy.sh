#!/bin/bash
set -euo pipefail
SERVER="${SERVER_HOST:-185.241.210.52}"
USER="${SERVER_USER:-byteder}"
APP_DIR="${APP_DIR:-/opt/smsok-clone}"

echo "==> Deploying smsok-clone to $SERVER"
ssh "$USER@$SERVER" "cd $APP_DIR && git pull origin main"
echo "==> Building and restarting..."
ssh "$USER@$SERVER" "cd $APP_DIR && docker compose down && docker compose build --no-cache && docker compose up -d"
sleep 5
ssh "$USER@$SERVER" "docker compose -f $APP_DIR/docker-compose.yml ps"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://$SERVER:3458")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
  echo "==> Deploy SUCCESS — HTTP $HTTP_CODE"
else
  echo "==> WARNING — HTTP $HTTP_CODE"
  exit 1
fi
ssh "$USER@$SERVER" "docker image prune -f"
echo "==> Done!"
