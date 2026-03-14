#!/bin/bash
# SMSOK Localhost Monitor — Continuous health check for app + workers
# Usage: ./scripts/monitor.sh              (one-shot)
#        ./scripts/monitor.sh --loop       (every 30s)
#        ./scripts/monitor.sh --loop 10    (every 10s)

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
INTERVAL="${2:-30}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_health() {
  local ts
  ts=$(date "+%H:%M:%S")

  echo "─────────────────────────────────────"
  echo "🕐 $ts | Checking $BASE_URL"
  echo "─────────────────────────────────────"

  # 1. Liveness
  local live_status
  live_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/live" 2>/dev/null || echo "000")
  if [ "$live_status" = "200" ]; then
    echo -e "  ${GREEN}✅ Liveness:  UP${NC} ($live_status)"
  else
    echo -e "  ${RED}❌ Liveness:  DOWN${NC} ($live_status)"
  fi

  # 2. Readiness
  local ready_status
  ready_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/ready" 2>/dev/null || echo "000")
  if [ "$ready_status" = "200" ]; then
    echo -e "  ${GREEN}✅ Readiness: UP${NC} ($ready_status)"
  else
    echo -e "  ${RED}❌ Readiness: DOWN${NC} ($ready_status) — DB unreachable?"
  fi

  # 3. Full health (DB + Redis + Queues + Memory)
  local health_json
  health_json=$(curl -s "$BASE_URL/api/health" 2>/dev/null || echo '{"status":"unreachable"}')
  local health_status
  health_status=$(echo "$health_json" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ "$health_status" = "healthy" ]; then
    echo -e "  ${GREEN}✅ Overall:   HEALTHY${NC}"
  elif [ "$health_status" = "degraded" ]; then
    echo -e "  ${YELLOW}⚠️  Overall:   DEGRADED${NC}"
  else
    echo -e "  ${RED}❌ Overall:   $health_status${NC}"
  fi

  # Parse details
  local db_status redis_status uptime_s mem_rss
  db_status=$(echo "$health_json" | grep -o '"database":{"status":"[^"]*"' | cut -d'"' -f6)
  redis_status=$(echo "$health_json" | grep -o '"redis":{"status":"[^"]*"' | cut -d'"' -f6 2>/dev/null || echo "unknown")
  uptime_s=$(echo "$health_json" | grep -o '"uptime":[0-9]*' | cut -d: -f2)
  mem_rss=$(echo "$health_json" | grep -o '"rss":[0-9]*' | cut -d: -f2)

  [ -n "$db_status" ] && echo "  📊 DB: $db_status | Redis: $redis_status | Uptime: ${uptime_s}s | RSS: ${mem_rss}MB"

  # 4. Docker containers (if running)
  if command -v docker &>/dev/null; then
    local containers
    containers=$(docker ps --filter "name=smsok" --format "{{.Names}}: {{.Status}}" 2>/dev/null)
    if [ -n "$containers" ]; then
      echo ""
      echo "  🐳 Docker containers:"
      echo "$containers" | while read -r line; do
        echo "     $line"
      done
    fi
  fi

  echo ""
}

# Run
if [ "${1:-}" = "--loop" ]; then
  echo "🔄 Monitoring $BASE_URL every ${INTERVAL}s (Ctrl+C to stop)"
  echo ""
  while true; do
    check_health
    sleep "$INTERVAL"
  done
else
  check_health
fi
