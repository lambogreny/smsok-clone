#!/bin/bash
# SMSOK Log Aggregation — View and search logs from all sources
# Usage: ./scripts/logs.sh                    (tail all logs)
#        ./scripts/logs.sh --docker           (Docker container logs)
#        ./scripts/logs.sh --search "error"   (search keyword)
#        ./scripts/logs.sh --failed           (failed jobs only)
#        ./scripts/logs.sh --payment          (payment/slip events)
#        ./scripts/logs.sh --stats            (log summary stats)

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

show_docker_logs() {
  echo -e "${CYAN}🐳 Docker Container Logs (last 50 lines each)${NC}"
  echo "═══════════════════════════════════════════"

  for container in smsok-clone-postgres-1 smsok-clone-redis-1; do
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$container"; then
      echo -e "\n${GREEN}── $container ──${NC}"
      docker logs --tail 20 "$container" 2>&1 | tail -20
    fi
  done
}

show_worker_stats() {
  echo -e "${CYAN}📊 Worker Queue Stats${NC}"
  echo "═══════════════════════════════════════════"

  local worker_json
  worker_json=$(curl -s "$BASE_URL/api/health/worker" 2>/dev/null)

  if [ -z "$worker_json" ] || echo "$worker_json" | grep -q "unreachable"; then
    echo -e "${RED}❌ App not running${NC}"
    return
  fi

  echo "$worker_json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f\"  Status: {data.get('status', '?')} | Redis: {data.get('redis', '?')} | Latency: {data.get('latency', '?')}ms\")
    print()
    print(f\"  {'Queue':<20} {'Active':>7} {'Wait':>7} {'Done':>7} {'Fail':>7} {'Delay':>7}\")
    print(f\"  {'─'*20} {'─'*7} {'─'*7} {'─'*7} {'─'*7} {'─'*7}\")
    for name, stats in data.get('queues', {}).items():
        a = stats.get('active', 0)
        w = stats.get('waiting', 0)
        c = stats.get('completed', 0)
        f = stats.get('failed', 0)
        d = stats.get('delayed', 0)
        fail_marker = ' ⚠️' if f > 0 else ''
        print(f\"  {name:<20} {a:>7} {w:>7} {c:>7} {f:>7} {d:>7}{fail_marker}\")
    alerts = data.get('alerts', [])
    if alerts:
        print()
        print('  🚨 ALERTS:')
        for a in alerts:
            print(f'     → {a}')
except Exception as e:
    print(f'  Parse error: {e}')
" 2>/dev/null || echo "$worker_json"
}

show_failed_jobs() {
  echo -e "${CYAN}❌ Failed Jobs Detail${NC}"
  echo "═══════════════════════════════════════════"

  local health_json
  health_json=$(curl -s "$BASE_URL/api/health" 2>/dev/null)
  local worker_json
  worker_json=$(curl -s "$BASE_URL/api/health/worker" 2>/dev/null)

  echo "$worker_json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    has_failed = False
    for name, stats in data.get('queues', {}).items():
        f = stats.get('failed', 0)
        if f > 0:
            has_failed = True
            print(f'  ⚠️  {name}: {f} failed jobs')
    if not has_failed:
        print('  ✅ No failed jobs across all queues')
except:
    print('  Cannot parse worker data')
" 2>/dev/null
}

show_payment_events() {
  echo -e "${CYAN}💳 Payment/Slip Events${NC}"
  echo "═══════════════════════════════════════════"

  local worker_json
  worker_json=$(curl -s "$BASE_URL/api/health/worker" 2>/dev/null)

  echo "$worker_json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    slip = data.get('queues', {}).get('slip-verify', {})
    print(f\"  Slip Verification Queue:\")
    print(f\"    Active:    {slip.get('active', 0)}\")
    print(f\"    Waiting:   {slip.get('waiting', 0)}\")
    print(f\"    Completed: {slip.get('completed', 0)}\")
    print(f\"    Failed:    {slip.get('failed', 0)}\")
    print(f\"    Delayed:   {slip.get('delayed', 0)}\")

    dlq = data.get('queues', {}).get('sms-dlq', {})
    dlq_total = dlq.get('waiting', 0) + dlq.get('completed', 0)
    if dlq_total > 0:
        print(f\"\n  ⚠️  DLQ has {dlq_total} entries — check for failed slip verifications\")
    else:
        print(f\"\n  ✅ DLQ empty — no failed verifications\")
except:
    print('  Cannot parse data')
" 2>/dev/null
}

show_stats() {
  echo -e "${CYAN}📈 System Stats${NC}"
  echo "═══════════════════════════════════════════"

  # App health
  local health_json
  health_json=$(curl -s "$BASE_URL/api/health" 2>/dev/null)

  echo "$health_json" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    mem = data.get('memory', {})
    checks = data.get('checks', {})
    print(f\"  App Status:  {data.get('status', '?')}\")
    print(f\"  Uptime:      {data.get('uptime', 0)}s\")
    print(f\"  Memory RSS:  {mem.get('rss', '?')}MB\")
    print(f\"  Heap Used:   {mem.get('heap', '?')}MB / {mem.get('heapTotal', '?')}MB\")
    print(f\"  DB:          {checks.get('database', {}).get('status', '?')} ({checks.get('database', {}).get('latency', '?')}ms)\")
    print(f\"  Redis:       {checks.get('redis', {}).get('status', '?')}\")
except:
    print('  Cannot parse health data')
" 2>/dev/null

  echo ""
  show_worker_stats
}

# Main
case "${1:-}" in
  --docker)
    show_docker_logs
    ;;
  --search)
    keyword="${2:-error}"
    echo -e "${CYAN}🔍 Searching Docker logs for: '$keyword'${NC}"
    docker logs smsok-clone-postgres-1 2>&1 | grep -i "$keyword" | tail -20
    docker logs smsok-clone-redis-1 2>&1 | grep -i "$keyword" | tail -20
    ;;
  --failed)
    show_failed_jobs
    ;;
  --payment)
    show_payment_events
    ;;
  --stats)
    show_stats
    ;;
  --help)
    echo "Usage: ./scripts/logs.sh [option]"
    echo "  (no args)   System stats overview"
    echo "  --docker    Docker container logs"
    echo "  --search X  Search logs for keyword X"
    echo "  --failed    Show failed jobs"
    echo "  --payment   Payment/slip verification events"
    echo "  --stats     Full system stats"
    ;;
  *)
    show_stats
    ;;
esac
