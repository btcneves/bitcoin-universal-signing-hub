#!/usr/bin/env bash
set -euo pipefail

ISO_NAME="bursh-secure-usb.iso"
WORKDIR="$(pwd)/infra/usb/build"
ROOTFS="$WORKDIR/rootfs"

mkdir -p "$ROOTFS"
cp -r infra/usb/overlay/* "$ROOTFS" || true

cat <<MSG
[Secure USB Edition]
- Build skeleton prepared.
- Integrate with Debian Live Build / ArchISO pipeline in CI runner.
- Output target: $ISO_NAME
MSG
