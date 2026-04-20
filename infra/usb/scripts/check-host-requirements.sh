#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DIST_DIR="$ROOT_DIR/infra/usb/dist"

required_commands=(
  lb
  qemu-system-x86_64
  sha256sum
  gpg
)

missing=()
for cmd in "${required_commands[@]}"; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    missing+=("$cmd")
  fi
done

mkdir -p "$DIST_DIR"
REPORT_FILE="$DIST_DIR/host-requirements-report.txt"

{
  echo "[secure-usb] host requirements report"
  echo "generated_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "host_kernel=$(uname -srmo)"
  echo "repo_root=$ROOT_DIR"
  echo
  for cmd in "${required_commands[@]}"; do
    if command -v "$cmd" >/dev/null 2>&1; then
      echo "OK   $cmd=$(command -v "$cmd")"
    else
      echo "MISS $cmd"
    fi
  done
} > "$REPORT_FILE"

cat "$REPORT_FILE"

echo
if ((${#missing[@]} > 0)); then
  cat <<MSG
[secure-usb] missing host dependencies: ${missing[*]}

Install on Debian/Ubuntu:
  sudo apt-get update
  sudo apt-get install -y live-build qemu-system-x86 gnupg coreutils

If apt access is blocked by proxy/network policy, run this workflow in a host with unrestricted access to Ubuntu/Debian repositories.
MSG
  exit 1
fi

echo "[secure-usb] host dependency check passed."
