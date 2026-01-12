#!/bin/bash
# PocketBase.cn Backup Script with R2 Integration
# Usage: ./backup.sh
# Cron: 0 */6 * * * /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn/backup.sh

set -euo pipefail

# Configuration
PROJECT_DIR="/opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn"
CONTAINER_NAME="pocketbase-cn"
BACKUP_DIR="${PROJECT_DIR}/backups"
DATA_DIR="/opt/pocketbase/pb_data"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# R2 Configuration (from environment)
R2_ACCOUNT_ID="${R2_ACCOUNT_ID:-}"
R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-}"
R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-}"
R2_BUCKET="pocketbase-cn-backups"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting backup..."

# Stop writes for consistent backup
log "Creating database snapshot..."
docker exec "$CONTAINER_NAME" /bin/sh -c \
    "cd /pb_data && sqlite3 data.db '.backup /tmp/backup.db'" || {
    log "[ERROR] Failed to create database snapshot"
    exit 1
}

# Copy from container
log "Copying backup from container..."
docker cp "${CONTAINER_NAME}:/tmp/backup.db" "${BACKUP_DIR}/data_${TIMESTAMP}.db" || {
    log "[ERROR] Failed to copy backup from container"
    exit 1
}

# Verify integrity
log "Verifying backup integrity..."
docker exec "$CONTAINER_NAME" sqlite3 /tmp/backup.db "PRAGMA integrity_check;" | grep -q "ok" || {
    log "[ERROR] Backup verification failed"
    exit 1
}

# Compress
log "Compressing backup..."
gzip "${BACKUP_DIR}/data_${TIMESTAMP}.db"

# Upload to R2 if configured
if [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ]; then
    log "Uploading to R2..."

    # Install awscli if not present
    if ! command -v aws &> /dev/null; then
        log "[WARN] awscli not found, installing..."
        apk add --no-cache aws-cli 2>/dev/null || \
        pip install awscli --break-system-packages 2>/dev/null || {
            log "[ERROR] Failed to install awscli"
            exit 1
        }
    fi

    # Upload to R2
    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    aws s3 cp \
        "${BACKUP_DIR}/data_${TIMESTAMP}.db.gz" \
        "s3://${R2_BUCKET}/db/data_${TIMESTAMP}.db.gz" \
        --endpoint-url "$R2_ENDPOINT" \
        --region auto || {
        log "[WARN] Failed to upload to R2"
    }

    log "R2 upload complete"
else
    log "[INFO] R2 not configured, skipping upload"
fi

# Cleanup old backups
log "Cleaning up old backups (>${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "data_*.db.gz" -mtime +$RETENTION_DAYS -delete

# Cleanup in-container backup
docker exec "$CONTAINER_NAME" rm -f /tmp/backup.db

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/data_${TIMESTAMP}.db.gz" | cut -f1)
log "Backup completed: data_${TIMESTAMP}.db.gz (${BACKUP_SIZE})"

exit 0
