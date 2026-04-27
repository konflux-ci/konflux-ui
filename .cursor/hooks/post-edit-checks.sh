#!/usr/bin/env bash
set -euo pipefail

MAX_RETRIES=5

source "$(dirname "$0")/lib.sh"

hook_input=$(cat)

# Detect platform: CURSOR_VERSION is always set in Cursor hooks, never in Claude Code
is_cursor=false
if [[ -n "${CURSOR_VERSION:-}" ]]; then
  is_cursor=true
fi

# Extract session identifier for per-session retry isolation
# Cursor: conversation_id, Claude Code: session_id
session_id=$(echo "$hook_input" | jq -r '.conversation_id // .session_id // empty' 2>/dev/null || true)

PROJECT_HASH=$(echo "$PWD" | portable_hash)
RETRY_KEY="${PROJECT_HASH}"
if [[ -n "$session_id" ]]; then
  SESSION_HASH=$(echo "$session_id" | portable_hash)
  RETRY_KEY="${PROJECT_HASH}-${SESSION_HASH}"
fi
TMP_DIR=$(hook_tmp_dir)
RETRY_FILE="${TMP_DIR}/post-edit-retries-${RETRY_KEY}"
TRACKED_FILE="${TMP_DIR}/edited-files-${RETRY_KEY}"

# Build the candidate set from two sources:
# 1. Tracked files (from afterFileEdit hook) — files the agent explicitly edited
# 2. Git dirty files (unstaged + untracked) — catches formatter/tool side-effects
# Then intersect with the git dirty set to drop files that were fully reverted.
git_dirty=$(
  {
    git diff --name-only 2>/dev/null || true
    git ls-files --others --exclude-standard 2>/dev/null || true
  } | sort -u | grep -E '\.(ts|tsx)$' || true
)

candidates="$git_dirty"
if [[ -f "$TRACKED_FILE" ]]; then
  tracked=$(sort -u "$TRACKED_FILE" | grep -E '\.(ts|tsx)$' || true)
  # Union tracked into candidates, then keep only what's still dirty
  candidates=$(
    { echo "$git_dirty"; echo "$tracked"; } \
      | grep -v '^$' | sort -u
  )
fi

# Intersect with git dirty set: drop files that were tracked but have been reverted
if [[ -n "$git_dirty" ]]; then
  changed_files=$(comm -12 <(echo "$candidates" | sort) <(echo "$git_dirty" | sort) || true)
else
  changed_files=""
fi

if [[ -z "$changed_files" ]]; then
  rm -f "$RETRY_FILE" "$TRACKED_FILE"
  exit 0
fi

retries=0
if [[ -f "$RETRY_FILE" ]]; then
  retries=$(cat "$RETRY_FILE" 2>/dev/null || echo 0)
  if ! [[ "$retries" =~ ^[0-9]+$ ]]; then
    retries=0
  fi
fi

errors=""

# Check 1: TypeScript type checks (composite in tsconfig.json enables incremental)
tsc_output=$(yarn tsc --noEmit 2>&1) || {
  errors="${errors}

=== TypeScript Errors ===
${tsc_output}"
}

# Check 2: ESLint on changed files only
eslint_files=()
while IFS= read -r f; do
  if [[ -f "$f" ]]; then
    eslint_files+=("$f")
  fi
done <<< "$changed_files"

if [[ ${#eslint_files[@]} -gt 0 ]]; then
  eslint_output=$(yarn eslint --no-error-on-unmatched-pattern --report-unused-disable-directives --max-warnings 0 "${eslint_files[@]}" 2>&1) || {
    errors="${errors}

=== ESLint Errors ===
${eslint_output}"
  }
fi

# Check 3: Reject newly introduced suppression comments
# NOTE: For tracked files, this diffs against HEAD, which may include user changes
# in the same file the agent edited. This is a known limitation — the alternative
# (snapshotting HEAD SHA at session start) adds significant complexity for a narrow
# false-positive window.
suppress_pattern='eslint-disable|@ts-ignore|@ts-expect-error'
suppress_lines=""
while IFS= read -r f; do
  if [[ -f "$f" ]]; then
    if git ls-files --error-unmatch "$f" &>/dev/null; then
      added=$(git diff -U0 HEAD -- "$f" 2>/dev/null \
        | grep -E '^[+]' \
        | grep -v '^[+]{3}' \
        | grep -E "$suppress_pattern" || true)
    else
      added=$(grep -nE "$suppress_pattern" "$f" 2>/dev/null || true)
    fi
    if [[ -n "$added" ]]; then
      suppress_lines="${suppress_lines}
${f}:
${added}"
    fi
  fi
done <<< "$changed_files"

if [[ -n "$suppress_lines" ]]; then
  errors="${errors}

=== Newly Added Suppression Comments ===
The following files contain new suppression comments (eslint-disable, @ts-ignore, @ts-expect-error) that must be removed. Fix the underlying issue instead:
${suppress_lines}"
fi

# --- All checks passed ---
if [[ -z "$errors" ]]; then
  rm -f "$RETRY_FILE" "$TRACKED_FILE"
  exit 0
fi

# --- Checks failed ---
retries=$((retries + 1))

if [[ $retries -ge $MAX_RETRIES ]]; then
  rm -f "$RETRY_FILE" "$TRACKED_FILE"

  final_msg="POST-EDIT CHECKS FAILED after ${MAX_RETRIES} attempts. You were unable to fix the following issues:
${errors}

IMPORTANT: DO NOT commit these changes. DO NOT push. DO NOT create a pull request.
Report these unresolved failures to the user and ask for guidance."

  if [[ "$is_cursor" == "true" ]]; then
    jq -n --arg msg "$final_msg" '{"followup_message": $msg}'
  else
    # Claude Code: stop and deliver failure summary to user
    jq -n --arg reason "$final_msg" '{"continue": false, "stopReason": $reason}'
  fi
  exit 0
fi

echo "$retries" > "$RETRY_FILE"

followup_msg="POST-EDIT CHECKS FAILED (attempt ${retries}/${MAX_RETRIES}). Fix the issues below and try again:
${errors}"

if [[ "$is_cursor" == "true" ]]; then
  # Cursor stop: followup_message triggers auto-continue
  jq -n --arg msg "$followup_msg" '{"followup_message": $msg}'
else
  # Claude Code Stop: decision "block" prevents stopping, reason tells Claude why
  jq -n --arg reason "$followup_msg" '{"decision": "block", "reason": $reason}'
fi
exit 0
