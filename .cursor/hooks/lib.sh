#!/usr/bin/env bash
# Shared helpers for Cursor/Claude Code hooks.
# Source this file: source "$(dirname "$0")/lib.sh"

# Portable hash: sha256sum (Linux), shasum (macOS), md5sum (fallback)
portable_hash() {
  if command -v sha256sum &>/dev/null; then
    sha256sum | cut -c1-12
  elif command -v shasum &>/dev/null; then
    shasum -a 256 | cut -c1-12
  else
    md5sum | cut -c1-12
  fi
}

# Per-user temp directory: $XDG_RUNTIME_DIR (per-user, mode 0700) > /tmp
hook_tmp_dir() {
  local base="${XDG_RUNTIME_DIR:-/tmp}"
  local dir="${base}/konflux-ui-hooks"
  mkdir -p "$dir"
  echo "$dir"
}
