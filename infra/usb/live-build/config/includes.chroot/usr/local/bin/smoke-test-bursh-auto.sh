#!/usr/bin/env bash
set -euo pipefail

RESULT="PASS"
TRIGGER_LABEL="BURSH-VALIDATE"
LOG_FILE="/var/log/bursh-auto-smoke.log"

serial_output_target() {
  if [[ -c /dev/ttyS0 ]]; then
    echo "/dev/ttyS0"
    return
  fi
  echo "/dev/console"
}

SERIAL_TARGET="$(serial_output_target)"
exec > >(tee -a "$LOG_FILE" "$SERIAL_TARGET") 2>&1

echo "[secure-usb-auto] started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

auto_fail() {
  RESULT="FAIL"
  echo "[secure-usb-auto] $1"
}

trigger_device="$(blkid -L "$TRIGGER_LABEL" || true)"
if [[ -z "$trigger_device" ]]; then
  echo "[secure-usb-auto] trigger label $TRIGGER_LABEL not found, skipping"
  exit 0
fi

echo "[secure-usb-auto] trigger detected at $trigger_device"

if ! /usr/local/bin/smoke-test-bursh-live.sh; then
  auto_fail "smoke-test-bursh-live.sh returned non-zero"
fi

echo "[secure-usb-auto] collecting evidence"
systemctl --no-pager --full status bursh-storage-init.service || auto_fail "bursh-storage-init.service status failed"
systemctl --no-pager --full status bursh-web.service || auto_fail "bursh-web.service status failed"
systemctl --no-pager --full status bursh-kiosk.service || auto_fail "bursh-kiosk.service status failed"

journalctl --no-pager -u bursh-storage-init.service -u bursh-web.service -u bursh-kiosk.service -n 200 || auto_fail "journalctl capture failed"

mount | grep -E 'bursh|BURSH-DATA' || true

if [[ "$RESULT" == "PASS" ]]; then
  echo "[secure-usb-auto] RESULT=PASS"
else
  echo "[secure-usb-auto] RESULT=FAIL"
fi

sync
systemctl poweroff
