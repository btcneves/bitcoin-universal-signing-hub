#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
USB_DIR="$ROOT_DIR/infra/usb"
LIVE_BUILD_TEMPLATE_DIR="$USB_DIR/live-build"
BUILD_DIR="$USB_DIR/build/live-build-workdir"
DIST_DIR="$USB_DIR/dist"
OUTPUT_ISO_NAME="bursh-secure-usb-amd64.iso"

if ! command -v lb >/dev/null 2>&1; then
  cat <<'MSG'
[secure-usb] missing dependency: `lb` (Debian live-build).
Install on Debian/Ubuntu with:
  sudo apt-get update && sudo apt-get install -y live-build
MSG
  exit 1
fi

"$USB_DIR/scripts/prepare-web-bundle.sh"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"
cp -R "$LIVE_BUILD_TEMPLATE_DIR"/. "$BUILD_DIR"

pushd "$BUILD_DIR" >/dev/null
lb clean --purge
lb config noauto --distribution bookworm --architectures amd64 --debian-installer false --archive-areas "main contrib non-free non-free-firmware" --binary-images iso-hybrid
lb build
popd >/dev/null

SOURCE_ISO="$BUILD_DIR/live-image-amd64.hybrid.iso"
if [[ ! -f "$SOURCE_ISO" ]]; then
  echo "[secure-usb] build finished but ISO not found at $SOURCE_ISO"
  exit 1
fi

cp "$SOURCE_ISO" "$DIST_DIR/$OUTPUT_ISO_NAME"

"$USB_DIR/scripts/sign-iso.sh" "$DIST_DIR/$OUTPUT_ISO_NAME"

cat <<MSG
[secure-usb] ISO generated and signed:
  ISO: $DIST_DIR/$OUTPUT_ISO_NAME
  SIG: $DIST_DIR/$OUTPUT_ISO_NAME.sig
MSG
