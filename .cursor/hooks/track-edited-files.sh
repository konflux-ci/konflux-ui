#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/lib.sh"

input=$(cat)

# Extract file path — Cursor: .file_path, Claude Code: .tool_input.file_path
file_path=$(echo "$input" | jq -r '
  .file_path // .tool_input.file_path // .tool_input.path // empty
' 2>/dev/null || true)

[[ -z "$file_path" ]] && exit 0
[[ "$file_path" =~ \.(ts|tsx)$ ]] || exit 0

# Session identifier — Cursor: conversation_id, Claude Code: session_id
session_id=$(echo "$input" | jq -r '.conversation_id // .session_id // empty' 2>/dev/null || true)
[[ -z "$session_id" ]] && exit 0

PROJECT_HASH=$(echo "$PWD" | portable_hash)
SESSION_HASH=$(echo "$session_id" | portable_hash)
TMP_DIR=$(hook_tmp_dir)
TRACKED_FILE="${TMP_DIR}/edited-files-${PROJECT_HASH}-${SESSION_HASH}"

# Normalize absolute path to relative for consistency with git-based paths
if [[ "$file_path" == "$PWD"/* ]]; then
  file_path="${file_path#"$PWD"/}"
fi

echo "$file_path" >> "$TRACKED_FILE"
exit 0
