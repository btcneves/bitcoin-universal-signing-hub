#!/usr/bin/env bash
set -euo pipefail

WEB_ROOT="/opt/bursh/web-dist"
PORT="4173"

if [[ ! -f "$WEB_ROOT/index.html" ]]; then
  echo "[secure-usb] missing web bundle in $WEB_ROOT"
  exit 1
fi

exec python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$WEB_ROOT"
