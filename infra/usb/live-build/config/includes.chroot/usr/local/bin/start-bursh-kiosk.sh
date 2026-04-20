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
  --no-default-browser-check \
  --disable-sync \
  --disable-breakpad \
  --disable-component-update \
  --disable-domain-reliability \
  --disable-background-networking \
  --disable-features=Translate,AutofillServerCommunication,MediaRouter,OptimizationHints,NetworkTimeServiceQuerying \
  --disable-session-crashed-bubble \
  --password-store=basic \
  --disk-cache-size=1 \
  --app=http://127.0.0.1:4173
