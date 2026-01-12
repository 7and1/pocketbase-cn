#!/usr/bin/env bash
set -euo pipefail

PB_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB_BIN="$(bash "$PB_ROOT_DIR/scripts/_resolve_pocketbase_path.sh")"

PB_ADDR="${PB_ADDR:-127.0.0.1:8090}"
PB_HOOKS_WATCH="${PB_HOOKS_WATCH:-1}"

mkdir -p "$PB_ROOT_DIR/pb_data"

# Load local env if present (ignored by git).
if [[ -f "$PB_ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$PB_ROOT_DIR/.env"
  set +a
fi

# Default to development environment for local runs.
if [[ -z "${PB_ENV:-}" ]]; then
  export PB_ENV="development"
fi

# Dev defaults (safe for local only).
if [[ -z "${PB_CORS_ORIGINS:-}" ]]; then
  export PB_CORS_ORIGINS="http://127.0.0.1:4321,http://localhost:4321"
fi

# CSRF is enforced only for cookie/session flows; still provide a dev secret so
# `/api/csrf-token` works out of the box.
if [[ -z "${PB_CSRF_SECRET:-}" ]]; then
  export PB_CSRF_SECRET="dev-only-insecure-csrf-secret-please-change-0000000000"
fi

echo "PocketBase: $PB_BIN"
echo "Data dir:   $PB_ROOT_DIR/pb_data"
echo "Hooks dir:  $PB_ROOT_DIR/pb_hooks"
echo "Public dir: $PB_ROOT_DIR/pb_public"
echo "Addr:       $PB_ADDR"

exec "$PB_BIN" serve \
  --dev \
  --dir "$PB_ROOT_DIR/pb_data" \
  --hooksDir "$PB_ROOT_DIR/pb_hooks" \
  $( [[ "$PB_HOOKS_WATCH" == "1" ]] && printf "%s" "--hooksWatch" ) \
  --migrationsDir "$PB_ROOT_DIR/pb_migrations" \
  --publicDir "$PB_ROOT_DIR/pb_public" \
  --http "$PB_ADDR"
