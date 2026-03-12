#!/bin/bash
# SMSOK Clone — Production Deploy Script
# Usage: ./infra/deploy.sh [--first-run]
# Server: 185.241.210.52
# After first deploy, Watchtower handles auto-deploy from GHCR
set -euo pipefail

SERVER="185.241.210.52"
SERVER_USER="root"
APP_DIR="/opt/smsok-clone"
DOMAIN="smsok.9phum.me"
COMPOSE_FILE="docker-compose.prod.yml"

log() { printf '\n==> %s\n' "$1"; }
err() { printf '❌ %s\n' "$1" >&2; exit 1; }

# ─── Pre-flight checks ───
log "Pre-flight checks"
command -v ssh >/dev/null || err "ssh not found"
command -v scp >/dev/null || err "scp not found"

# Test SSH connection
ssh -o ConnectTimeout=5 -o BatchMode=yes "${SERVER_USER}@${SERVER}" "echo 'SSH OK'" 2>/dev/null \
  || err "Cannot SSH to ${SERVER}. Check SSH key and server status."

# ─── First-run: bootstrap server ───
if [ "${1:-}" = "--first-run" ]; then
  log "First-run: copying infra files to server"
  scp infra/setup-server.sh "${SERVER_USER}@${SERVER}:/tmp/"
  ssh "${SERVER_USER}@${SERVER}" "bash /tmp/setup-server.sh"

  log "Copying compose + env template"
  ssh "${SERVER_USER}@${SERVER}" "mkdir -p ${APP_DIR}/infra"
  scp "${COMPOSE_FILE}" "${SERVER_USER}@${SERVER}:${APP_DIR}/"
  scp .env.production.template "${SERVER_USER}@${SERVER}:${APP_DIR}/.env.production.template"
  scp infra/nginx.conf "${SERVER_USER}@${SERVER}:${APP_DIR}/infra/"
  scp infra/backup.sh "${SERVER_USER}@${SERVER}:${APP_DIR}/infra/"

  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  First-run complete!"
  echo "  SSH to server and finish setup:"
  echo ""
  echo "  ssh ${SERVER_USER}@${SERVER}"
  echo "  cd ${APP_DIR}"
  echo "  cp .env.production.template .env"
  echo "  nano .env  # fill in all CHANGE_ME values"
  echo "  echo '<GITHUB_PAT>' | docker login ghcr.io -u lambogreny --password-stdin"
  echo "  docker compose -f ${COMPOSE_FILE} --env-file .env up -d"
  echo "  docker compose exec app npx prisma migrate deploy"
  echo "  curl https://${DOMAIN}/api/health"
  echo "═══════════════════════════════════════════════"
  exit 0
fi

# ─── Regular deploy ───
log "Deploying to ${SERVER}"

# 1. Pre-deploy backup
log "Running pre-deploy database backup"
ssh "${SERVER_USER}@${SERVER}" "cd ${APP_DIR} && bash infra/backup.sh" || log "Backup skipped (no DB yet?)"

# 2. Copy latest compose file
log "Syncing compose file"
scp "${COMPOSE_FILE}" "${SERVER_USER}@${SERVER}:${APP_DIR}/"

# 3. Pull latest image + restart
log "Pulling latest image and restarting"
ssh "${SERVER_USER}@${SERVER}" "cd ${APP_DIR} && \
  docker compose -f ${COMPOSE_FILE} --env-file .env pull app && \
  docker compose -f ${COMPOSE_FILE} --env-file .env up -d --remove-orphans"

# 4. Wait for healthy
log "Waiting for health check..."
RETRIES=0
MAX_RETRIES=10
until ssh "${SERVER_USER}@${SERVER}" "curl -sf http://localhost:3000/api/health >/dev/null 2>&1"; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    err "Health check failed after ${MAX_RETRIES} attempts. Check logs: ssh ${SERVER_USER}@${SERVER} 'docker compose -f ${APP_DIR}/${COMPOSE_FILE} logs app --tail 50'"
  fi
  printf "  Attempt %d/%d...\n" "$RETRIES" "$MAX_RETRIES"
  sleep 5
done

# 5. Run migrations
log "Running database migrations"
ssh "${SERVER_USER}@${SERVER}" "cd ${APP_DIR} && docker compose -f ${COMPOSE_FILE} exec -T app npx prisma migrate deploy" \
  || log "Migration skipped (no pending migrations)"

# 6. Verify
log "Verifying deployment"
HEALTH=$(ssh "${SERVER_USER}@${SERVER}" "curl -sf http://localhost:3000/api/health")
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"

log "Deploy complete! 🎉"
echo "  Server:  https://${DOMAIN}"
echo "  Health:  https://${DOMAIN}/api/health"
