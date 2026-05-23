#!/usr/bin/env bash
set -euo pipefail

# Consume stdin (required by both Cursor and Claude Code hooks protocol)
cat > /dev/null

changed_files=$(git diff --name-only HEAD 2>/dev/null || true)
[[ -z "$changed_files" ]] && exit 0

errors=""

tsc_out=$(yarn tsc --noEmit 2>&1) || errors="${errors}
=== TypeScript Errors ===
${tsc_out}"

eslint_files=$(echo "$changed_files" | grep -E '\.(ts|tsx)$' || true)
if [[ -n "$eslint_files" ]]; then
  lint_out=$(echo "$eslint_files" | xargs yarn eslint --report-unused-disable-directives --max-warnings 0 2>&1) || errors="${errors}
=== ESLint Errors ===
${lint_out}"
fi

scss_files=$(echo "$changed_files" | grep -E '\.scss$' || true)
if [[ -n "$scss_files" ]]; then
  style_out=$(echo "$scss_files" | xargs yarn stylelint --config .stylelintrc.json 2>&1) || errors="${errors}
=== Stylelint Errors ===
${style_out}"
fi

test_files=$(echo "$changed_files" | grep -E '\.(ts|tsx)$' || true)
if [[ -n "$test_files" ]]; then
  test_out=$(echo "$test_files" | xargs yarn jest --findRelatedTests --passWithNoTests 2>&1) || errors="${errors}
=== Test Failures ===
${test_out}"
fi

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
