#!/bin/bash
# ============================================
# Uptime Monitor Script for SMSOK Clone
# Usage: ./scripts/uptime.sh [url]
# Run via cron: */5 * * * * /opt/smsok-clone/scripts/uptime.sh
# ============================================

URL="${1:-http://localhost:3458/api/health}"
LOG_FILE="${LOG_FILE:-/var/log/smsok-uptime.log}"
ALERT_FILE="/tmp/smsok-last-alert"

check_health() {
  RESPONSE=$(curl -sf --max-time 10 "$URL" 2>/dev/null)
  CURL_EXIT=$?

  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  if [ $CURL_EXIT -ne 0 ]; then
    echo "$TIMESTAMP | DOWN | curl failed (exit $CURL_EXIT)" >> "$LOG_FILE"
    return 1
  fi

  STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  LATENCY=$(echo "$RESPONSE" | grep -o '"latency":[0-9]*' | head -1 | cut -d: -f2)
  DB=$(echo "$RESPONSE" | grep -o '"database":{"status":"[^"]*"' | head -1 | cut -d'"' -f6)

  if [ "$STATUS" = "healthy" ]; then
    echo "$TIMESTAMP | UP | latency=${LATENCY}ms db=$DB" >> "$LOG_FILE"
    # Clear alert state on recovery
    if [ -f "$ALERT_FILE" ]; then
      echo "$TIMESTAMP | RECOVERED | Service back online" >> "$LOG_FILE"
      rm -f "$ALERT_FILE"
    fi
    return 0
  else
    echo "$TIMESTAMP | DEGRADED | status=$STATUS db=$DB" >> "$LOG_FILE"
    return 1
  fi
}

if ! check_health; then
  # Only alert once per incident (check if we already alerted)
  if [ ! -f "$ALERT_FILE" ]; then
    touch "$ALERT_FILE"
    echo "ALERT: SMSOK Clone is DOWN at $(date)" >&2
    # Add webhook/email notification here:
    # curl -X POST "$SLACK_WEBHOOK" -d '{"text":"🚨 SMSOK Clone is DOWN!"}'
  fi
fi

# Rotate log (keep last 10000 lines)
if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE" 2>/dev/null)" -gt 10000 ]; then
  tail -5000 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi
