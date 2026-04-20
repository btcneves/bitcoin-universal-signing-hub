#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEFAULT_ISO="$ROOT_DIR/infra/usb/dist/bursh-secure-usb-amd64.iso"
ISO_PATH="${1:-$DEFAULT_ISO}"
PERSIST_IMAGE_PATH="${2:-}"

if ! command -v qemu-system-x86_64 >/dev/null 2>&1; then
  cat <<'MSG'
[secure-usb] missing dependency: `qemu-system-x86_64`.
Install on Debian/Ubuntu with:
  sudo apt-get update && sudo apt-get install -y qemu-system-x86 qemu-utils ovmf
MSG
  exit 1
fi

if [[ ! -f "$ISO_PATH" ]]; then
  echo "[secure-usb] ISO not found: $ISO_PATH"
  echo "Run: ./infra/usb/scripts/build-iso.sh"
  exit 1
fi

QEMU_ACCEL=("-accel" "tcg")
QEMU_CPU="max"
if [[ -e /dev/kvm ]]; then
  QEMU_ACCEL=("-accel" "kvm")
  QEMU_CPU="host"
fi

QEMU_CMD=(
  qemu-system-x86_64
  "${QEMU_ACCEL[@]}"
  -m 4096
  -smp 2
  -cpu "$QEMU_CPU"
  -machine q35
  -boot d
  -cdrom "$ISO_PATH"
  -device qemu-xhci
  -device usb-tablet
  -display default,show-cursor=on
  -net none
)

if [[ -n "$PERSIST_IMAGE_PATH" ]]; then
  if [[ ! -f "$PERSIST_IMAGE_PATH" ]]; then
    echo "[secure-usb] persistence image not found: $PERSIST_IMAGE_PATH"
    exit 1
  fi
  QEMU_CMD+=(
    -drive "file=$PERSIST_IMAGE_PATH,format=raw,if=virtio"
  )
fi

cat <<MSG
[secure-usb] starting VM smoke run
  ISO: $ISO_PATH
  Persistence image: ${PERSIST_IMAGE_PATH:-none}

Inside VM, switch to TTY2 (Ctrl+Alt+F2) and run:
  sudo /usr/local/bin/smoke-test-bursh-live.sh
MSG

exec "${QEMU_CMD[@]}"
