#!/bin/sh
set -e

# PocketBase.cn Docker Entrypoint
# Starts PocketBase with Litestream replication if configured
#
# Note: Response compression (gzip/brotli) should be handled by the
# reverse proxy (nginx/cloudflare) in front of PocketBase. The Go
# standard library's http.Server does not provide built-in compression.

POCKETBASE_DIR="/opt/pocketbase"
LITESTREAM_CONFIG="/etc/litestream.yml"
DEFAULT_DEV_CSRF_SECRET="dev-only-insecure-csrf-secret-please-change-0000000000"

# Refuse to start with the dev CSRF secret outside local dev.
case "${PB_ENV:-}" in
  development|dev|local)
    ;;
  *)
    if [ -z "${PB_CSRF_SECRET:-}" ]; then
      echo "[entrypoint] ERROR: PB_CSRF_SECRET is required (32+ chars) in non-dev environments"
      exit 1
    fi
    if [ "${PB_CSRF_SECRET}" = "${DEFAULT_DEV_CSRF_SECRET}" ]; then
      echo "[entrypoint] ERROR: PB_CSRF_SECRET is set to the dev default; set a real secret"
      exit 1
    fi
    if [ "${#PB_CSRF_SECRET}" -lt 32 ]; then
      echo "[entrypoint] ERROR: PB_CSRF_SECRET must be at least 32 characters"
      exit 1
    fi
    ;;
esac

# Check if Litestream is configured (S3 credentials present)
if [ -n "${LITESTREAM_ACCESS_KEY_ID}" ] && [ -n "${LITESTREAM_SECRET_ACCESS_KEY}" ]; then
    echo "[entrypoint] Litestream replication enabled"

    # Restore from replica if database doesn't exist
    if [ ! -f "${POCKETBASE_DIR}/pb_data/data.db" ]; then
        echo "[entrypoint] No existing database found, attempting restore..."
        litestream restore -if-replica-exists -config "${LITESTREAM_CONFIG}" "${POCKETBASE_DIR}/pb_data/data.db" || true
        litestream restore -if-replica-exists -config "${LITESTREAM_CONFIG}" "${POCKETBASE_DIR}/pb_data/auxiliary.db" || true
    fi

    # Start PocketBase with Litestream replication
    exec litestream replicate -config "${LITESTREAM_CONFIG}" -exec "pocketbase serve --http=0.0.0.0:8090 --dir=${POCKETBASE_DIR} --hooksDir=${POCKETBASE_DIR}/pb_hooks --migrationsDir=${POCKETBASE_DIR}/pb_migrations --publicDir=${POCKETBASE_DIR}/pb_public"
else
    echo "[entrypoint] Litestream replication disabled (no S3 credentials)"

    # Start PocketBase without replication
    exec pocketbase serve --http=0.0.0.0:8090 --dir="${POCKETBASE_DIR}" --hooksDir="${POCKETBASE_DIR}/pb_hooks" --migrationsDir="${POCKETBASE_DIR}/pb_migrations" --publicDir="${POCKETBASE_DIR}/pb_public"
fi
