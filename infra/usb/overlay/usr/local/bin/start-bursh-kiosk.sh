#!/usr/bin/env bash
set -euo pipefail

export XDG_RUNTIME_DIR=/run/user/1000
export DISPLAY=:0

# Chromium in kiosk fullscreen with offline web app bundle.
chromium --kiosk --incognito --no-first-run --disable-sync http://127.0.0.1:4173
