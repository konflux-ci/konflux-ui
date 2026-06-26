#!/usr/bin/env bash
set -euo pipefail

# Saves a baseline git snapshot at session start so the stop hook can
# isolate agent-only changes from pre-existing dirty files.

DEBUG_LOG="/tmp/post-edit-debug-$(id -u).log"
dbg() { echo "[session-baseline $(date +%H:%M:%S)] $*" | tee -a "$DEBUG_LOG" >&2; }

dbg "hook started, PID=$$, PWD=$PWD"

input=$(cat)
session_key=$(echo "$input" | jq -r '.conversation_id // .session_id // empty' 2>/dev/null || true)

if [[ -z "$session_key" ]]; then
  dbg "no session key found, skipping baseline"
  exit 0
fi

dbg "session_key='$session_key'"

baseline_dir="${TMPDIR:-/tmp}/post-edit-baselines-$(id -u)"
mkdir -p "$baseline_dir" && chmod 700 "$baseline_dir"

# git stash create produces a commit object of the current working tree
# without actually stashing. Returns empty if the tree is clean.
baseline_ref=$(git stash create 2>/dev/null || true)
if [[ -z "$baseline_ref" ]]; then
  baseline_ref=$(git rev-parse HEAD 2>/dev/null || echo "")
  dbg "tree is clean, using HEAD as baseline: $baseline_ref"
else
  dbg "stash snapshot created: $baseline_ref"
fi

echo "$baseline_ref" > "$baseline_dir/${session_key}.ref"

# Save current untracked files (stash create doesn't capture them)
git ls-files --others --exclude-standard 2>/dev/null | sort > "$baseline_dir/${session_key}.untracked"

dbg "baseline saved to $baseline_dir/${session_key}.ref"
exit 0
