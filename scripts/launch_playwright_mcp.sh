#!/usr/bin/env bash
# Launcher for @playwright/mcp that auto-detects Chrome/Chromium.
# Used by .cursor/mcp.json and .mcp.json so the MCP server finds
# the browser regardless of where it is installed on this system.

set -euo pipefail

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
  exit 1
}

CHROME_PATH="${CHROME_PATH:-$(detect_chrome)}"

exec npx -y @playwright/mcp@0.0.75 \
  --caps=core \
  --allowed-origins="https://localhost:8080" \
  --ignore-https-errors \
  --viewport-size=1440x900 \
  --executable-path="$CHROME_PATH"
