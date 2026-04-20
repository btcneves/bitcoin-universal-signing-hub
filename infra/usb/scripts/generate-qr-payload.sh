#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  ./infra/usb/scripts/generate-qr-payload.sh --payload <text> --out <png>
  ./infra/usb/scripts/generate-qr-payload.sh --from-file <txt> --out <png>

Generates QR for air-gapped xpub/PSBT transfer.
USAGE
}

PAYLOAD=""
OUT_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --payload)
      PAYLOAD="${2:-}"
      shift 2
      ;;
    --from-file)
      [[ -f "${2:-}" ]] || { echo "[qr] arquivo não encontrado: ${2:-}"; exit 1; }
      PAYLOAD="$(cat "$2")"
      shift 2
      ;;
    --out)
      OUT_PATH="${2:-}"
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

if [[ -z "$PAYLOAD" || -z "$OUT_PATH" ]]; then
  usage
  exit 1
fi

if ! command -v qrencode >/dev/null 2>&1; then
  echo "[qr] dependência ausente: qrencode"
  exit 1
fi

mkdir -p "$(dirname "$OUT_PATH")"
qrencode -t PNG -l M -s 8 -o "$OUT_PATH" "$PAYLOAD"
echo "[qr] QR gerado: $OUT_PATH"
