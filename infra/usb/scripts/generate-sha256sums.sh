#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEFAULT_ISO="$ROOT_DIR/infra/usb/dist/bursh-secure-usb-amd64.iso"

ISO_PATH="${1:-$DEFAULT_ISO}"
SIG_PATH="${2:-${ISO_PATH}.sig}"

if ! command -v sha256sum >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: sha256sum (coreutils)"
  exit 1
fi

if [[ ! -f "$ISO_PATH" ]]; then
  echo "[secure-usb] ISO not found: $ISO_PATH"
  exit 1
fi

if [[ ! -f "$SIG_PATH" ]]; then
  echo "[secure-usb] signature file not found: $SIG_PATH"
  exit 1
fi

OUTPUT_DIR="$(cd "$(dirname "$ISO_PATH")" && pwd)"
OUTPUT_FILE="$OUTPUT_DIR/sha256sums.txt"
ISO_NAME="$(basename "$ISO_PATH")"
SIG_NAME="$(basename "$SIG_PATH")"

pushd "$OUTPUT_DIR" >/dev/null
sha256sum "$ISO_NAME" "$SIG_NAME" >"$OUTPUT_FILE"
popd >/dev/null

cat <<MSG
[secure-usb] sha256 checksums generated:
  ISO: $ISO_PATH
  SIG: $SIG_PATH
  SHA256: $OUTPUT_FILE
MSG
