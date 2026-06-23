#!/usr/bin/env bash
# Launcher for @playwright/mcp that auto-detects Chrome/Chromium.
# Used by .cursor/mcp.json and .mcp.json so the MCP server finds
# the browser regardless of where it is installed on this system.
#
# The browser runs headless with a persistent profile so authentication
# cookies survive across sessions. See scripts/playwright_auth.sh for
# the headed login flow that populates the profile on first use.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

source "$SCRIPT_DIR/playwright_common.sh"

CHROME_PATH="${CHROME_PATH:-$(detect_chrome)}"
PROFILE_DIR="$PROJECT_ROOT/.playwright-mcp/profile"
mkdir -p "$PROFILE_DIR"

exec npx -y @playwright/mcp@0.0.75 \
  --headless \
  --user-data-dir="$PROFILE_DIR" \
  --caps=core \
  --allowed-origins="https://localhost:8080" \
  --ignore-https-errors \
  --viewport-size=1440x900 \
  --executable-path="$CHROME_PATH"
