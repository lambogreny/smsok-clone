#!/bin/bash
# SMSOK Clone — Restore Test (custom format)
# Verifies that backups can be restored to a temporary database.
# Crontab: 0 4 1 * * /opt/smsok-clone/infra/restore-test.sh >> /var/log/smsok-restore-test.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/smsok-backups}"
CONTAINER="${CONTAINER:-smsok-clone-postgres-1}"
DB_USER="${DB_USER:-smsok}"
DB_NAME="${DB_NAME:-smsok}"
TEST_DB="${DB_NAME}_restore_test"

log() { printf '[%s] %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$1"; }

# Find latest backup (.dump = custom format, .sql.gz = legacy)
LATEST=$(find "$BACKUP_DIR" -name "*.dump" -type f | sort | tail -1)
if [ -z "$LATEST" ]; then
  LATEST=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | sort | tail -1)
fi
if [ -z "$LATEST" ]; then
  log "ERROR: No backup files found in $BACKUP_DIR"
  exit 1
fi
log "Testing restore from: $LATEST"

# Create test database
docker exec "$CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null
docker exec "$CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE $TEST_DB;"
log "Test database created: $TEST_DB"

# Restore based on format
if [[ "$LATEST" == *.dump ]]; then
  docker exec -i "$CONTAINER" pg_restore -U "$DB_USER" -d "$TEST_DB" --no-owner --no-acl < "$LATEST"
else
  gunzip -c "$LATEST" | docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$TEST_DB" -q 2>/dev/null
fi

# Verify: count tables and rows
TABLE_COUNT=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$TEST_DB" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
ROW_COUNT=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$TEST_DB" -tAc \
  "SELECT coalesce(sum(n_live_tup), 0) FROM pg_stat_user_tables;")

log "Restore verified: $TABLE_COUNT tables, ~$ROW_COUNT rows"

if [ "$TABLE_COUNT" -lt 5 ]; then
  log "ERROR: Too few tables ($TABLE_COUNT) — backup may be corrupted"
  docker exec "$CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $TEST_DB;"
  exit 1
fi

# Cleanup test database
docker exec "$CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $TEST_DB;"
log "Test database dropped — restore test PASSED"
