#!/bin/bash
set -euo pipefail

# ============================================
# Complete Production Server Setup — SMSOK Clone
# Installs Docker, configures firewall, GHCR auth,
# starts app + Watchtower for auto-deploy.
#
# After this setup: push to main → auto-deploy (no SSH needed)
#
# Usage:
#   GHCR_TOKEN=ghp_xxx bash server-setup.sh
#   Or run interactively (will prompt for token)
# ============================================

APP_DIR="/opt/smsok-clone"
IMAGE="ghcr.io/lambogreny/smsok-clone:latest"
GHCR_USER="${GHCR_USER:-lambogreny}"
APP_PORT=3458
WATCHTOWER_PORT=8080

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
fail() { echo -e "${RED}==>${NC} $1"; exit 1; }
step() { echo -e "\n${BLUE}[$1/9]${NC} $2"; }

echo ""
echo "================================================"
echo "  SMSOK Clone — Complete Production Setup"
echo "  Server → Docker → GHCR → Watchtower"
echo "  After setup: push to main = auto-deploy"
echo "================================================"
echo ""

# =============================================
# STEP 1: System packages
# =============================================
step 1 "System prerequisites"

# Detect OS
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS="$ID"
  log "OS: $PRETTY_NAME"
else
  OS="unknown"
  warn "Unknown OS — assuming Debian/Ubuntu"
fi

# Install basics
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq curl wget gnupg2 ca-certificates lsb-release software-properties-common jq
elif command -v yum >/dev/null 2>&1; then
  sudo yum install -y -q curl wget jq
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y -q curl wget jq
fi
log "System packages: OK"

# =============================================
# STEP 2: Install Docker
# =============================================
step 2 "Docker Engine"

if command -v docker >/dev/null 2>&1; then
  log "Docker already installed: $(docker --version)"
else
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo systemctl enable docker
  sudo systemctl start docker
  log "Docker installed: $(docker --version)"
fi

# Add current user to docker group (no sudo needed for docker commands)
if ! groups "$(whoami)" | grep -q docker; then
  sudo usermod -aG docker "$(whoami)"
  warn "Added $(whoami) to docker group — logout/login to take effect"
  warn "For now, using sudo for docker commands"
fi

# Verify Docker Compose V2
if docker compose version >/dev/null 2>&1; then
  log "Docker Compose: $(docker compose version --short)"
else
  fail "Docker Compose V2 not available — update Docker"
fi

# =============================================
# STEP 3: Firewall
# =============================================
step 3 "Firewall configuration"

if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 22/tcp comment 'SSH'
  sudo ufw allow 80/tcp comment 'HTTP'
  sudo ufw allow 443/tcp comment 'HTTPS'
  sudo ufw allow "$APP_PORT"/tcp comment 'SMSOK App'
  # Watchtower API — restrict to GitHub Actions IPs if possible
  sudo ufw allow "$WATCHTOWER_PORT"/tcp comment 'Watchtower API'
  sudo ufw --force enable
  log "UFW firewall: configured"
elif command -v firewall-cmd >/dev/null 2>&1; then
  sudo firewall-cmd --permanent --add-port=22/tcp
  sudo firewall-cmd --permanent --add-port=80/tcp
  sudo firewall-cmd --permanent --add-port=443/tcp
  sudo firewall-cmd --permanent --add-port="$APP_PORT"/tcp
  sudo firewall-cmd --permanent --add-port="$WATCHTOWER_PORT"/tcp
  sudo firewall-cmd --reload
  log "Firewalld: configured"
else
  warn "No firewall detected — configure manually (ports: 22, 80, 443, $APP_PORT, $WATCHTOWER_PORT)"
fi

# =============================================
# STEP 4: App directory structure
# =============================================
step 4 "App directory: $APP_DIR"

sudo mkdir -p "$APP_DIR"/{backups,scripts,config,logs}
sudo chown -R "$(whoami)" "$APP_DIR"
cd "$APP_DIR"
log "Directory structure created"

# =============================================
# STEP 5: GHCR Authentication
# =============================================
step 5 "GHCR (GitHub Container Registry) login"

if [ -z "${GHCR_TOKEN:-}" ]; then
  echo ""
  echo "   Watchtower needs GHCR access to pull images."
  echo "   Create a GitHub PAT (Classic) with 'read:packages' scope:"
  echo "   https://github.com/settings/tokens/new?scopes=read:packages"
  echo ""
  read -rsp "   Enter GHCR token (PAT): " GHCR_TOKEN
  echo ""
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin 2>/dev/null
DOCKER_CONFIG_DIR="${DOCKER_CONFIG:-$HOME/.docker}"
log "GHCR login: OK (credentials stored for Watchtower)"

