#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEFAULT_ISO="$ROOT_DIR/infra/usb/dist/bursh-secure-usb-amd64.iso"

usage() {
  cat <<'USAGE'
Usage:
  sudo ./infra/usb/scripts/prepare-physical-usb.sh <device> [iso-path] [--with-bursh-data]

Examples:
  sudo ./infra/usb/scripts/prepare-physical-usb.sh /dev/sdX
  sudo ./infra/usb/scripts/prepare-physical-usb.sh /dev/sdX infra/usb/dist/bursh-secure-usb-amd64.iso --with-bursh-data

What it does:
  1) Writes BURSH ISO to USB (destructive)
  2) Optionally creates BURSH-DATA ext4 partition in remaining free space
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 ]]; then
  usage
  exit 0
fi

if [[ "$EUID" -ne 0 ]]; then
  echo "[secure-usb] run as root (use sudo)."
  exit 1
fi

DEVICE="$1"
ISO_PATH="${2:-$DEFAULT_ISO}"
CREATE_BURSH_DATA="false"

if [[ "${2:-}" == "--with-bursh-data" || "${3:-}" == "--with-bursh-data" ]]; then
  CREATE_BURSH_DATA="true"
fi

if [[ ! -b "$DEVICE" ]]; then
  echo "[secure-usb] not a block device: $DEVICE"
  exit 1
fi

if [[ "$(lsblk -dn -o TYPE "$DEVICE")" != "disk" ]]; then
  echo "[secure-usb] target must be a whole disk device (example: /dev/sdX, /dev/nvme1n1)."
  exit 1
fi

if [[ ! -f "$ISO_PATH" ]]; then
  echo "[secure-usb] ISO not found: $ISO_PATH"
  echo "Run: ./infra/usb/scripts/build-iso.sh"
  exit 1
fi

if ! command -v parted >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: parted"
  exit 1
fi

if ! command -v mkfs.ext4 >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: mkfs.ext4 (e2fsprogs)"
  exit 1
fi

if ! command -v qrencode >/dev/null 2>&1; then
  echo "[secure-usb] warning: qrencode não encontrado (geração de QR para handoff offline ficará indisponível no host)."
fi

if ! command -v zbarimg >/dev/null 2>&1; then
  echo "[secure-usb] warning: zbarimg não encontrado (leitura de QR por imagem ficará indisponível no host)."
fi

if ! command -v zbarcam >/dev/null 2>&1; then
  echo "[secure-usb] warning: zbarcam não encontrado (leitura de QR por câmera ficará indisponível no host)."
fi

echo "[secure-usb] target: $DEVICE"
echo "[secure-usb] iso: $ISO_PATH"
echo "[secure-usb] WARNING: all data on $DEVICE will be erased."

while read -r part_name _; do
  umount "$part_name" 2>/dev/null || true
done < <(lsblk -nrpo NAME,MOUNTPOINT "$DEVICE" | tail -n +2)

echo "[secure-usb] writing ISO (this may take a while)..."
dd if="$ISO_PATH" of="$DEVICE" bs=4M status=progress conv=fsync,notrunc
sync
partprobe "$DEVICE" || true
sleep 1

if [[ "$CREATE_BURSH_DATA" == "true" ]]; then
  echo "[secure-usb] creating optional BURSH-DATA partition..."

  free_line="$(parted -ms "$DEVICE" unit s print free | awk -F: '$5=="free" && $3>$2 {line=$0} END{print line}')"
  if [[ -z "$free_line" ]]; then
    echo "[secure-usb] no free space available for BURSH-DATA."
    exit 1
  fi

  free_start="$(awk -F: '{print $2}' <<<"$free_line" | tr -d 's')"
  free_end="$(awk -F: '{print $3}' <<<"$free_line" | tr -d 's')"

  if [[ -z "$free_start" || -z "$free_end" ]]; then
    echo "[secure-usb] unable to parse free space for BURSH-DATA."
    exit 1
  fi

  parted -s "$DEVICE" mkpart primary ext4 "${free_start}s" "${free_end}s"
  partprobe "$DEVICE" || true
  sleep 1

  new_part="$(lsblk -nrpo NAME "$DEVICE" | tail -n 1)"

  if [[ ! -b "$new_part" ]]; then
    echo "[secure-usb] failed to identify BURSH-DATA partition."
    exit 1
  fi

  mkfs.ext4 -F -L BURSH-DATA "$new_part"
  echo "[secure-usb] BURSH-DATA ready on: $new_part"
fi

cat <<'DONE'
[secure-usb] USB preparation complete.
Next:
  1) Remove USB safely and insert on target machine.
  2) Boot from USB in firmware boot menu.
  3) In live system, run:
     sudo /usr/local/bin/smoke-test-bursh-live.sh
     sudo /usr/local/bin/collect-bursh-boot-evidence.sh
DONE

cat <<'QRNOTE'

[secure-usb] Nota de segurança operacional:
  Para xpub/PSBT use fluxo air-gapped por QR (câmera/imagem), sem transferência por pendrive.
  Scripts úteis:
    ./infra/usb/scripts/generate-qr-payload.sh
    ./infra/usb/scripts/scan-qr-payload.sh
QRNOTE
