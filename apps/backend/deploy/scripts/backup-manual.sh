#!/usr/bin/env bash
set -euo pipefail

PB_DIR="${PB_DIR:-/opt/pocketbase}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/tmp/pocketbase_pb_data_${TS}.tar.gz"

echo "[backup] packing $PB_DIR/pb_data -> $OUT"
tar -C "$PB_DIR" -czf "$OUT" pb_data

echo "[backup] done: $OUT"
echo "[backup] upload this file to your backup storage (R2/S3/etc)"

