#!/bin/bash
set -euo pipefail

# ============================================
# PostgreSQL Backup Script for SMSOK Clone
# Usage: ./scripts/backup.sh [daily|manual]
# ============================================

BACKUP_DIR="${BACKUP_DIR:-/opt/smsok-clone/backups}"
DB_CONTAINER="${DB_CONTAINER:-smsok-clone-postgres-1}"
DB_USER="${DB_USER:-smsok}"
DB_NAME="${DB_NAME:-smsok}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TYPE="${1:-manual}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TYPE}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "==> Starting ${TYPE} backup at $(date)"

# Dump database (compressed)
docker exec "$DB_CONTAINER" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --clean --if-exists \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "==> Backup created: $BACKUP_FILE ($SIZE)"

# Cleanup old backups
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
[ "$DELETED" -gt 0 ] && echo "==> Cleaned up $DELETED old backup(s)"

# Verify backup is valid
if gzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "==> Backup verified: OK"
else
  echo "==> ERROR: Backup file is corrupted!"
  exit 1
fi

echo "==> Backup complete!"
