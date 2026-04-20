#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEFAULT_BASE_DIR="/tmp"
if mountpoint -q /mnt/bursh-data && [[ -w /mnt/bursh-data ]]; then
  DEFAULT_BASE_DIR="/mnt/bursh-data"
fi

OUTPUT_BASE_DIR="${1:-$DEFAULT_BASE_DIR}"
EVIDENCE_DIR="${OUTPUT_BASE_DIR%/}/bursh-boot-evidence-$TIMESTAMP"
mkdir -p "$EVIDENCE_DIR"

SERVICES=(
  bursh-storage-init.service
  bursh-web.service
  bursh-kiosk.service
)

{
  echo "timestamp_utc=$TIMESTAMP"
  echo "hostname=$(hostname)"
  echo "kernel=$(uname -a)"
  echo "output_dir=$EVIDENCE_DIR"
} > "$EVIDENCE_DIR/metadata.txt"

{
  echo "=== service states ==="
  for svc in "${SERVICES[@]}"; do
    state="$(systemctl is-active "$svc" 2>/dev/null || true)"
    printf '%s=%s\n' "$svc" "${state:-unknown}"
  done
} > "$EVIDENCE_DIR/services-summary.txt"

for svc in "${SERVICES[@]}"; do
  safe_name="${svc//./-}"
  systemctl status "$svc" --no-pager > "$EVIDENCE_DIR/systemctl-status-$safe_name.txt" 2>&1 || true
  journalctl -b -u "$svc" --no-pager > "$EVIDENCE_DIR/journal-$safe_name.txt" 2>&1 || true
done

journalctl -b --no-pager > "$EVIDENCE_DIR/journal-boot.txt" 2>&1 || true
journalctl -b -p warning --no-pager > "$EVIDENCE_DIR/journal-boot-warning-plus.txt" 2>&1 || true

findmnt -R /var/lib/bursh > "$EVIDENCE_DIR/findmnt-var-lib-bursh.txt" 2>&1 || true
findmnt > "$EVIDENCE_DIR/findmnt-all.txt" 2>&1 || true
mount > "$EVIDENCE_DIR/mount.txt" 2>&1 || true
lsblk -f > "$EVIDENCE_DIR/lsblk-f.txt" 2>&1 || true

/usr/local/bin/smoke-test-bursh-live.sh > "$EVIDENCE_DIR/smoke-test.txt" 2>&1 || true

TARBALL_PATH="${EVIDENCE_DIR}.tar.gz"
tar -czf "$TARBALL_PATH" -C "$OUTPUT_BASE_DIR" "$(basename "$EVIDENCE_DIR")"

cat <<MSG
[secure-usb] evidence collected
  directory: $EVIDENCE_DIR
  archive:   $TARBALL_PATH
MSG
