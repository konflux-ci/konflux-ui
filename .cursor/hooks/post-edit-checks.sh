#!/usr/bin/env bash
set -euo pipefail

# Post-edit stop hook: runs linters and tests on agent-only changes.
# Fires after every agent turn in both Cursor and Claude Code.

max_retries="${POST_EDIT_MAX_RETRIES:-3}"
if ! [[ "$max_retries" =~ ^[0-9]+$ ]]; then
  max_retries=3
fi

input=$(cat)
session_key=$(echo "$input" | jq -r '.conversation_id // .session_id // empty' 2>/dev/null || true)

is_cursor=false
if [[ -n "${CURSOR_VERSION:-}" ]]; then
  is_cursor=true
fi

# Counter file: tracks consecutive blocked turns per session; resets when checks pass.
counter_dir="${TMPDIR:-/tmp}/post-edit-hooks-$(id -u)"
mkdir -p "$counter_dir" && chmod 700 "$counter_dir"

if [[ -n "$session_key" ]]; then
  counter_file="$counter_dir/$session_key"
else
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")
  repo_hash=$(printf '%s' "$repo_root" | cksum | cut -d' ' -f1)
  counter_file="$counter_dir/$repo_hash"
fi

count=0
if [[ -f "$counter_file" ]]; then
  raw=$(cat "$counter_file")
  [[ "$raw" =~ ^[0-9]+$ ]] && count=$raw
fi

# Compute agent-only changes using the baseline saved at session start.
# Falls back to git diff HEAD if no baseline exists.
baseline_dir="${TMPDIR:-/tmp}/post-edit-baselines-$(id -u)"
baseline_ref=""
baseline_untracked=""

if [[ -n "$session_key" && -f "$baseline_dir/${session_key}.ref" ]]; then
  baseline_ref=$(cat "$baseline_dir/${session_key}.ref")
  if [[ -f "$baseline_dir/${session_key}.untracked" ]]; then
    baseline_untracked="$baseline_dir/${session_key}.untracked"
  fi
fi

if [[ -n "$baseline_ref" ]]; then
  tracked_changes=$(git diff --name-only --diff-filter=d "$baseline_ref" 2>/dev/null || true)
  current_untracked=$(git ls-files --others --exclude-standard 2>/dev/null | sort)
  if [[ -n "$baseline_untracked" ]]; then
    new_untracked=$(comm -23 <(echo "$current_untracked") "$baseline_untracked" 2>/dev/null || true)
  else
    new_untracked="$current_untracked"
  fi
  # || true: grep -v exits 1 when nothing matches (empty input)
  changed_files=$({ echo "$tracked_changes"; echo "$new_untracked"; } | grep -v '^$' | sort -u || true)
else
  changed_files=$({
    git diff --name-only --diff-filter=d HEAD 2>/dev/null || true
    git ls-files --others --exclude-standard 2>/dev/null || true
  } | sort -u)
fi

if [[ -z "$changed_files" ]]; then
  rm -f "$counter_file"
  exit 0
fi

errors=""

ts_changed=$(echo "$changed_files" | grep -E '\.(ts|tsx)$' || true)
if [[ -n "$ts_changed" ]]; then
  tsc_full=$(yarn tsc --noEmit 2>&1) || {
    tsc_out=""
    while IFS= read -r file; do
      file_errors=$(echo "$tsc_full" | grep -F "${file}(" || true)
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
  lint_out=$(echo "$eslint_files" | tr '\n' '\0' | xargs -0 yarn eslint --report-unused-disable-directives --max-warnings 0 2>&1) || errors="${errors}
=== ESLint Errors ===
${lint_out}"
fi

scss_files=$(echo "$changed_files" | grep -E '\.scss$' || true)
if [[ -n "$scss_files" ]]; then
  style_out=$(echo "$scss_files" | tr '\n' '\0' | xargs -0 yarn stylelint --config .stylelintrc.json 2>&1) || errors="${errors}
=== Stylelint Errors ===
${style_out}"
fi

# Only run test files the agent actually changed; skip source-only changes.
test_files=$(echo "$changed_files" | grep -E '\.(spec|test)\.(ts|tsx)$' || true)
if [[ -n "$test_files" ]]; then
  test_out=$(echo "$test_files" | tr '\n' '\0' | xargs -0 yarn jest --passWithNoTests 2>&1) || {
    # Ignore "Cannot find module" failures sourced from files the agent didn't touch —
    # those are pre-existing environment issues, not caused by this turn.
    agent_caused_failure=true
    if echo "$test_out" | grep -q "Cannot find module"; then
      module_error_sources=$(echo "$test_out" \
        | grep -oP "Cannot find module .+ from '\K[^']+" || true)
      if [[ -n "$module_error_sources" ]]; then
        agent_caused_failure=false
        while IFS= read -r src_file; do
          if echo "$changed_files" | grep -qF "$src_file"; then
            agent_caused_failure=true
            break
          fi
        done <<< "$module_error_sources"
      fi
    fi

    if [[ "$agent_caused_failure" == true ]]; then
      errors="${errors}
=== Test Failures ===
${test_out}"
    fi
  }
fi

# Suppression comment scan: only .ts/.tsx/.js/.jsx, only agent-introduced lines.
suppress=""
diff_base="${baseline_ref:-HEAD}"
diff_suppress=$(git diff -U0 "$diff_base" -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null \
  | grep -F '+' | grep -Fv '+++' \
  | grep -E 'eslint-disable|@ts-ignore|@ts-expect-error' || true)
[[ -n "$diff_suppress" ]] && suppress="$diff_suppress"

untracked_code=$(echo "$changed_files" | grep -E '\.(ts|tsx|js|jsx)$' || true)
if [[ -n "$untracked_code" ]]; then
  untracked_only=$(echo "$untracked_code" | while IFS= read -r f; do
    git ls-files --error-unmatch "$f" >/dev/null 2>&1 || echo "$f"
  done)
  if [[ -n "$untracked_only" ]]; then
    untracked_suppress=$(echo "$untracked_only" \
      | tr '\n' '\0' | xargs -0 grep -nH -E 'eslint-disable|@ts-ignore|@ts-expect-error' 2>/dev/null || true)
    [[ -n "$untracked_suppress" ]] && suppress="${suppress:+$suppress
}$untracked_suppress"
  fi
fi

[[ -n "$suppress" ]] && errors="${errors}
=== New Suppression Comments ===
Remove these and fix the underlying issues:
${suppress}"

if [[ -z "$errors" ]]; then
  rm -f "$counter_file"
  exit 0
fi

if (( count >= max_retries )); then
  printf 'Post-edit hook gave up after %s retries. Remaining issues:%s\n' \
    "$max_retries" "$errors" >&2
  exit 1
fi

count=$(( count + 1 ))
echo "$count" > "$counter_file"

if [[ "$is_cursor" == true ]]; then
  printf 'Post-edit checks found issues in changed files. Please fix:%s' "$errors" \
    | jq -Rs '{"followup_message": .}'
else
  printf 'Post-edit checks found issues in changed files. Please fix:%s' "$errors" \
    | jq -Rs '{"decision": "block", "reason": .}'
fi
