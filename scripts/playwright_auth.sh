#!/usr/bin/env bash
# Opens a headed browser for SSO login so that authentication cookies are
# saved to the shared Playwright profile.  Run this when the headless
# screenshot flow detects that the user is not authenticated.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/playwright_common.sh"

export CHROME_PATH="${CHROME_PATH:-$(detect_chrome)}"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export PROFILE_DIR="$PROJECT_ROOT/.playwright-mcp/profile"
mkdir -p "$PROFILE_DIR"

node "$SCRIPT_DIR/playwright_auth_runner.mjs"
