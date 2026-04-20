#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEFAULT_ISO="$ROOT_DIR/infra/usb/dist/bursh-secure-usb-amd64.iso"
ISO_PATH="${1:-$DEFAULT_ISO}"
ARTIFACTS_BASE_DIR="${2:-$ROOT_DIR/infra/usb/dist/vm-validation}"
TIMEOUT_SECONDS="${VALIDATE_TIMEOUT_SECONDS:-180}"

if ! command -v qemu-system-x86_64 >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: qemu-system-x86_64"
  exit 1
fi

if ! command -v mkfs.ext4 >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: mkfs.ext4 (e2fsprogs)"
  exit 1
fi

if ! command -v timeout >/dev/null 2>&1; then
  echo "[secure-usb] missing dependency: timeout (coreutils)"
  exit 1
fi

if ! command -v qrencode >/dev/null 2>&1; then
  echo "[secure-usb] warning: qrencode não encontrado (fluxo air-gapped por QR ficará indisponível na VM)."
fi

if ! command -v zbarimg >/dev/null 2>&1; then
  echo "[secure-usb] warning: zbarimg não encontrado (importação de QR por imagem ficará indisponível na VM)."
fi

if [[ ! -f "$ISO_PATH" ]]; then
  echo "[secure-usb] ISO not found: $ISO_PATH"
  echo "Run: ./infra/usb/scripts/build-iso.sh"
  exit 1
fi

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
ARTIFACTS_RUN_DIR="${ARTIFACTS_BASE_DIR%/}/$RUN_ID"
mkdir -p "$ARTIFACTS_RUN_DIR"
ln -sfn "$ARTIFACTS_RUN_DIR" "${ARTIFACTS_BASE_DIR%/}/latest"

SERIAL_LOG="$ARTIFACTS_RUN_DIR/serial.log"
QEMU_STDOUT_LOG="$ARTIFACTS_RUN_DIR/qemu.log"
QEMU_MONITOR_SOCKET="$ARTIFACTS_RUN_DIR/qemu-monitor.sock"
TRIGGER_IMAGE="$ARTIFACTS_RUN_DIR/bursh-validate-trigger.img"
METADATA_FILE="$ARTIFACTS_RUN_DIR/metadata.txt"

cat > "$METADATA_FILE" <<META
run_id=$RUN_ID
iso_path=$ISO_PATH
timeout_seconds=$TIMEOUT_SECONDS
started_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
META

truncate -s 16M "$TRIGGER_IMAGE"
mkfs.ext4 -q -L BURSH-VALIDATE "$TRIGGER_IMAGE"

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
  -drive "file=$TRIGGER_IMAGE,format=raw,if=virtio"
  -device qemu-xhci
  -display none
  -serial "file:$SERIAL_LOG"
  -monitor "unix:$QEMU_MONITOR_SOCKET,server,nowait"
  -net none
  -no-reboot
)

printf '%q ' "${QEMU_CMD[@]}" > "$ARTIFACTS_RUN_DIR/qemu-command.sh"
printf '\n' >> "$ARTIFACTS_RUN_DIR/qemu-command.sh"

echo "[secure-usb] running VM boot validation"
echo "  ISO: $ISO_PATH"
echo "  Artifacts: $ARTIFACTS_RUN_DIR"
echo "  Timeout: ${TIMEOUT_SECONDS}s"

set +e
timeout --signal=TERM --kill-after=10s "$TIMEOUT_SECONDS" "${QEMU_CMD[@]}" >"$QEMU_STDOUT_LOG" 2>&1
QEMU_EXIT_CODE=$?
set -e

PASS_MARKER='[secure-usb-auto] RESULT=PASS'
FAIL_MARKER='[secure-usb-auto] RESULT=FAIL'

RESULT="FAIL"
REASON="unknown"
if grep -qF "$PASS_MARKER" "$SERIAL_LOG"; then
  RESULT="PASS"
  REASON="pass-marker-found"
elif grep -qF "$FAIL_MARKER" "$SERIAL_LOG"; then
  RESULT="FAIL"
  REASON="fail-marker-found"
elif [[ "$QEMU_EXIT_CODE" -eq 124 ]]; then
  RESULT="FAIL"
  REASON="timeout"
else
  RESULT="FAIL"
  REASON="qemu-exit-$QEMU_EXIT_CODE"
fi

cat >> "$METADATA_FILE" <<META
qemu_exit_code=$QEMU_EXIT_CODE
finished_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
result=$RESULT
reason=$REASON
META

if [[ "$RESULT" == "PASS" ]]; then
  echo "PASS [secure-usb] VM boot validation passed"
  echo "evidence: $ARTIFACTS_RUN_DIR"
  exit 0
fi

echo "FAIL [secure-usb] VM boot validation failed ($REASON)"
echo "evidence: $ARTIFACTS_RUN_DIR"

echo
if [[ -f "$SERIAL_LOG" ]]; then
  echo "--- serial.log (tail -n 80) ---"
  tail -n 80 "$SERIAL_LOG" || true
fi

exit 1