# =============================================
# STEP 6: Configuration files
# =============================================
step 6 "Configuration files"

# Check if docker-compose exists, download if not
if [ ! -f docker-compose.prod.yml ]; then
  warn "docker-compose.prod.yml not found"
  echo "   Please copy these files to $APP_DIR:"
  echo "   scp docker-compose.prod.yml scripts/ .env.production.template $USER@$(hostname -I | awk '{print $1}'):$APP_DIR/"
  echo ""
  read -rp "   Press Enter after copying files..." _
fi

[ -f docker-compose.prod.yml ] || fail "docker-compose.prod.yml still not found"

# Generate .env if not exists
if [ ! -f .env ]; then
  if [ -f .env.production.template ]; then
    cp .env.production.template .env
  else
    # Create minimal .env
    cat > .env << 'ENVEOF'
NODE_ENV=production
ENVEOF
  fi

  # Auto-generate all secrets
  JWT_SECRET=$(openssl rand -hex 32)
  CRON_SECRET=$(openssl rand -hex 24)
  OTP_HASH_SECRET=$(openssl rand -hex 32)
  DB_PASSWORD=$(openssl rand -hex 16)
  DB_USER="smsok"
  DB_NAME="smsok"
  WATCHTOWER_TOKEN=$(openssl rand -hex 16)
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -sf ifconfig.me || echo "localhost")

  # Write complete .env
  cat > .env << ENVEOF
# ============================================
# SMSOK Clone — Production Environment
# Auto-generated by server-setup.sh at $(date -u '+%Y-%m-%d %H:%M:%S UTC')
# ============================================

# --- Database ---
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# --- Redis ---
REDIS_URL=redis://redis:6379

# --- Auth ---
JWT_SECRET=${JWT_SECRET}
CRON_SECRET=${CRON_SECRET}
OTP_HASH_SECRET=${OTP_HASH_SECRET}

# --- SMTP / Email ---
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=CHANGE_ME
SMTP_PASS=CHANGE_ME
SMTP_FROM="SMSOK Clone <no-reply@your-domain.com>"
SMTP_SECURE=false

# --- EasyThunder SMS Gateway ---
SMS_API_URL=https://sms-api.cl1.easythunder.com
SMS_API_USERNAME=CHANGE_ME
SMS_API_PASSWORD=CHANGE_ME

# --- EasySlip Payment Verification ---
EASYSLIP_API_KEY=CHANGE_ME
EASYSLIP_API_URL=https://developer.easyslip.com/api/v1

# --- App ---
NEXT_PUBLIC_APP_URL=http://${SERVER_IP}:${APP_PORT}
NODE_ENV=production

# --- Watchtower (auto-deploy) ---
WATCHTOWER_TOKEN=${WATCHTOWER_TOKEN}
DOCKER_CONFIG_PATH=${DOCKER_CONFIG_DIR}/config.json
WATCHTOWER_NOTIFY_URL=
ENVEOF

  log ".env created with auto-generated secrets"
  echo ""
  echo "   ============================================"
  echo "   SAVE THESE — you need them for GitHub Secrets:"
  echo "   ============================================"
  echo ""
  echo "   WATCHTOWER_URL    = http://${SERVER_IP}:${WATCHTOWER_PORT}"
  echo "   WATCHTOWER_TOKEN  = ${WATCHTOWER_TOKEN}"
  echo "   SERVER_HOST       = ${SERVER_IP}"
  echo ""
  echo "   ============================================"
  echo "   EDIT THESE in .env before continuing:"
  echo "   ============================================"
  echo ""
  echo "   SMS_API_USERNAME  = (from EasyThunder)"
  echo "   SMS_API_PASSWORD  = (from EasyThunder)"
  echo "   EASYSLIP_API_KEY  = (from EasySlip dashboard)"
  echo "   SMTP_HOST/PORT/USER/PASS/FROM = (your SMTP provider)"
  echo "   NEXT_PUBLIC_APP_URL = (your domain, or keep IP)"
  echo ""
  echo "   Edit: nano $APP_DIR/.env"
  echo ""
  read -rp "   Press Enter after editing .env (or Enter to continue)..." _
else
  log ".env already exists — keeping current config"
fi

# Copy scripts if available in current dir
for script in backup.sh uptime.sh restore.sh; do
  if [ -f "scripts/$script" ]; then
    chmod +x "scripts/$script"
    log "Script ready: scripts/$script"
  fi
done

# =============================================
# STEP 7: Pull and start services
# =============================================
step 7 "Pull images and start services"

log "Pulling Docker images..."
docker pull "$IMAGE" 2>&1 | tail -3
docker compose -f docker-compose.prod.yml pull 2>&1 | tail -5

