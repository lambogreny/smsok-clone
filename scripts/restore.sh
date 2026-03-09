#!/bin/bash
set -euo pipefail

# ============================================
# PostgreSQL Restore Script for SMSOK Clone
# Usage: ./scripts/restore.sh <backup_file.sql.gz>
# ============================================

if [ -z "${1:-}" ]; then
  BACKUP_DIR="${BACKUP_DIR:-/opt/smsok-clone/backups}"
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -10 || echo "  No backups found in $BACKUP_DIR"
  exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="${DB_CONTAINER:-smsok-clone-postgres-1}"
DB_USER="${DB_USER:-smsok}"
DB_NAME="${DB_NAME:-smsok}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will REPLACE the current database!"
echo "   Database: $DB_NAME"
echo "   Backup:   $BACKUP_FILE"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Cancelled."
  exit 0
fi

echo "==> Restoring from $BACKUP_FILE..."

# Stop app to prevent writes
docker compose -f docker-compose.prod.yml stop app 2>/dev/null || true

# Restore
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" \
  psql -U "$DB_USER" -d "$DB_NAME" --single-transaction 2>&1

echo "==> Restore complete. Starting app..."
docker compose -f docker-compose.prod.yml start app 2>/dev/null || true

# Verify
sleep 5
if curl -sf http://localhost:3458/api/health/ready > /dev/null 2>&1; then
  echo "==> App is healthy after restore!"
else
  echo "==> WARNING: App health check failed after restore"
fi
