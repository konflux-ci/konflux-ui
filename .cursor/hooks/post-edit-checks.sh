#!/usr/bin/env bash
set -euo pipefail

# Consume stdin (required by both Cursor and Claude Code hooks protocol)
cat > /dev/null

errors=""

tsc_out=$(yarn tsc --noEmit 2>&1) || errors="${errors}
=== TypeScript Errors ===
${tsc_out}"

lint_out=$(yarn lint 2>&1) || errors="${errors}
=== Lint Errors ===
${lint_out}"

suppress=$(git diff -U0 HEAD 2>/dev/null \
  | grep -E '^\+' | grep -v '^\+\+\+' \
  | grep -E 'eslint-disable|@ts-ignore|@ts-expect-error' || true)
[[ -n "$suppress" ]] && errors="${errors}
=== New Suppression Comments ===
Remove these and fix the underlying issues:
${suppress}"

[[ -z "$errors" ]] && exit 0

msg="Post-edit checks found issues. Please fix:${errors}"

if [[ -n "${CURSOR_VERSION:-}" ]]; then
  jq -n --arg msg "$msg" '{"followup_message": $msg}'
else
  jq -n --arg reason "$msg" '{"decision": "block", "reason": $reason}'
fi
