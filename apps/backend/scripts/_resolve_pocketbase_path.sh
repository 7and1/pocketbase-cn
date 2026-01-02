#!/usr/bin/env bash
set -euo pipefail

PB_VERSION="${PB_VERSION:-0.23.4}"
OS="${PB_OS:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
ARCH="${PB_ARCH:-$(uname -m)}"

case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH" >&2; exit 1 ;;
esac

case "$OS" in
  darwin|linux) : ;;
  msys*|mingw*|cygwin*|windows_nt) OS="windows" ;;
  *) echo "Unsupported OS: $OS" >&2; exit 1 ;;
esac

PB_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PB_BIN_DIR="$PB_ROOT_DIR/bin/pocketbase_${PB_VERSION}_${OS}_${ARCH}"

if [[ -x "$PB_BIN_DIR/pocketbase" ]]; then
  echo "$PB_BIN_DIR/pocketbase"
  exit 0
fi

if [[ -x "$PB_BIN_DIR/pocketbase.exe" ]]; then
  echo "$PB_BIN_DIR/pocketbase.exe"
  exit 0
fi

echo "" >&2
echo "PocketBase binary not found for version=$PB_VERSION os=$OS arch=$ARCH" >&2
echo "Run: bash apps/backend/scripts/download-pocketbase.sh" >&2
exit 1

