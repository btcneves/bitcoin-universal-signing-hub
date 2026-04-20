#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KEYS_DIR="$ROOT_DIR/infra/usb/keys"
DEFAULT_ISO="$ROOT_DIR/infra/usb/dist/bursh-secure-usb-amd64.iso"

ISO_PATH="${1:-$DEFAULT_ISO}"
SIG_PATH="${2:-${ISO_PATH}.sig}"
PUBLIC_KEY_PATH="${3:-$KEYS_DIR/bursh-secure-usb-signing-public.asc}"

if ! command -v gpg >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: gpg"
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

if [[ ! -f "$PUBLIC_KEY_PATH" ]]; then
  echo "[secure-usb] public key not found: $PUBLIC_KEY_PATH"
  exit 1
fi

TMP_GNUPG_HOME="$(mktemp -d)"
trap 'rm -rf "$TMP_GNUPG_HOME"' EXIT
chmod 700 "$TMP_GNUPG_HOME"

gpg --homedir "$TMP_GNUPG_HOME" --batch --import "$PUBLIC_KEY_PATH" >/dev/null 2>&1
gpg --homedir "$TMP_GNUPG_HOME" --batch --verify "$SIG_PATH" "$ISO_PATH"

echo "[secure-usb] signature verification PASS for: $ISO_PATH"
