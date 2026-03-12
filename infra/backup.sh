#!/bin/bash
# SMSOK Clone — PostgreSQL Backup with Rotation
# Format: pg_dump --format=custom (supports selective restore)
# Crontab: 0 3 * * * /opt/smsok-clone/infra/backup.sh >> /var/log/smsok-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/smsok-backups}"
CONTAINER="${CONTAINER:-smsok-clone-postgres-1}"
DB_USER="${DB_USER:-smsok}"
DB_NAME="${DB_NAME:-smsok}"
DATE=$(date +%Y-%m-%d_%H%M)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +%d)

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly" "$BACKUP_DIR/monthly"

log() { printf '[%s] %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$1"; }

# ── 1. Daily backup (custom format — best for pg_restore) ──
DAILY_FILE="$BACKUP_DIR/daily/$DB_NAME-$DATE.dump"
log "Starting daily backup: $DB_NAME → $DAILY_FILE"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" --format=custom "$DB_NAME" > "$DAILY_FILE"

# Verify size
BACKUP_SIZE=$(stat -c%s "$DAILY_FILE" 2>/dev/null || stat -f%z "$DAILY_FILE")
if [ "$BACKUP_SIZE" -lt 1000 ]; then
  log "ERROR: Backup too small ($BACKUP_SIZE bytes) — possible failure"
  exit 1
fi
log "Backup OK: $(numfmt --to=iec "$BACKUP_SIZE" 2>/dev/null || echo "$BACKUP_SIZE bytes")"

# Verify integrity (pg_restore --list)
if docker exec -i "$CONTAINER" pg_restore --list < "$DAILY_FILE" > /dev/null 2>&1; then
  log "Integrity check: PASSED"
else
  log "WARNING: Integrity check failed — backup may be corrupted"
fi

# ── 2. Weekly copy (every Sunday) ──
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  cp "$DAILY_FILE" "$BACKUP_DIR/weekly/$DB_NAME-weekly-$DATE.dump"
  log "Weekly backup copied"
fi

# ── 3. Monthly copy (1st of month) ──
if [ "$DAY_OF_MONTH" -eq "01" ]; then
  cp "$DAILY_FILE" "$BACKUP_DIR/monthly/$DB_NAME-monthly-$DATE.dump"
  log "Monthly backup copied"
fi

# ── 4. Rotation (30 daily, 12 weekly, 6 monthly) ──
DAILY_DEL=$(find "$BACKUP_DIR/daily" -name "*.dump" -mtime +30 -delete -print | wc -l)
WEEKLY_DEL=$(find "$BACKUP_DIR/weekly" -name "*.dump" -mtime +84 -delete -print | wc -l)
MONTHLY_DEL=$(find "$BACKUP_DIR/monthly" -name "*.dump" -mtime +180 -delete -print | wc -l)
log "Rotation: daily -$DAILY_DEL (>30d), weekly -$WEEKLY_DEL (>12w), monthly -$MONTHLY_DEL (>6m)"

log "Done"
