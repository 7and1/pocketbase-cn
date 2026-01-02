#!/bin/sh
set -e

# PocketBase.cn Docker Entrypoint
# Starts PocketBase with Litestream replication if configured

POCKETBASE_DIR="/opt/pocketbase"
LITESTREAM_CONFIG="/etc/litestream.yml"

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
    exec litestream replicate -config "${LITESTREAM_CONFIG}" -exec "pocketbase serve --http=0.0.0.0:8090 --dir=${POCKETBASE_DIR}"
else
    echo "[entrypoint] Litestream replication disabled (no S3 credentials)"

    # Start PocketBase without replication
    exec pocketbase serve --http=0.0.0.0:8090 --dir="${POCKETBASE_DIR}"
fi