log "Starting all services (app + postgres + redis + watchtower)..."
docker compose -f docker-compose.prod.yml up -d

# =============================================
# STEP 8: Health verification
# =============================================
step 8 "Health verification"

log "Waiting for app to be ready..."
APP_READY=false
for i in $(seq 1 12); do
  sleep 5
  if curl -sf http://localhost:$APP_PORT/api/health/ready > /dev/null 2>&1; then
    APP_READY=true
    break
  fi
  echo "   Attempt $i/12 — waiting..."
done

if [ "$APP_READY" = true ]; then
  log "App is HEALTHY!"
  HEALTH=$(curl -sf http://localhost:$APP_PORT/api/health 2>/dev/null || echo '{}')
  echo "   $HEALTH" | jq . 2>/dev/null || echo "   $HEALTH"
else
  warn "App not ready after 60s"
  echo "   Check logs: docker compose -f docker-compose.prod.yml logs app"
  echo "   Common issues:"
  echo "   - DATABASE_URL wrong → check .env"
  echo "   - Port conflict → check: ss -tlnp | grep $APP_PORT"
fi

# Verify Watchtower
if docker compose -f docker-compose.prod.yml ps watchtower 2>/dev/null | grep -q "running\|Up"; then
  log "Watchtower is RUNNING — auto-deploy active!"
else
  warn "Watchtower not running"
  echo "   Check: docker compose -f docker-compose.prod.yml logs watchtower"
fi

# =============================================
# STEP 9: Cron jobs + cleanup
# =============================================
step 9 "Cron jobs and final setup"

# Setup cron for backups and monitoring
CRON_BACKUP="0 3 * * * cd $APP_DIR && ./scripts/backup.sh daily >> $APP_DIR/logs/backup.log 2>&1"
CRON_UPTIME="*/5 * * * * cd $APP_DIR && ./scripts/uptime.sh >> $APP_DIR/logs/uptime.log 2>&1"
CRON_PRUNE="0 4 * * 0 docker image prune -af --filter 'until=168h' >> $APP_DIR/logs/prune.log 2>&1"

(crontab -l 2>/dev/null | grep -v smsok | grep -v "image prune"; \
  echo "$CRON_BACKUP"; \
  echo "$CRON_UPTIME"; \
  echo "$CRON_PRUNE") | crontab -

log "Cron jobs configured:"
echo "   - DB backup: daily at 3:00 AM"
echo "   - Uptime check: every 5 minutes"
echo "   - Docker prune: weekly (Sunday 4:00 AM)"

# Docker log rotation
if [ ! -f /etc/docker/daemon.json ]; then
  sudo mkdir -p /etc/docker
  sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "20m",
    "max-file": "5"
  }
}
EOF
  sudo systemctl restart docker 2>/dev/null || true
  log "Docker log rotation: configured"
fi

# =============================================
# DONE
# =============================================
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || curl -sf ifconfig.me 2>/dev/null || echo "SERVER_IP")

echo ""
echo "================================================"
echo "  SETUP COMPLETE!"
echo "================================================"
echo ""
echo "  App:          http://${SERVER_IP}:${APP_PORT}"
echo "  Health:       http://${SERVER_IP}:${APP_PORT}/api/health"
echo "  Watchtower:   http://${SERVER_IP}:${WATCHTOWER_PORT} (API)"
echo "  Backups:      $APP_DIR/backups/ (daily 3am)"
echo "  Logs:         $APP_DIR/logs/"
echo ""
echo "  ============================================"
echo "  AUTO-DEPLOY FLOW (no SSH needed):"
echo "  ============================================"
echo ""
echo "  push to main"
echo "    -> GitHub Actions builds Docker image"
echo "    -> pushes to ghcr.io"
echo "    -> triggers Watchtower API"
echo "    -> Watchtower pulls new image"
echo "    -> container restarts (zero-downtime)"
echo ""
echo "  ============================================"
echo "  GITHUB SECRETS (add to repo settings):"
echo "  ============================================"
echo ""
echo "  WATCHTOWER_URL   = http://${SERVER_IP}:${WATCHTOWER_PORT}"
echo "  WATCHTOWER_TOKEN = (from $APP_DIR/.env)"
echo "  SERVER_HOST      = ${SERVER_IP}"
echo ""
echo "  ============================================"
echo "  USEFUL COMMANDS:"
echo "  ============================================"
echo ""
echo "  docker compose -f docker-compose.prod.yml ps          # Status"
echo "  docker compose -f docker-compose.prod.yml logs -f app  # App logs"
echo "  docker compose -f docker-compose.prod.yml logs watchtower  # Deploy logs"
echo "  ./scripts/backup.sh manual                             # Manual backup"
echo ""
echo "================================================"
