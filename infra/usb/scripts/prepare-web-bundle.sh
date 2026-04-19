#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
WEB_DIST_DIR="$ROOT_DIR/apps/web/dist"
USB_WEB_DIST_DIR="$ROOT_DIR/infra/usb/live-build/config/includes.chroot/opt/bursh/web-dist"

cd "$ROOT_DIR"

pnpm --filter @bursh/web build

rm -rf "$USB_WEB_DIST_DIR"
mkdir -p "$USB_WEB_DIST_DIR"
cp -R "$WEB_DIST_DIR"/. "$USB_WEB_DIST_DIR"

echo "[secure-usb] web bundle synced to $USB_WEB_DIST_DIR"
