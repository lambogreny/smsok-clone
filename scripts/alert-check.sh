#!/bin/bash
# SMSOK Alert Check — Detect stuck workers + suspicious patterns
# Usage: ./scripts/alert-check.sh              (one-shot)
#        ./scripts/alert-check.sh --loop       (every 60s)

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
INTERVAL="${2:-60}"
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

check_alerts() {
  local ts
  ts=$(date "+%H:%M:%S")
  echo "─── Alert Check $ts ───"

  # 1. Worker health + stuck jobs
  local worker_json
  worker_json=$(curl -s "$BASE_URL/api/health/worker" 2>/dev/null || echo '{"status":"unreachable"}')
  local worker_status
  worker_status=$(echo "$worker_json" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ "$worker_status" = "ok" ]; then
    echo -e "  ${GREEN}✅ Workers: OK${NC}"
  elif [ "$worker_status" = "degraded" ]; then
    echo -e "  ${YELLOW}⚠️  Workers: DEGRADED${NC}"
  else
    echo -e "  ${RED}❌ Workers: $worker_status${NC}"
  fi

  # Check alerts array
  local alerts
  alerts=$(echo "$worker_json" | grep -o '"alerts":\[[^]]*\]' | sed 's/"alerts":\[//;s/\]//')
  if [ -n "$alerts" ] && [ "$alerts" != "" ]; then
    echo -e "  ${RED}🚨 ALERTS:${NC}"
    echo "$alerts" | tr ',' '\n' | sed 's/"//g' | while read -r alert; do
      [ -n "$alert" ] && echo -e "     ${RED}→ $alert${NC}"
    done
  fi

  # 2. Queue stats summary
  local failed_total=0
  for queue_name in sms:otp sms:single sms:batch sms:campaign sms:webhook email slip:verify sms:dlq; do
    local failed
    failed=$(echo "$worker_json" | grep -o "\"$queue_name\":{[^}]*}" | grep -o '"failed":[0-9]*' | cut -d: -f2 2>/dev/null)
    if [ -n "$failed" ] && [ "$failed" -gt 0 ]; then
      echo -e "  ${YELLOW}⚠️  $queue_name: $failed failed jobs${NC}"
      failed_total=$((failed_total + failed))
    fi
  done

  if [ "$failed_total" -eq 0 ]; then
    echo -e "  ${GREEN}✅ No failed jobs${NC}"
  fi

  echo ""
}

# Run
if [ "${1:-}" = "--loop" ]; then
  echo "🔔 Alert monitoring $BASE_URL every ${INTERVAL}s (Ctrl+C to stop)"
  echo ""
  while true; do
    check_alerts
    sleep "$INTERVAL"
  done
else
  check_alerts
fi
