#!/bin/bash
# PocketBase.cn Health Monitor Script
# Run via cron: */5 * * * * /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn/monitor.sh

set -euo pipefail

# Configuration
CONTAINER_NAME="pocketbase-cn"
HEALTH_URL="http://localhost:8090/api/health"
BACKUP_HEALTH_URL="http://localhost:8090/api/health/backup"
NGINX_CONF="/opt/docker-projects/nginx-proxy/config/conf.d/pocketbase-cn.conf"
ALERT_WEBHOOK="${ALERT_WEBHOOK_URL:-}"
LOG_FILE="/var/log/pocketbase-cn-monitor.log"
BACKUP_MAX_AGE_SECONDS="${BACKUP_MAX_AGE_SECONDS:-7200}"  # 2 hours default

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Health check function
check_health() {
    docker exec "$CONTAINER_NAME" wget -qO- "$HEALTH_URL" 2>/dev/null | grep -q "healthy"
}

# Backup health check function
check_backup_health() {
    local response
    response=$(docker exec "$CONTAINER_NAME" wget -qO- "$BACKUP_HEALTH_URL" 2>/dev/null) || return 1

    # Check if backup is healthy
    if echo "$response" | grep -q '"healthy":true'; then
        return 0
    fi

    # Extract backup age for alerting
    local backup_age status
    backup_age=$(echo "$response" | grep -o '"backupAgeSeconds":[0-9]*' | cut -d: -f2)
    status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d: -f2 | tr -d '"')

    log "[WARN] Backup check failed - status: ${status:-unknown}, age: ${backup_age:-unknown}s"
    return 1
}

# Check nginx config exists
check_nginx_config() {
    [ -f "$NGINX_CONF" ]
}

# Enable nginx config
enable_nginx() {
    log "[WARN] Enabling nginx config..."
    mv "${NGINX_CONF}.disabled" "$NGINX_CONF" 2>/dev/null || true
    docker exec nginx-proxy nginx -t && docker exec nginx-proxy nginx -s reload
    log "[INFO] Nginx config enabled and reloaded"
}

# Restart container
restart_service() {
    log "[WARN] Restarting $CONTAINER_NAME..."
    docker restart "$CONTAINER_NAME"
    sleep 10
}

# Send alert notification
send_alert() {
    local severity="$1"
    local msg="$2"
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"[${severity}] PocketBase.cn: $msg\"}" || true
    fi
    log "[ALERT][$severity] $msg"
}

# Container running check
check_container_running() {
    docker inspect "$CONTAINER_NAME" --format='{{.State.Running}}' 2>/dev/null | grep -q "true"
}

# Main health check loop
ERRORS=0

if ! check_container_running; then
    send_alert "CRITICAL" "Container $CONTAINER_NAME is not running"
    docker start "$CONTAINER_NAME" || send_alert "CRITICAL" "Failed to start container"
    sleep 15
    ((ERRORS++))
fi

if ! check_health; then
    send_alert "WARNING" "Health check failed for $CONTAINER_NAME"
    ((ERRORS++))

    # Try restarting container
    restart_service

    if ! check_health; then
        # Check if nginx config is disabled
        if ! check_nginx_config; then
            enable_nginx
            sleep 5
        fi

        # Final check
        if ! check_health; then
            send_alert "CRITICAL" "Service still unhealthy after recovery attempts"
            exit 1
        fi
    fi

    log "[INFO] Service recovered successfully"
else
    log "[INFO] Health check passed"
fi

# Backup health check (non-blocking alert)
if ! check_backup_health; then
    send_alert "WARNING" "Backup is stale or not configured properly"
    ((ERRORS++))
else
    log "[INFO] Backup health check passed"
fi

# Disk space check
DISK_USAGE=$(df -h /opt/docker-projects/heavy-tasks/vibing-code/PocketBase.cn | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    send_alert "WARNING" "Disk usage at ${DISK_USAGE}%"
    ((ERRORS++))
fi

if [ "$ERRORS" -eq 0 ]; then
    log "[INFO] All checks passed"
fi

exit 0
