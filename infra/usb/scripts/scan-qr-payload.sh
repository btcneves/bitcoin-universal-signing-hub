#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./infra/usb/scripts/scan-qr-payload.sh --image <file> [--expect xpub|psbt|seed|passphrase|any]
  ./infra/usb/scripts/scan-qr-payload.sh --camera [--expect xpub|psbt|seed|passphrase|any]

Reads an xpub/PSBT QR payload without network or USB transfer.
Output is printed to stdout only (in-memory flow).
USAGE
}

MODE=""
IMAGE_PATH=""
EXPECT="any"

normalize_expectation() {
  case "$1" in
    any) echo "" ;;
    xpub) echo "ur:crypto-hdkey/" ;;
    psbt) echo "ur:crypto-psbt/" ;;
    seed) echo "ur:crypto-seed/" ;;
    passphrase) echo "ur:crypto-passphrase/" ;;
    *)
      echo "[qr] tipo esperado inválido: $1" >&2
      exit 1
      ;;
  esac
}

validate_payload() {
  local payload="$1"
  local expected_prefix="$2"

  if [[ -z "$expected_prefix" ]]; then
    printf '%s\n' "$payload"
    return 0
  fi

  if [[ "$payload" != "$expected_prefix"* ]]; then
    echo "[qr] payload incompatível. Esperado prefixo: $expected_prefix" >&2
    exit 1
  fi

  printf '%s\n' "$payload"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      MODE="image"
      IMAGE_PATH="${2:-}"
      shift 2
      ;;
    --camera)
      MODE="camera"
      shift
      ;;
    --expect)
      EXPECT="${2:-any}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[qr] argumento inválido: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$MODE" ]]; then
  usage
  exit 1
fi

EXPECTED_PREFIX="$(normalize_expectation "$EXPECT")"

if [[ "$MODE" == "image" ]]; then
  if [[ -z "$IMAGE_PATH" || ! -f "$IMAGE_PATH" ]]; then
    echo "[qr] imagem não encontrada: $IMAGE_PATH"
    exit 1
  fi
  if ! command -v zbarimg >/dev/null 2>&1; then
    echo "[qr] dependência ausente: zbarimg"
    exit 1
  fi
  SCANNED_PAYLOAD="$(zbarimg --quiet --raw "$IMAGE_PATH" | head -n 1)"
  validate_payload "$SCANNED_PAYLOAD" "$EXPECTED_PREFIX"
  exit 0
fi

if ! command -v zbarcam >/dev/null 2>&1; then
  echo "[qr] dependência ausente: zbarcam"
  exit 1
fi

echo "[qr] câmera ativa; mostre o QR (Ctrl+C para cancelar)" >&2
SCANNED_PAYLOAD="$(zbarcam --raw | head -n 1)"
validate_payload "$SCANNED_PAYLOAD" "$EXPECTED_PREFIX"
