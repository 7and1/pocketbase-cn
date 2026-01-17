#!/bin/bash
# PocketBase.cn Deployment Script
#
# Production Server: 107.174.42.198
# Project Path: /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn
#
# Usage: ./deploy.sh
#
# Environment Setup (First Time):
#   1. Copy deploy/production.env.example to deploy/.env
#   2. Fill in required variables (PB_CSRF_SECRET, PUBLIC_SITE_URL)
#   3. Generate CSRF secret: openssl rand -base64 32
#
# Admin Credentials Setup:
#   PB_ADMIN_EMAIL="admin@pocketbase.cn" \
#   PB_ADMIN_PASSWORD="your_secure_password" \
#   node scripts/reset-admin.js
#
# Then access admin UI at: https://admin.pocketbase.cn/_/
#
# See ../CLAUDE.md for full documentation.

set -euo pipefail

PROJECT_DIR="/opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn"
CONTAINER_NAME="pocketbase-cn"
IMAGE_NAME="pocketbase-cn"
NETWORK_NAME="nginx-proxy_default"
BACKUP_SCRIPT="${PROJECT_DIR}/apps/backend/backup.sh"
ENV_FILE="${PROJECT_DIR}/apps/backend/deploy/.env"

cd "$PROJECT_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    log "[ERROR] $*"
    exit 1
}

warn() {
    log "[WARN] $*"
}

# ============================================================
# Pre-deployment Checks
# ============================================================

log "Starting deployment..."

# 1. Check .env file exists
log "[1/7] Checking environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file not found: $ENV_FILE. Create from .env.example first."
fi

# 2. Verify required environment variables
log "[2/7] Verifying required environment variables..."
source "$ENV_FILE"

REQUIRED_VARS=("PB_CSRF_SECRET" "PUBLIC_SITE_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    error "Missing required environment variables: ${MISSING_VARS[*]}"
fi

# Warn about optional but recommended variables
if [ -z "${RESEND_API_KEY:-}" ]; then
    warn "RESEND_API_KEY not set - email features will be disabled"
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
    warn "GITHUB_TOKEN not set - lower GitHub API rate limit"
fi

if [ -z "${ALERT_WEBHOOK_URL:-}" ]; then
    warn "ALERT_WEBHOOK_URL not set - deployment alerts will not be sent"
fi

# 3. Check network exists
log "[3/7] Checking Docker network..."
if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    error "Network $NETWORK_NAME not found. Is nginx-proxy running?"
fi

# 4. Check disk space
log "[4/7] Checking disk space..."
DISK_USAGE=$(df -h "$PROJECT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    error "Disk usage at ${DISK_USAGE}%. Deployment aborted."
fi
log "Disk usage: ${DISK_USAGE}%"

# 5. Verify backup script exists
log "[5/7] Verifying backup configuration..."
if [ ! -f "$BACKUP_SCRIPT" ]; then
    warn "Backup script not found: $BACKUP_SCRIPT"
fi

# ============================================================
# Pre-deployment Backup
# ============================================================

log "[6/7] Creating pre-deployment backup..."
if [ -f "$BACKUP_SCRIPT" ]; then
    if ! bash "$BACKUP_SCRIPT"; then
        warn "Backup failed - continuing anyway (manual backup may be needed)"
    fi
else
    warn "Skipping backup - script not found"
fi

# ============================================================
# Deployment
# ============================================================

log "[7/7] Building and deploying..."

# Build new image
log "Building Docker image..."
if ! docker-compose -f apps/backend/deploy/docker-compose.yml build; then
    error "Docker build failed"
fi

# Get current container state for rollback
CURRENT_IMAGE=$(docker inspect "$CONTAINER_NAME" --format='{{.Config.Image}}' 2>/dev/null || echo "")

# Stop and recreate container
log "Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker wait "$CONTAINER_NAME" 2>/dev/null || true

log "Starting new container..."
if ! docker-compose -f apps/backend/deploy/docker-compose.yml up -d; then
    # Rollback on failure
    if [ -n "$CURRENT_IMAGE" ]; then
        log "Deployment failed - attempting rollback..."
        docker-compose -f apps/backend/deploy/docker-compose.yml up -d || true
    fi
    error "Failed to start new container"
fi

# ============================================================
# Post-deployment Verification
# ============================================================

log "Verifying deployment..."

# Wait for container to be healthy
MAX_WAIT=60
ELAPSED=0
HEALTHY=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if docker exec "$CONTAINER_NAME" wget -qO- http://localhost:8090/api/health 2>/dev/null | grep -q "healthy"; then
        HEALTHY=true
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    echo -n "."
done
echo ""

if [ "$HEALTHY" = false ]; then
    # Show logs for debugging
    log "[ERROR] Health check failed. Container logs:"
    docker logs --tail 50 "$CONTAINER_NAME"
    error "Deployment failed - health check timeout after ${MAX_WAIT}s"
fi

# Verify backup health endpoint
log "Checking backup status..."
BACKUP_RESPONSE=$(docker exec "$CONTAINER_NAME" wget -qO- http://localhost:8090/api/health/backup 2>/dev/null || echo "{}")
if echo "$BACKUP_RESPONSE" | grep -q '"healthy":true'; then
    log "Backup status: OK"
elif echo "$BACKUP_RESPONSE" | grep -q '"configured":false'; then
    warn "Backup not configured"
else
    warn "Backup check returned unhealthy - check configuration"
fi

# Send success notification
if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
    log "Sending deployment notification..."
    curl -s -X POST "$ALERT_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"[SUCCESS] PocketBase.cn deployment completed successfully\"}" || true
fi

log "Deployment successful! Container is healthy."
log "View logs: docker logs -f $CONTAINER_NAME"

exit 0
