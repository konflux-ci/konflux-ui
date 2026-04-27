#!/usr/bin/env bash
set -euo pipefail

# generate-release-changelog.sh
#
# Generates a categorized changelog from merged PRs between two SHAs.
# Output: structured markdown to stdout with a machine-readable JIRA_IDS footer.
#
# Usage:
#   ./generate-release-changelog.sh <old_sha> <new_sha> <release_date>
#
# Environment variables:
#   KONFLUX_UI_REPO  - GitHub repo (default: konflux-ci/konflux-ui)
#   JIRA_BASE_URL    - Jira instance URL (default: https://issues.redhat.com)
#   GH_TOKEN         - GitHub token for API access (uses gh auth if unset)

# --- Configuration ---
REPO="${KONFLUX_UI_REPO:-konflux-ci/konflux-ui}"
JIRA_URL="${JIRA_BASE_URL:-https://issues.redhat.com}"

# --- Argument parsing ---
if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <old_sha> <new_sha> <release_date>" >&2
  exit 2
fi

OLD_SHA="$1"
NEW_SHA="$2"
RELEASE_DATE="$3"

SHORT_OLD="${OLD_SHA:0:7}"
SHORT_NEW="${NEW_SHA:0:7}"
TAG="v${RELEASE_DATE}"

# --- Validate inputs ---
for sha_name in OLD_SHA NEW_SHA; do
  sha_val="${!sha_name}"
  if [[ ! "$sha_val" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
    echo "Error: Invalid SHA format for $sha_name: '$sha_val'" >&2
    exit 2
  fi
done

# --- Dependency checks ---
for cmd in git gh jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: Missing required dependency: $cmd" >&2
    exit 1
  fi
done

# --- Ensure git history is available ---
git fetch --all --tags --prune >/dev/null 2>&1 || true
git fetch origin "$OLD_SHA" "$NEW_SHA" >/dev/null 2>&1 || true

for sha in "$OLD_SHA" "$NEW_SHA"; do
  if ! git cat-file -t "$sha" >/dev/null 2>&1; then
    git fetch --unshallow 2>/dev/null || git fetch --depth=1000 2>/dev/null || true
  fi
done

for sha_name in OLD_SHA NEW_SHA; do
  sha_val="${!sha_name}"
  if ! git cat-file -t "$sha_val" >/dev/null 2>&1; then
    echo "Error: Cannot find $sha_name ($sha_val) in git history" >&2
    exit 1
  fi
done

# --- Temp directory for category files ---
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

for category in feat fix perf breaking revert docs test ci internal uncategorized; do
  touch "$TMPDIR/${category}.md"
done
touch "$TMPDIR/jira-ids.txt"

# --- Extract PR numbers from git log ---
# Handles both squash merges "message (#123)" and merge commits "Merge pull request #123"
pr_count=0

while IFS= read -r subject; do
  pr_num=""
  if [[ "$subject" =~ \(#([0-9]+)\)$ ]]; then
    pr_num="${BASH_REMATCH[1]}"
  elif [[ "$subject" =~ Merge\ pull\ request\ #([0-9]+) ]]; then
    pr_num="${BASH_REMATCH[1]}"
  fi

  [[ -z "$pr_num" ]] && continue
  pr_count=$((pr_count + 1))

  # Fetch PR details via GitHub API
  pr_title="" pr_author="" pr_body=""
  if pr_json=$(gh api "repos/${REPO}/pulls/${pr_num}" \
    --jq '{title: .title, author: .user.login, body: .body}' 2>/dev/null); then
    pr_title=$(echo "$pr_json" | jq -r '.title // ""')
    pr_author=$(echo "$pr_json" | jq -r '.author // "unknown"')
    pr_body=$(echo "$pr_json" | jq -r '.body // ""')
  else
    pr_title="$subject"
    pr_author="unknown"
    pr_body=""
  fi

  [[ -z "$pr_title" ]] && continue

  # Parse conventional commit format: type(scope)!: description
  # Regex stored in variable to avoid bash parsing issues with parentheses
  cc_regex='^(feat|fix|chore|docs|test|ci|refactor|perf|style|build|revert)(\(([^)]*)\))?(!)?: (.+)$'
  cc_type="" cc_scope="" cc_breaking="" cc_desc="$pr_title"
  if [[ "$pr_title" =~ $cc_regex ]]; then
    cc_type="${BASH_REMATCH[1]}"
    cc_scope="${BASH_REMATCH[3]:-}"
    cc_breaking="${BASH_REMATCH[4]:-}"
    cc_desc="${BASH_REMATCH[5]}"
  fi

  # Extract Jira IDs from scope and title
  jira_ids_found=$(echo "${cc_scope} ${pr_title}" | grep -oE '\b[A-Z][A-Z0-9]+-[0-9]+\b' | sort -u || true)
  if [[ -n "$jira_ids_found" ]]; then
    echo "$jira_ids_found" >> "$TMPDIR/jira-ids.txt"
  fi

  # Build scope display with linked Jira IDs and GitHub issue refs
  scope_display=""
  if [[ -n "$cc_scope" ]]; then
    linked_scope="$cc_scope"
    while IFS= read -r jid; do
      [[ -n "$jid" ]] && linked_scope="${linked_scope//${jid}/[${jid}](${JIRA_URL}/browse/${jid})}"
    done <<< "$jira_ids_found"
    # Link GitHub issue refs (#NNN) — avoid replacing the PR ref itself
    if [[ "$linked_scope" =~ ^#([0-9]+)$ ]]; then
      issue_num="${BASH_REMATCH[1]}"
      linked_scope="[#${issue_num}](https://github.com/${REPO}/issues/${issue_num})"
    fi
    scope_display=" (${linked_scope})"
  fi

  # Format entry
  entry="- ${cc_desc}${scope_display} — [#${pr_num}](https://github.com/${REPO}/pull/${pr_num}) by @${pr_author}"

  # Check for breaking changes
  is_breaking=false
  [[ -n "$cc_breaking" ]] && is_breaking=true
  if echo "$pr_body" | grep -qiE 'BREAKING[_ ]CHANGE' 2>/dev/null; then
    is_breaking=true
  fi

  [[ "$is_breaking" == true ]] && echo "$entry" >> "$TMPDIR/breaking.md"

  # Categorize by type
  case "$cc_type" in
    feat)                       echo "$entry" >> "$TMPDIR/feat.md" ;;
    fix)                        echo "$entry" >> "$TMPDIR/fix.md" ;;
    perf)                       echo "$entry" >> "$TMPDIR/perf.md" ;;
    revert)                     echo "$entry" >> "$TMPDIR/revert.md" ;;
    docs)                       echo "$entry" >> "$TMPDIR/docs.md" ;;
    test)                       echo "$entry" >> "$TMPDIR/test.md" ;;
    ci)                         echo "$entry" >> "$TMPDIR/ci.md" ;;
    chore|refactor|style|build) echo "$entry" >> "$TMPDIR/internal.md" ;;
    "")
      echo "$entry" >> "$TMPDIR/uncategorized.md"
      echo "::warning::PR #${pr_num} does not follow conventional commit format: ${pr_title}" >&2
      ;;
  esac
