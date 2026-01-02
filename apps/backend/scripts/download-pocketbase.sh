#!/usr/bin/env bash
set -euo pipefail

PB_VERSION="${PB_VERSION:-0.23.4}"
OS="${PB_OS:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
ARCH="${PB_ARCH:-$(uname -m)}"

case "$ARCH" in
  x86_64|amd64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

case "$OS" in
  darwin|linux) : ;;
  msys*|mingw*|cygwin*|windows_nt) OS="windows" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

ZIP_NAME="pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${ZIP_NAME}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$ROOT_DIR/bin"
DEST_DIR="$BIN_DIR/pocketbase_${PB_VERSION}_${OS}_${ARCH}"

mkdir -p "$DEST_DIR"

if [[ -x "$DEST_DIR/pocketbase" || -x "$DEST_DIR/pocketbase.exe" ]]; then
  echo "PocketBase already present at $DEST_DIR"
  exit 0
fi

echo "Downloading $URL"
TMP_ZIP="$(mktemp -t pocketbase.zip.XXXXXX)"
trap 'rm -f "$TMP_ZIP"' EXIT
curl -fsSL "$URL" -o "$TMP_ZIP"

unzip -q "$TMP_ZIP" -d "$DEST_DIR"
chmod +x "$DEST_DIR/pocketbase" 2>/dev/null || true

echo "Installed to $DEST_DIR"
