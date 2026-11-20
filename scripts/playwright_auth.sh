#!/usr/bin/env bash
# Opens the UI in a headed browser to authenticate the running dev server.
# Kubelogin may open the default browser for login. Run this when the headless
# screenshot flow detects that the current dev-server session is unauthenticated.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/playwright_common.sh"

export CHROME_PATH="${CHROME_PATH:-$(detect_chrome)}"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export PROFILE_DIR="$PROJECT_ROOT/.playwright-mcp/profile"
mkdir -p "$PROFILE_DIR"

node "$SCRIPT_DIR/playwright_auth_runner.mjs"
