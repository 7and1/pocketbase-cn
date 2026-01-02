#!/usr/bin/env bash
set -euo pipefail

PB_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB_BIN="$(bash "$PB_ROOT_DIR/scripts/_resolve_pocketbase_path.sh")"

PB_ADDR="${PB_ADDR:-127.0.0.1:8090}"

mkdir -p "$PB_ROOT_DIR/pb_data"

echo "PocketBase: $PB_BIN"
echo "Data dir:   $PB_ROOT_DIR/pb_data"
echo "Hooks dir:  $PB_ROOT_DIR/pb_hooks"
echo "Public dir: $PB_ROOT_DIR/pb_public"
echo "Addr:       $PB_ADDR"

exec "$PB_BIN" serve \
  --dev \
  --dir "$PB_ROOT_DIR/pb_data" \
  --hooksDir "$PB_ROOT_DIR/pb_hooks" \
  --hooksWatch \
  --migrationsDir "$PB_ROOT_DIR/pb_migrations" \
  --publicDir "$PB_ROOT_DIR/pb_public" \
  --http "$PB_ADDR"
