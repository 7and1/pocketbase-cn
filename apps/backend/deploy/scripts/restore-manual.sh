#!/usr/bin/env bash
set -euo pipefail

PB_DIR="${PB_DIR:-/opt/pocketbase}"
ARCHIVE="${1:-}"

if [[ -z "$ARCHIVE" ]]; then
  echo "Usage: $0 /path/to/pocketbase_pb_data_*.tar.gz" >&2
  exit 1
fi

echo "[restore] stopping services (if managed by systemd)..."
systemctl stop pocketbase || true
systemctl stop litestream || true

echo "[restore] extracting $ARCHIVE -> $PB_DIR"
tar -C "$PB_DIR" -xzf "$ARCHIVE"

echo "[restore] starting services..."
systemctl start litestream || true
systemctl start pocketbase || true

echo "[restore] done"