done < <(git log --first-parent --format='%s' "${OLD_SHA}..${NEW_SHA}" 2>/dev/null)

# --- Handle empty PR list ---
if [[ "$pr_count" -eq 0 ]]; then
  cat <<EOF
## [${TAG}](https://github.com/${REPO}/releases/tag/${TAG}) — ${RELEASE_DATE}

**Full diff:** [\`${SHORT_OLD}..${SHORT_NEW}\`](https://github.com/${REPO}/compare/${OLD_SHA}...${NEW_SHA})

_No categorizable PRs found in this range._

---
<!-- JIRA_IDS: [] -->
EOF
  exit 0
fi

# --- Render markdown ---

# Header
cat <<EOF
## [${TAG}](https://github.com/${REPO}/releases/tag/${TAG}) — ${RELEASE_DATE}

**Full diff:** [\`${SHORT_OLD}..${SHORT_NEW}\`](https://github.com/${REPO}/compare/${OLD_SHA}...${NEW_SHA})
EOF

# Print a section if its file is non-empty
print_section() {
  local header="$1" file="$2"
  if [[ -s "$file" ]]; then
    echo ""
    echo "### ${header}"
    echo ""
    cat "$file"
  fi
}

# User-visible sections
print_section "🚀 Features" "$TMPDIR/feat.md"
print_section "🐛 Bug Fixes" "$TMPDIR/fix.md"
print_section "⚡ Performance" "$TMPDIR/perf.md"
print_section "💥 Breaking Changes" "$TMPDIR/breaking.md"
print_section "🔄 Reverts" "$TMPDIR/revert.md"
print_section "❓ Uncategorized" "$TMPDIR/uncategorized.md"

# Collapsed section for docs/tests/ci/internal
has_other=false
for f in docs test ci internal; do
  [[ -s "$TMPDIR/$f.md" ]] && has_other=true && break
done

if [[ "$has_other" == true ]]; then
  echo ""
  echo "<details>"
  echo "<summary>📦 Other changes (docs, tests, CI, internal)</summary>"
  print_section "📝 Docs" "$TMPDIR/docs.md"
  print_section "🧪 Tests / E2E" "$TMPDIR/test.md"
  print_section "🔧 CI" "$TMPDIR/ci.md"
  print_section "🏗️ Internal" "$TMPDIR/internal.md"
  echo ""
  echo "</details>"
fi

# Machine-readable Jira IDs footer
JIRA_JSON="[]"
if [[ -s "$TMPDIR/jira-ids.txt" ]]; then
  JIRA_JSON=$(sort -u "$TMPDIR/jira-ids.txt" | jq -R . | jq -s .)
fi

echo ""
echo "---"
echo "<!-- JIRA_IDS: ${JIRA_JSON} -->"
