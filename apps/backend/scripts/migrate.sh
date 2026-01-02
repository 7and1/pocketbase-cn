#!/usr/bin/env bash
set -euo pipefail

PB_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PB_BIN="$(bash "$PB_ROOT_DIR/scripts/_resolve_pocketbase_path.sh")"

mkdir -p "$PB_ROOT_DIR/pb_data"

exec "$PB_BIN" migrate up \
  --dir "$PB_ROOT_DIR/pb_data" \
  --hooksDir "$PB_ROOT_DIR/pb_hooks" \
  --migrationsDir "$PB_ROOT_DIR/pb_migrations" \
  --publicDir "$PB_ROOT_DIR/pb_public"

