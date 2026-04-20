#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./infra/usb/scripts/scan-qr-payload.sh --image <file>
  ./infra/usb/scripts/scan-qr-payload.sh --camera

Reads an xpub/PSBT QR payload without network or USB transfer.
Output is printed to stdout only (in-memory flow).
USAGE
}

MODE=""
IMAGE_PATH=""

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

if [[ "$MODE" == "image" ]]; then
  if [[ -z "$IMAGE_PATH" || ! -f "$IMAGE_PATH" ]]; then
    echo "[qr] imagem não encontrada: $IMAGE_PATH"
    exit 1
  fi
  if ! command -v zbarimg >/dev/null 2>&1; then
    echo "[qr] dependência ausente: zbarimg"
    exit 1
  fi
  zbarimg --quiet --raw "$IMAGE_PATH"
  exit 0
fi

if ! command -v zbarcam >/dev/null 2>&1; then
  echo "[qr] dependência ausente: zbarcam"
  exit 1
fi

echo "[qr] câmera ativa; mostre o QR (Ctrl+C para cancelar)" >&2
zbarcam --raw | head -n 1
