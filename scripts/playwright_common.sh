#!/usr/bin/env bash
# Shared helpers for Playwright-related scripts.
# Source this file; do not execute it directly.

detect_chrome() {
  for bin in google-chrome google-chrome-stable chromium chromium-browser; do
    local p
    p=$(command -v "$bin" 2>/dev/null) && [ -x "$p" ] && echo "$p" && return
  done

  for p in \
    /usr/bin/google-chrome \
    /usr/bin/google-chrome-stable \
    /usr/bin/chromium \
    /usr/bin/chromium-browser \
    /opt/google/chrome/chrome \
    /snap/bin/chromium \
    ~/.local/share/flatpak/exports/bin/com.google.Chrome \
    /var/lib/flatpak/exports/bin/com.google.Chrome \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    [ -x "$p" ] && echo "$p" && return
  done

  echo "ERROR: Cannot find Chrome or Chromium. Install one and retry." >&2
  return 1
}
