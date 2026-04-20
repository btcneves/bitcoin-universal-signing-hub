#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
KEYS_DIR="$ROOT_DIR/infra/usb/keys"
DEFAULT_GNUPG_HOME="$KEYS_DIR/offline-signing"
PUBLIC_KEY_PATH="$KEYS_DIR/bursh-secure-usb-signing-public.asc"
KEY_ID_PATH="$KEYS_DIR/release-signing-key-id.txt"

GNUPG_HOME="${BURSH_GPG_HOME:-$DEFAULT_GNUPG_HOME}"
KEY_NAME="${BURSH_GPG_KEY_NAME:-BURSH Secure USB ISO Signing}"
KEY_EMAIL="${BURSH_GPG_KEY_EMAIL:-release@bursh.local}"
KEY_EXPIRE="${BURSH_GPG_KEY_EXPIRE:-1y}"

mkdir -p "$KEYS_DIR" "$GNUPG_HOME"
chmod 700 "$GNUPG_HOME"

if [[ -f "$KEY_ID_PATH" ]]; then
  echo "[secure-usb] signing key metadata already exists at: $KEY_ID_PATH"
  echo "[secure-usb] set BURSH_FORCE_KEY_ROTATION=1 to rotate the key intentionally."
  if [[ "${BURSH_FORCE_KEY_ROTATION:-0}" != "1" ]]; then
    exit 1
  fi
fi

if ! command -v gpg >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: gpg"
  exit 1
fi

export GNUPGHOME="$GNUPG_HOME"

if [[ "${BURSH_FORCE_KEY_ROTATION:-0}" == "1" ]]; then
  rm -f "$PUBLIC_KEY_PATH" "$KEY_ID_PATH"
fi

gpg --batch --pinentry-mode loopback --passphrase "" \
  --quick-gen-key "$KEY_NAME <$KEY_EMAIL>" ed25519 cert,sign "$KEY_EXPIRE"

FINGERPRINT="$(gpg --with-colons --list-secret-keys "$KEY_NAME <$KEY_EMAIL>" | awk -F: '/^fpr:/ {print $10; exit}')"
if [[ -z "$FINGERPRINT" ]]; then
  echo "[secure-usb] failed to resolve generated key fingerprint"
  exit 1
fi

gpg --armor --export "$FINGERPRINT" > "$PUBLIC_KEY_PATH"
printf '%s\n' "$FINGERPRINT" > "$KEY_ID_PATH"

cat <<MSG
[secure-usb] ISO signing key pair generated.
  GNUPGHOME: $GNUPG_HOME
  Fingerprint: $FINGERPRINT
  Public key: $PUBLIC_KEY_PATH
  Key ID file: $KEY_ID_PATH
MSG
