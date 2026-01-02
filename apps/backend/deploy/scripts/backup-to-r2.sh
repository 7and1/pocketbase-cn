#!/usr/bin/env bash
set -euo pipefail

# Backup Script for PocketBase.cn to R2
# Usage: bash backup-to-r2.sh [production|staging]

ENVIRONMENT="${1:-production}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/pocketbase}"

# Environment-specific paths
case "$ENVIRONMENT" in
  production)
    PB_PATH="/opt/pocketbase"
    R2_PATH="production"
    ;;
  staging)
    PB_PATH="/opt/pocketbase-staging"
    R2_PATH="staging"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [production|staging]"
    exit 1
    ;;
esac

# Load R2 configuration from environment
R2_BUCKET="${R2_BACKUP_BUCKET:-pocketbase-backups}"
R2_ENDPOINT="${R2_ENDPOINT:-https://<account_id>.r2.cloudflarestorage.com}"

# Validate required variables
if [ -z "${LITESTREAM_ACCESS_KEY_ID:-}" ] || [ -z "${LITESTREAM_SECRET_ACCESS_KEY:-}" ]; then
  echo "Error: R2 credentials not set (LITESTREAM_ACCESS_KEY_ID, LITESTREAM_SECRET_ACCESS_KEY)"
  exit 1
fi

echo "======================================"
echo "PocketBase Backup to R2"
echo "Environment: $ENVIRONMENT"
echo "PocketBase Path: $PB_PATH"
echo "R2 Bucket: $R2_BUCKET"
echo "======================================"

# Create backup directory
BACKUP_DIR="/tmp/pocketbase_${ENVIRONMENT}_backups"
mkdir -p "$BACKUP_DIR"

# Create timestamped backup
TIMESTAMP=$(date -u +%Y%m%d_%H%M%SZ)
BACKUP_FILE="$BACKUP_DIR/pocketbase_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"

echo "Creating backup: $BACKUP_FILE"
tar -C "$PB_PATH" -czf "$BACKUP_FILE" pb_data

# Show backup size
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: $SIZE"

# Upload to R2 using rclone
R2_PATH_FULL="$R2_BUCKET/$(date -u +%Y/%m/%d)"

echo "Uploading to R2: $R2_PATH_FULL/"

if command -v rclone &> /dev/null; then
  # Configure rclone for R2 (non-interactive)
  rclone config create r2-backup-temp s3 \
    provider Cloudflare \
    access_key_id "$LITESTREAM_ACCESS_KEY_ID" \
    secret_access_key "$LITESTREAM_SECRET_ACCESS_KEY" \
    endpoint "$R2_ENDPOINT" \
    region auto \
    --config /tmp/rclone-temp.conf 2>/dev/null || true

  # Upload
  rclone copy "$BACKUP_FILE" "r2-backup-temp:$R2_PATH_FULL/" \
    --config /tmp/rclone-temp.conf \
    --progress

  # Cleanup config
  rm -f /tmp/rclone-temp.conf
else
  echo "Error: rclone not found. Install with: curl -sSL https://rclone.org/install.sh | sudo bash"
  exit 1
fi

# Cleanup old local backups (keep last 7 days)
echo "Cleaning up old local backups..."
find "$BACKUP_DIR" -name "pocketbase_${ENVIRONMENT}_*.tar.gz" -mtime +7 -delete

# Keep file
echo "Keeping local backup: $BACKUP_FILE"

echo "======================================"
echo "Backup completed successfully!"
echo "File: $BACKUP_FILE"
echo "R2 Path: $R2_PATH_FULL/"
echo "======================================"
