#!/usr/bin/env bash
set -euo pipefail

PB_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rm -rf "$PB_ROOT_DIR/pb_data"
mkdir -p "$PB_ROOT_DIR/pb_data"

echo "Reset $PB_ROOT_DIR/pb_data"

