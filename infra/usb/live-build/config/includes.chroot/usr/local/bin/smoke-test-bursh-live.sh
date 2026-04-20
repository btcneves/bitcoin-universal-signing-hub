#!/usr/bin/env bash
set -euo pipefail

failures=0

pass() {
  echo "[PASS] $1"
}

fail() {
  echo "[FAIL] $1"
  failures=$((failures + 1))
}

check_service_active() {
  local service="$1"
  if systemctl is-active --quiet "$service"; then
    pass "service active: $service"
  else
    fail "service not active: $service"
  fi
}

check_service_active "bursh-storage-init.service"
check_service_active "bursh-web.service"
check_service_active "bursh-kiosk.service"

if python3 - <<'PY'
import urllib.request
urllib.request.urlopen("http://127.0.0.1:4173", timeout=5)
PY
then
  pass "local web app reachable at http://127.0.0.1:4173"
else
  fail "local web app is not reachable at http://127.0.0.1:4173"
fi

if [[ -d /run/bursh-sensitive ]]; then
  pass "sensitive runtime directory exists in /run/bursh-sensitive"
else
  fail "missing /run/bursh-sensitive"
fi

if mountpoint -q /mnt/bursh-data; then
  pass "optional persistence partition mounted at /mnt/bursh-data"

  if mountpoint -q /var/lib/bursh/watch-only && mountpoint -q /var/lib/bursh/config; then
    pass "watch-only/config bind mounts active"
  else
    fail "watch-only/config bind mounts not active while persistence is mounted"
  fi
else
  pass "no BURSH-DATA partition mounted (ephemeral mode)"
fi

if [[ -e /var/lib/bursh/sensitive ]]; then
  fail "/var/lib/bursh/sensitive should not exist"
else
  pass "no sensitive persistence directory under /var/lib/bursh"
fi

echo
if (( failures > 0 )); then
  echo "[secure-usb] smoke test finished with $failures failure(s)."
  exit 1
fi

echo "[secure-usb] smoke test passed."
