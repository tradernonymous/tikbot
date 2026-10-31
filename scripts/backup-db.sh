#!/usr/bin/env bash
set -euo pipefail

# Nightly Postgres Backup Script for Railway / Production
# Usage: ./scripts/backup-db.sh [output_dir]

BACKUP_DIR="${1:-./backups}"
mkdir -p "$BACKUP_DIR"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[ERROR] DATABASE_URL environment variable is not set." >&2
  exit 1
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tikbot_${TIMESTAMP}.sql.gz"

echo "[BACKUP] Starting database dump to ${BACKUP_FILE}..."

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "[BACKUP] Successfully created ${BACKUP_FILE} (${FILE_SIZE})."

# Retention policy: delete backups older than 7 days
echo "[BACKUP] Pruning backups older than 7 days..."
find "$BACKUP_DIR" -name "tikbot_*.sql.gz" -type f -mtime +7 -delete

echo "[BACKUP] Backup completed successfully."
