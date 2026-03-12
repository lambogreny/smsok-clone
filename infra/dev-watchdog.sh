#!/bin/bash
# SMSOK Dev Watchdog — Auto-restart dev server on health check failure
# Usage: ./infra/dev-watchdog.sh [--daemon]
# Crontab: */2 * * * * cd /Users/lambogreny/oracles/smsok-clone && ./infra/dev-watchdog.sh >> /tmp/smsok-watchdog.log 2>&1
set -uo pipefail

CLONE_DIR="/Users/lambogreny/oracles/smsok-clone"
CLONE_PORT=3000
BACKOFFICE_DIR="/Users/lambogreny/oracles/smsok-backoffice"
BACKOFFICE_PORT=3001
TIMEOUT=10
MAX_RETRIES=3
LOG="/tmp/smsok-watchdog.log"
LOCKFILE="/tmp/smsok-watchdog.lock"

log() { printf '[%s] %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$1" | tee -a "$LOG"; }

# Prevent concurrent runs
if [ -f "$LOCKFILE" ]; then
  LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null)
  if kill -0 "$LOCK_PID" 2>/dev/null; then
    exit 0
  fi
  rm -f "$LOCKFILE"
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

health_check() {
  local port="$1"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "http://localhost:${port}" 2>/dev/null)
  [ "$status" -ge 200 ] && [ "$status" -lt 500 ]
}

restart_server() {
  local name="$1"
  local dir="$2"
  local port="$3"

  log "RESTART: Killing existing process on port $port"

  # Kill existing process
  local pids
  pids=$(lsof -ti ":$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null
    sleep 2
  fi

  log "RESTART: Starting $name on port $port"
  cd "$dir" || return 1
  nohup bun dev --port "$port" > "/tmp/smsok-${name}.log" 2>&1 &
  disown

  # Wait for startup
  local attempt=0
  while [ $attempt -lt 15 ]; do
    sleep 2
    if health_check "$port"; then
      log "RESTART: $name on port $port — UP ✅"
      return 0
    fi
    attempt=$((attempt + 1))
  done

  log "RESTART: $name FAILED to start after 30s ❌"
  return 1
}

check_and_restart() {
  local name="$1"
  local dir="$2"
  local port="$3"
  local failures=0

  for i in $(seq 1 $MAX_RETRIES); do
    if health_check "$port"; then
      return 0
    fi
    failures=$((failures + 1))
    sleep 2
  done

  log "ALERT: $name on port $port — FAILED $failures/$MAX_RETRIES health checks"
  restart_server "$name" "$dir" "$port"
}

# Check both services
check_and_restart "smsok-clone" "$CLONE_DIR" "$CLONE_PORT"
check_and_restart "backoffice" "$BACKOFFICE_DIR" "$BACKOFFICE_PORT"

log "Watchdog check complete"
