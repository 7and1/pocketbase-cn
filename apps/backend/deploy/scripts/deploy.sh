#!/usr/bin/env bash
set -euo pipefail

# PocketBase.cn Deployment Script
# Usage: bash deploy.sh [production|staging]

ENVIRONMENT="${1:-production}"
PB_VERSION="${PB_VERSION:-0.23.4}"

case "$ENVIRONMENT" in
  production)
    DEPLOY_PATH="/opt/pocketbase"
    SERVICE_NAME="pocketbase"
    PORT="8090"
    ;;
  staging)
    DEPLOY_PATH="/opt/pocketbase-staging"
    SERVICE_NAME="pocketbase-staging"
    PORT="8091"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [production|staging]"
    exit 1
    ;;
esac

echo "======================================"
echo "Deploying to: $ENVIRONMENT"
echo "Deploy path: $DEPLOY_PATH"
echo "Service: $SERVICE_NAME"
echo "Port: $PORT"
echo "======================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or use sudo"
  exit 1
fi

# Create backup
BACKUP_FILE="/tmp/pocketbase_${ENVIRONMENT}_pre_deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
echo "[1/7] Creating backup: $BACKUP_FILE"
tar -C "$DEPLOY_PATH" -czf "$BACKUP_FILE" pb_data || true
echo "Backup created: $BACKUP_FILE"

# Create temp deploy directory
DEPLOY_TEMP="${DEPLOY_PATH}.deploy.tmp"
echo "[2/7] Creating temp deploy directory..."
rm -rf "$DEPLOY_TEMP"
mkdir -p "$DEPLOY_TEMP"

# Download PocketBase binary
echo "[3/7] Downloading PocketBase v${PB_VERSION}..."
PB_OS="linux"
PB_ARCH="$(uname -m)"
case "$PB_ARCH" in
  x86_64|amd64) PB_ARCH="amd64" ;;
  arm64|aarch64) PB_ARCH="arm64" ;;
  *) echo "Unsupported arch: $PB_ARCH"; exit 1 ;;
esac

ZIP_NAME="pocketbase_${PB_VERSION}_${PB_OS}_${PB_ARCH}.zip"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${ZIP_NAME}"

curl -fsSL "$URL" -o "/tmp/$ZIP_NAME"
unzip -q "/tmp/$ZIP_NAME" -d "$DEPLOY_TEMP"
chmod +x "$DEPLOY_TEMP/pocketbase"
rm -f "/tmp/$ZIP_NAME"

# Deploy application files
echo "[4/7] Deploying application files..."
rsync -av --delete \
  --exclude='pb_data/' \
  --exclude='pb_data.db' \
  --exclude='auxiliary.db' \
  --exclude='.env' \
  --exclude='bin/' \
  --exclude='node_modules/' \
  "${DEPLOY_PATH}.deploy.repo/apps/backend/" "$DEPLOY_TEMP/"

# Copy new binary
cp "$DEPLOY_TEMP/pocketbase" "${DEPLOY_PATH}/"

# Run migrations
echo "[5/7] Running migrations..."
cd "$DEPLOY_TEMP"
./pocketbase migrate up \
  --dir "$DEPLOY_PATH/pb_data" \
  --hooksDir "$DEPLOY_TEMP/pb_hooks" \
  --migrationsDir "$DEPLOY_TEMP/pb_migrations" \
  --publicDir "$DEPLOY_TEMP/pb_public"

# Update hooks, migrations, public files
echo "[6/7] Updating hooks and static files..."
rsync -av "$DEPLOY_TEMP/pb_hooks/" "$DEPLOY_PATH/pb_hooks/"
rsync -av "$DEPLOY_TEMP/pb_migrations/" "$DEPLOY_PATH/pb_migrations/"
rsync -av "$DEPLOY_TEMP/pb_public/" "$DEPLOY_PATH/pb_public/"

# Cleanup
rm -rf "$DEPLOY_TEMP"

# Restart service
echo "[7/7] Restarting service..."
systemctl reload "$SERVICE_NAME" || systemctl restart "$SERVICE_NAME"

# Wait for service to be ready
echo "Waiting for service to be ready..."
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:${PORT}/api/live" >/dev/null 2>&1; then
    echo "Service is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

# Health check
echo "Running health checks..."
curl -fsS "http://127.0.0.1:${PORT}/api/live" | jq .
curl -fsS "http://127.0.0.1:${PORT}/api/ready" | jq .

echo "======================================"
echo "Deployment completed successfully!"
echo "Backup: $BACKUP_FILE"
echo "======================================"
