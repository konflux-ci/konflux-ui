#!/usr/bin/env bash
set -euo pipefail

# Saves a baseline git snapshot at session start so the stop hook can
# isolate agent-only changes from pre-existing dirty files.

input=$(cat)
session_key=$(echo "$input" | jq -r '.conversation_id // .session_id // empty' 2>/dev/null || true)
session_key=$(printf '%s' "$session_key" | tr -cd 'a-zA-Z0-9_-')

if [[ -z "$session_key" ]]; then
  exit 0
fi

baseline_dir="${TMPDIR:-/tmp}/post-edit-baselines-$(id -u)"
mkdir -m 700 -p "$baseline_dir"

# git stash create produces a commit object of the current working tree
# without actually stashing. Returns empty if the tree is clean.
baseline_ref=$(git stash create 2>/dev/null || true)
if [[ -z "$baseline_ref" ]]; then
  baseline_ref=$(git rev-parse HEAD 2>/dev/null || echo "")
fi

echo "$baseline_ref" > "$baseline_dir/${session_key}.ref"

# Save current untracked files (stash create doesn't capture them)
git ls-files --others --exclude-standard 2>/dev/null | sort > "$baseline_dir/${session_key}.untracked"
exit 0
