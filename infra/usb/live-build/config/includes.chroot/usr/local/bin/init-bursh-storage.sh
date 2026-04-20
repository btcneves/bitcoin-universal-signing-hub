#!/usr/bin/env bash
set -euo pipefail

umask 077

PERSIST_DEVICE_LABEL="BURSH-DATA"
PERSIST_MOUNT_POINT="/mnt/bursh-data"
RUNTIME_SENSITIVE_DIR="/run/bursh-sensitive"
APP_STATE_ROOT="/var/lib/bursh"

mount_bind_hardened() {
  local source_dir="$1"
  local target_dir="$2"

  mount --bind "$source_dir" "$target_dir"
  mount -o remount,bind,rw,nosuid,nodev,noexec "$target_dir"
}

mkdir -p "$RUNTIME_SENSITIVE_DIR"
chmod 700 "$RUNTIME_SENSITIVE_DIR"

mkdir -p "$APP_STATE_ROOT/watch-only" "$APP_STATE_ROOT/config"
chmod 700 "$APP_STATE_ROOT"
chmod 700 "$APP_STATE_ROOT/watch-only" "$APP_STATE_ROOT/config"

if device_path="$(blkid -L "$PERSIST_DEVICE_LABEL" 2>/dev/null)"; then
  mkdir -p "$PERSIST_MOUNT_POINT"
  if ! mountpoint -q "$PERSIST_MOUNT_POINT"; then
    mount -o rw,nosuid,nodev,noexec "$device_path" "$PERSIST_MOUNT_POINT"
  fi

  mkdir -p "$PERSIST_MOUNT_POINT/watch-only" "$PERSIST_MOUNT_POINT/config"
  chmod 700 "$PERSIST_MOUNT_POINT/watch-only" "$PERSIST_MOUNT_POINT/config"

  mount_bind_hardened "$PERSIST_MOUNT_POINT/watch-only" "$APP_STATE_ROOT/watch-only"
  mount_bind_hardened "$PERSIST_MOUNT_POINT/config" "$APP_STATE_ROOT/config"
fi
