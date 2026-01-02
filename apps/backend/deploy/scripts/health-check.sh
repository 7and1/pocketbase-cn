#!/usr/bin/env bash
set -euo pipefail

# Health Check Script for PocketBase.cn
# Usage: bash health-check.sh [production|staging]

ENVIRONMENT="${1:-production}"

# Environment-specific configuration
case "$ENVIRONMENT" in
  production)
    PB_URL="${PRODUCTION_URL:-http://127.0.0.1:8090}"
    ;;
  staging)
    PB_URL="${STAGING_URL:-http://127.0.0.1:8091}"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [production|staging]"
    exit 1
    ;;
esac

# Override with command line argument if provided
if [ -n "${2:-}" ]; then
  PB_URL="$2"
fi

echo "======================================"
echo "PocketBase Health Check"
echo "Environment: $ENVIRONMENT"
echo "URL: $PB_URL"
echo "Time: $(date -u +%Y-%m-%d\ %H:%M:%S\ UTC)"
echo "======================================"

# Check /api/live
echo -n "[1/5] Checking /api/live... "
if LIVE_RESPONSE=$(curl -fsS "$PB_URL/api/live" 2>&1); then
  echo "OK"
  echo "$LIVE_RESPONSE" | jq . 2>/dev/null || echo "$LIVE_RESPONSE"
else
  echo "FAILED"
  echo "Error: $LIVE_RESPONSE"
  exit 1
fi

# Check /api/ready
echo -n "[2/5] Checking /api/ready... "
if READY_RESPONSE=$(curl -fsS "$PB_URL/api/ready" 2>&1); then
  echo "OK"
  echo "$READY_RESPONSE" | jq . 2>/dev/null || echo "$READY_RESPONSE"
else
  echo "FAILED"
  echo "Error: $READY_RESPONSE"
  exit 1
fi

# Check response time
echo -n "[3/5] Checking response time... "
TIME_TOTAL=$(curl -s -o /dev/null -w "%{time_total}" "$PB_URL/api/live")
if (( $(echo "$TIME_TOTAL < 5" | bc -l 2>/dev/null || echo "1") )); then
  echo "OK (${TIME_TOTAL}s)"
else
  echo "WARNING (${TIME_TOTAL}s - exceeds 5s)"
fi

# Check plugins endpoint
echo -n "[4/5] Checking /api/plugins/list... "
if PLUGINS_RESPONSE=$(curl -fsS "$PB_URL/api/plugins/list?limit=1&offset=0" 2>&1); then
  echo "OK"
else
  echo "FAILED"
  echo "Error: $PLUGINS_RESPONSE"
fi

# Check downloads endpoint
echo -n "[5/5] Checking /api/downloads/versions... "
if VERSIONS_RESPONSE=$(curl -fsS "$PB_URL/api/downloads/versions" 2>&1); then
  echo "OK"
else
  echo "FAILED"
  echo "Error: $VERSIONS_RESPONSE"
fi

echo "======================================"
echo "All health checks passed!"
echo "======================================"
