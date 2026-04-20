#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

usage() {
  cat <<'USAGE'
Usage:
  ./infra/usb/scripts/airgap-qr-handoff.sh export --payload <text> --out <png>
  ./infra/usb/scripts/airgap-qr-handoff.sh import --image <png>
  ./infra/usb/scripts/airgap-qr-handoff.sh import --camera

Convenience wrapper for camera/image-only QR transfer (no pendrive/network).
USAGE
}

MODE="${1:-}"
shift || true

case "$MODE" in
  export)
    "$ROOT_DIR/infra/usb/scripts/generate-qr-payload.sh" "$@"
    ;;
  import)
    "$ROOT_DIR/infra/usb/scripts/scan-qr-payload.sh" "$@"
    ;;
  -h|--help|"")
    usage
    ;;
  *)
    echo "[airgap-qr] modo inválido: $MODE"
    usage
    exit 1
    ;;
esac
