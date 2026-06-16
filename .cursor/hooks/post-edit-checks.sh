#!/usr/bin/env bash
set -euo pipefail

# Consume stdin (required by both Cursor and Claude Code hooks protocol)
cat > /dev/null

# Loop protection: counter file tracks completed failing iterations
MAX_RETRIES="${POST_EDIT_MAX_RETRIES:-3}"
if ! [[ "$MAX_RETRIES" =~ ^[0-9]+$ ]]; then
  echo "post-edit-checks: invalid POST_EDIT_MAX_RETRIES='$MAX_RETRIES', defaulting to 3" >&2
  MAX_RETRIES=3
fi
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
REPO_HASH=$(printf '%s' "$REPO_ROOT" | cksum | cut -d' ' -f1)

COUNTER_DIR="${TMPDIR:-/tmp}/post-edit-hooks-$(id -u)"
mkdir -p "$COUNTER_DIR" && chmod 700 "$COUNTER_DIR"
COUNTER_FILE="$COUNTER_DIR/$REPO_HASH"

count=0
if [[ -f "$COUNTER_FILE" ]]; then
  raw=$(cat "$COUNTER_FILE")
  [[ "$raw" =~ ^[0-9]+$ ]] && count=$raw
  # Staleness check: reset if the counter file is older than 5 minutes
  # (new editing session or long pause between edits)
  if [[ -n "$(find "$COUNTER_FILE" -mmin +5 2>/dev/null)" ]]; then
    count=0
    rm -f "$COUNTER_FILE"
  fi
fi

changed_files=$({
  git diff --name-only --diff-filter=d 2>/dev/null || true
  git ls-files --others --exclude-standard 2>/dev/null || true
} | sort -u)
if [[ -z "$changed_files" ]]; then
  rm -f "$COUNTER_FILE"
  exit 0
fi

# Early bail-out: if counter already at/above MAX_RETRIES, exit silently.
# Any output (followup_message/systemMessage) triggers a new agent turn,
# which re-triggers this hook, creating an infinite feedback loop.
if (( count >= MAX_RETRIES )); then
  exit 0
fi

errors=""

# Run tsc on the full project but only report errors in changed files
ts_changed=$(echo "$changed_files" | grep -E '\.(ts|tsx)$' || true)
if [[ -n "$ts_changed" ]]; then
  tsc_full=$(yarn tsc --noEmit 2>&1) || {
    tsc_out=""
    while IFS= read -r file; do
      file_errors=$(echo "$tsc_full" | grep "^${file}(" || true)
      [[ -n "$file_errors" ]] && tsc_out="${tsc_out:+$tsc_out
}$file_errors"
    done <<< "$ts_changed"
    [[ -n "$tsc_out" ]] && errors="${errors}
=== TypeScript Errors ===
${tsc_out}"
  }
fi

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

suppress=""
# Check tracked modified files via diff
diff_suppress=$(git diff -U0 2>/dev/null \
  | grep -E '^\+' | grep -v '^\+\+\+' \
  | grep -E 'eslint-disable|@ts-ignore|@ts-expect-error' || true)
[[ -n "$diff_suppress" ]] && suppress="$diff_suppress"
# Check untracked files by scanning their full content
untracked=$(git ls-files --others --exclude-standard 2>/dev/null \
  | grep -E '\.(ts|tsx|js|jsx)$' || true)
if [[ -n "$untracked" ]]; then
  untracked_suppress=$(echo "$untracked" \
    | xargs grep -nH -E 'eslint-disable|@ts-ignore|@ts-expect-error' 2>/dev/null || true)
  [[ -n "$untracked_suppress" ]] && suppress="${suppress:+$suppress
}$untracked_suppress"
fi
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
  # Do NOT reset the counter — keep it elevated so subsequent invocations
  # hit the silent early bail-out above, breaking the feedback loop.
  # This is the LAST message the agent will receive about these errors.
  msg="Post-edit hook failed ${count} times consecutively. Stopping — these issues appear pre-existing or unfixable in this session. Do not attempt further fixes for these errors. Remaining issues:${errors}"
  if [[ -n "${CURSOR_VERSION:-}" ]]; then
    jq -n --arg msg "$msg" '{"followup_message": $msg}'
  else
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
