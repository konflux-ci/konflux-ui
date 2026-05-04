#!/usr/bin/env bash
set -euo pipefail

input=$(cat)

file_path=""
command_str=""

# Cursor: tool_input.file_path  |  Claude Code: tool_input.file_path
file_path=$(echo "$input" | jq -r '
  .tool_input.file_path // .tool_input.path // empty
' 2>/dev/null || true)

# Extract command (for beforeShellExecution / Bash tool)
command_str=$(echo "$input" | jq -r '
  .command // .tool_input.command // empty
' 2>/dev/null || true)

protected_pattern='\.cursor/hooks|\.claude/settings(\.local)?\.json'

target="${file_path}${command_str}"

# Parse failure: if both extractions returned empty, the payload is
# malformed or the schema changed. Deny rather than silently allowing.
if [[ -z "$target" ]]; then
  if [[ -n "${CURSOR_VERSION:-}" ]]; then
    jq -n '{
      permission: "deny",
      user_message: "Hook guard: could not parse hook payload. Blocking as a safety measure.",
      agent_message: "BLOCKED: The guard hook could not parse the input payload. This is a safety measure to prevent bypassing file protections. If the hook schema has changed, update .cursor/hooks/guard-hooks.sh to match."
    }'
  else
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "Guard hook could not parse the input payload. Blocking as a safety measure."
      }
    }'
  fi
  exit 0
fi

if ! echo "$target" | grep -qE "$protected_pattern"; then
  # Not a protected path -- allow
  if [[ -n "${CURSOR_VERSION:-}" ]]; then
    echo '{"permission": "allow"}'
  else
    echo '{}'
  fi
  exit 0
fi

# Protected path detected -- block with explanation
hook_event=$(echo "$input" | jq -r '.hook_event_name // empty' 2>/dev/null || true)

if [[ -n "${CURSOR_VERSION:-}" ]]; then
  # Cursor: preToolUse doesn't support "ask", so we must "deny".
  # beforeShellExecution DOES support "ask" and shows a dialog.
  if [[ "$hook_event" == "beforeShellExecution" ]]; then
    jq -n '{
      permission: "ask",
      user_message: "The agent wants to run a command that targets hook/settings files. Approve only if you requested this change."
    }'
  else
    jq -n '{
      permission: "deny",
      user_message: "Hook/settings files are protected. Edit them manually or temporarily disable the guard in .cursor/hooks.json.",
      agent_message: "BLOCKED: You cannot modify hook or settings files (.cursor/hooks.json, .cursor/hooks/*, .claude/settings.json). These are protected from agent modification. If the user asked you to modify hooks, tell them to edit the files manually or to temporarily disable the guard from .cursor/hooks.json."
    }'
  fi
else
  # Claude Code: uses hookSpecificOutput format
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Hook/settings files are protected from agent modification. Ask the user to edit them manually."
    }
  }'
fi
exit 0
