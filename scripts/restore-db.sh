#!/usr/bin/env bash
set -euo pipefail

# Postgres Restore Script
# Usage: ./scripts/restore-db.sh <backup_file.sql.gz> [CONFIRM_OVERWRITE=yes]

BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "[ERROR] Please specify a valid backup file path." >&2
  echo "Usage: $0 <path/to/tikbot_backup.sql.gz>" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[ERROR] DATABASE_URL environment variable is not set." >&2
  exit 1
fi

CONFIRM="${2:-}"
if [[ "$CONFIRM" != "yes" ]]; then
  read -rp "WARNING: This will overwrite tables in DATABASE_URL with ${BACKUP_FILE}. Type 'RESTORE' to proceed: " CONFIRM_PROMPT
  if [[ "$CONFIRM_PROMPT" != "RESTORE" ]]; then
    echo "[ABORT] Restore cancelled by user."
    exit 1
  fi
fi

echo "[RESTORE] Restoring database from ${BACKUP_FILE}..."
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

echo "[RESTORE] Database restored successfully."
