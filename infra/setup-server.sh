#!/bin/bash
# SMSOK Clone — Server Bootstrap Script
# Run on fresh server: curl -fsSL <url> | bash
# Or: scp setup-server.sh root@185.241.210.52: && ssh root@185.241.210.52 'bash setup-server.sh'
set -euo pipefail

DOMAIN="smsok.9phum.me"
APP_DIR="/opt/smsok-clone"
BACKUP_DIR="/opt/smsok-backups"

log() { printf '==> %s\n' "$1"; }

# ─── 1. Base packages ───
log "Installing base packages"
apt-get update -qq
apt-get install -y -qq ca-certificates curl git gnupg ufw nginx certbot python3-certbot-nginx

# ─── 2. Docker ───
if ! command -v docker &>/dev/null; then
  log "Installing Docker"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# ─── 3. Firewall ───
log "Configuring UFW"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── 4. App directory ───
log "Setting up $APP_DIR"
mkdir -p "$APP_DIR" "$BACKUP_DIR"

# ─── 5. SSL Certificate ───
log "Requesting SSL certificate for $DOMAIN"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@9phum.me --redirect || \
  log "Certbot failed — configure DNS A record first, then re-run: certbot --nginx -d $DOMAIN"

# ─── 6. Nginx config ───
log "Installing Nginx config"
if [ -f "$APP_DIR/infra/nginx.conf" ]; then
  cp "$APP_DIR/infra/nginx.conf" /etc/nginx/sites-available/smsok
  ln -sf /etc/nginx/sites-available/smsok /etc/nginx/sites-enabled/smsok
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
fi

# ─── 7. Backup cron ───
log "Setting up daily backup cron"
chmod +x "$APP_DIR/infra/backup.sh"
(crontab -l 2>/dev/null; echo "0 3 * * * $APP_DIR/infra/backup.sh >> /var/log/smsok-backup.log 2>&1") | sort -u | crontab -

# ─── 8. Docker login for GHCR ───
log "Docker login to GHCR (you'll need a GitHub PAT with packages:read)"
echo "Run: echo '<GITHUB_PAT>' | docker login ghcr.io -u lambogreny --password-stdin"

# ─── 9. Summary ───
log "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Create .env file:  cp $APP_DIR/.env.production.template $APP_DIR/.env"
echo "  2. Edit .env:         nano $APP_DIR/.env  (fill in all CHANGE_ME values)"
echo "  3. Docker login:      echo '<PAT>' | docker login ghcr.io -u lambogreny --password-stdin"
echo "  4. Deploy:            cd $APP_DIR && docker compose -f docker-compose.prod.yml --env-file .env up -d"
echo "  5. Run migration:     docker compose exec app npx prisma migrate deploy"
echo "  6. Run seed:          docker compose exec app npx prisma db seed"
echo "  7. Verify:            curl https://$DOMAIN/api/health"
echo ""
echo "GitHub Actions secrets needed:"
echo "  SSH_HOST=185.241.210.52"
echo "  SSH_PRIVATE_KEY=<private key>"
echo "  WATCHTOWER_TOKEN=<from .env>"
