#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KEYS_DIR="$ROOT_DIR/infra/usb/keys"
DEFAULT_ISO="$ROOT_DIR/infra/usb/dist/bursh-secure-usb-amd64.iso"
DEFAULT_GNUPG_HOME="$KEYS_DIR/offline-signing"
KEY_ID_PATH="$KEYS_DIR/release-signing-key-id.txt"

ISO_PATH="${1:-$DEFAULT_ISO}"
SIG_PATH="${ISO_PATH}.sig"
GNUPG_HOME="${BURSH_GPG_HOME:-$DEFAULT_GNUPG_HOME}"
SIGNING_KEY_ID="${BURSH_ISO_SIGNING_KEY:-}"

if ! command -v gpg >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: gpg"
  exit 1
fi

if [[ ! -f "$ISO_PATH" ]]; then
  echo "[secure-usb] ISO not found: $ISO_PATH"
  exit 1
fi

if [[ -z "$SIGNING_KEY_ID" && -f "$KEY_ID_PATH" ]]; then
  SIGNING_KEY_ID="$(head -n 1 "$KEY_ID_PATH" | tr -d '[:space:]')"
fi

if [[ -z "$SIGNING_KEY_ID" ]]; then
  cat <<MSG
[secure-usb] signing key id not found.
Generate a dedicated key pair first:
  ./infra/usb/scripts/generate-iso-signing-key.sh
Or set BURSH_ISO_SIGNING_KEY to an existing key fingerprint.
MSG
  exit 1
fi

mkdir -p "$GNUPG_HOME"
chmod 700 "$GNUPG_HOME"
export GNUPGHOME="$GNUPG_HOME"

if ! gpg --list-secret-keys "$SIGNING_KEY_ID" >/dev/null 2>&1; then
  cat <<MSG
[secure-usb] secret key not available in GNUPGHOME: $GNUPG_HOME
Missing key: $SIGNING_KEY_ID
Generate/import key material before signing.
MSG
  exit 1
fi

gpg --batch --yes --local-user "$SIGNING_KEY_ID" --output "$SIG_PATH" --detach-sign "$ISO_PATH"

cat <<MSG
[secure-usb] ISO signature generated:
  ISO: $ISO_PATH
  SIG: $SIG_PATH
  Key: $SIGNING_KEY_ID
MSG
