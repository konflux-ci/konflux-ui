#!/usr/bin/env bash
set -euo pipefail

# Consume stdin (required by both Cursor and Claude Code hooks protocol)
cat > /dev/null

# Loop protection: counter file tracks completed failing iterations
MAX_RETRIES="${POST_EDIT_MAX_RETRIES:-3}"
[[ "$MAX_RETRIES" =~ ^[0-9]+$ ]] || MAX_RETRIES=3
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
REPO_HASH=$(printf '%s' "$REPO_ROOT" | cksum | cut -d' ' -f1)

COUNTER_DIR="${TMPDIR:-/tmp}/post-edit-hooks-$(id -u)"
mkdir -p "$COUNTER_DIR" && chmod 700 "$COUNTER_DIR"
COUNTER_FILE="$COUNTER_DIR/$REPO_HASH"

count=0
if [[ -f "$COUNTER_FILE" ]]; then
  raw=$(cat "$COUNTER_FILE")
  [[ "$raw" =~ ^[0-9]+$ ]] && count=$raw
fi

changed_files=$(git diff --name-only 2>/dev/null || true)
if [[ -z "$changed_files" ]]; then
  rm -f "$COUNTER_FILE"
  exit 0
fi

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

suppress=$(git diff -U0 2>/dev/null \
  | grep -E '^\+' | grep -v '^\+\+\+' \
  | grep -E 'eslint-disable|@ts-ignore|@ts-expect-error' || true)
[[ -n "$suppress" ]] && errors="${errors}
=== New Suppression Comments ===
Remove these and fix the underlying issues:
${suppress}"

if [[ -z "$errors" ]]; then
  rm -f "$COUNTER_FILE"
  exit 0
fi

count=$(( count + 1 ))
echo "$count" > "$COUNTER_FILE"

if (( count >= MAX_RETRIES )); then
  rm -f "$COUNTER_FILE"
  msg="Post-edit hook failed ${count} times consecutively. Stopping to prevent infinite loop. Remaining issues:${errors}"
  if [[ -n "${CURSOR_VERSION:-}" ]]; then
    jq -n --arg msg "$msg" '{"followup_message": $msg}'
  else
    # systemMessage (not "decision":"block") so Claude stops instead of retrying the bail-out
    jq -n --arg msg "$msg" '{"systemMessage": $msg}'
  fi
  exit 0
fi

msg="Post-edit checks found issues. Please fix:${errors}"

if [[ -n "${CURSOR_VERSION:-}" ]]; then
  jq -n --arg msg "$msg" '{"followup_message": $msg}'
else
  jq -n --arg reason "$msg" '{"decision": "block", "reason": $reason}'
fi
