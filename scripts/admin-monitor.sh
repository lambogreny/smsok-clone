#!/bin/bash
# SMSOK Admin Backoffice Monitor
# Usage: ./scripts/admin-monitor.sh              (one-shot)
#        ./scripts/admin-monitor.sh --loop       (every 60s)

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
INTERVAL="${2:-60}"
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

check_admin() {
  local ts
  ts=$(date "+%H:%M:%S")

  echo "═══════════════════════════════════════════"
  echo -e "${CYAN}🔒 Admin Backoffice Monitor — $ts${NC}"
  echo "═══════════════════════════════════════════"

  # 1. Admin auth endpoint health
  local admin_auth_status
  admin_auth_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/admin/auth" 2>/dev/null || echo "000")
  if [ "$admin_auth_status" = "401" ] || [ "$admin_auth_status" = "405" ]; then
    echo -e "  ${GREEN}✅ Admin Auth endpoint: reachable${NC} ($admin_auth_status)"
  elif [ "$admin_auth_status" = "200" ]; then
    echo -e "  ${GREEN}✅ Admin Auth endpoint: UP${NC}"
  else
    echo -e "  ${RED}❌ Admin Auth endpoint: $admin_auth_status${NC}"
  fi

  # 2. Audit log count (via health endpoint)
  local health_json
  health_json=$(curl -s "$BASE_URL/api/health" 2>/dev/null)
  local db_status
  db_status=$(echo "$health_json" | grep -o '"database":{"status":"[^"]*"' | cut -d'"' -f6)

  if [ "$db_status" = "ok" ]; then
    echo -e "  ${GREEN}✅ Database: OK${NC} (audit logs writable)"
  else
    echo -e "  ${RED}❌ Database: $db_status${NC} (audit logs may fail!)"
  fi

  # 3. Rate limiting check
  local redis_status
  redis_status=$(echo "$health_json" | grep -o '"redis":{"status":"[^"]*"' | cut -d'"' -f6 2>/dev/null || echo "unknown")
  if [ "$redis_status" = "ok" ]; then
    echo -e "  ${GREEN}✅ Redis: OK${NC} (queue/cache active)"
  else
    echo -e "  ${YELLOW}⚠️  Redis: $redis_status${NC} (queue/cache unavailable!)"
  fi

  # 4. Security headers check
  local headers
  headers=$(curl -sI "$BASE_URL/" 2>/dev/null)

  local hsts
  hsts=$(echo "$headers" | grep -i "strict-transport-security" | head -1)
  local xfo
  xfo=$(echo "$headers" | grep -i "x-frame-options" | head -1)
  local xcto
  xcto=$(echo "$headers" | grep -i "x-content-type-options" | head -1)

  echo ""
  echo -e "  ${CYAN}Security Headers:${NC}"
  [ -n "$hsts" ] && echo -e "    ${GREEN}✅ HSTS${NC}" || echo -e "    ${YELLOW}⚠️  HSTS missing${NC}"
  [ -n "$xfo" ] && echo -e "    ${GREEN}✅ X-Frame-Options${NC}" || echo -e "    ${YELLOW}⚠️  X-Frame-Options missing${NC}"
  [ -n "$xcto" ] && echo -e "    ${GREEN}✅ X-Content-Type-Options${NC}" || echo -e "    ${YELLOW}⚠️  X-Content-Type-Options missing${NC}"

  # 5. Memory + uptime
  local mem_rss uptime_s
  mem_rss=$(echo "$health_json" | grep -o '"rss":[0-9]*' | cut -d: -f2)
  uptime_s=$(echo "$health_json" | grep -o '"uptime":[0-9]*' | cut -d: -f2)

  echo ""
  echo -e "  ${CYAN}System:${NC}"
  echo "    Memory RSS: ${mem_rss}MB | Uptime: ${uptime_s}s"

  echo ""
}

# Run
if [ "${1:-}" = "--loop" ]; then
  echo "🔒 Admin monitoring every ${INTERVAL}s (Ctrl+C to stop)"
  echo ""
  while true; do
    check_admin
    sleep "$INTERVAL"
  done
else
  check_admin
fi
