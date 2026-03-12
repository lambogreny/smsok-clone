#!/bin/bash
# SMSOK — Uptime Monitor
# Checks :3000 (smsok-clone) + :3001 (backoffice) every 5 minutes
# Crontab: */5 * * * * /opt/smsok-clone/infra/uptime-check.sh >> /var/log/smsok-uptime.log 2>&1
set -uo pipefail

SMSOK_URL="${SMSOK_URL:-http://localhost:3000}"
BACKOFFICE_URL="${BACKOFFICE_URL:-http://localhost:3001}"
HEALTH_ENDPOINT="/api/health"
TIMEOUT=10
LOG_FILE="/var/log/smsok-uptime.log"

log() { printf '[%s] %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$1"; }

check_service() {
  local name="$1"
  local url="$2"
  local status
  local response_time

  response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "$url" 2>/dev/null)
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null)

  if [ "$status" -ge 200 ] && [ "$status" -lt 400 ]; then
    log "$name: UP (HTTP $status, ${response_time}s)"
    return 0
  else
    log "$name: DOWN (HTTP $status)"
    return 1
  fi
}

# Check services
FAILED=0

check_service "smsok-clone:3000" "$SMSOK_URL" || FAILED=$((FAILED + 1))
check_service "backoffice:3001" "$BACKOFFICE_URL" || FAILED=$((FAILED + 1))

# Check health endpoint if available
if [ "$FAILED" -eq 0 ]; then
  check_service "smsok-health" "${SMSOK_URL}${HEALTH_ENDPOINT}" || true
fi

# Alert if any service is down
if [ "$FAILED" -gt 0 ]; then
  log "ALERT: $FAILED service(s) DOWN!"
  # TODO: Send alert (webhook, email, Slack)
  # curl -X POST "$SLACK_WEBHOOK" -d "{\"text\":\"🔴 SMSOK: $FAILED service(s) DOWN!\"}"
  exit 1
fi

log "All services healthy"
