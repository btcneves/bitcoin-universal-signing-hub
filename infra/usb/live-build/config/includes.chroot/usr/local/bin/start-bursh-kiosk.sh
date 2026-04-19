#!/usr/bin/env bash
set -euo pipefail

export DISPLAY=:0
export XDG_RUNTIME_DIR="/run/user/$(id -u)"

mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"

exec chromium \
  --kiosk \
  --incognito \
  --no-first-run \
  --disable-sync \
  --disable-features=Translate,AutofillServerCommunication \
  --app=http://127.0.0.1:4173
