#!/bin/bash
# SMSOK — Certbot Auto-Renewal Script
# Crontab: 0 3,15 * * * /opt/smsok-clone/certbot-renew.sh >> /var/log/smsok-certbot.log 2>&1
set -euo pipefail

DOMAIN="${DOMAIN:-smsok.9phum.me}"
LOG_PREFIX="[$(date -u +%Y-%m-%dT%H:%M:%SZ)] certbot-renew:"

echo "$LOG_PREFIX Starting certificate renewal check for $DOMAIN"

# Attempt renewal (certbot only renews if <30 days remaining)
if certbot renew --quiet --deploy-hook "systemctl reload nginx"; then
  echo "$LOG_PREFIX Renewal check completed successfully"
else
  echo "$LOG_PREFIX ERROR: Renewal failed!" >&2
  exit 1
fi

# Verify certificate is valid
if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
  EXPIRY=$(openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  echo "$LOG_PREFIX Certificate valid until: $EXPIRY"
else
  echo "$LOG_PREFIX WARNING: Could not verify certificate" >&2
fi
