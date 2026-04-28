#!/usr/bin/env bash
set -euo pipefail

# generate-release-changelog.sh
#
# Generates a categorized changelog of merged PRs between two SHAs.
# PRs are categorized into Features, Bug Fixes, and Other Changes
# based on conventional commit prefixes in the PR title.
#
# Usage:
#   generate-release-changelog.sh -r <owner/repo> -b <base_sha> -t <target_sha> [-d <repo_dir>] -o <out_file>
#
# Arguments:
#   -r  Repository in owner/repo format (e.g., konflux-ci/konflux-ui)
#   -b  Base SHA (older commit)
#   -t  Target SHA (newer commit)
#   -d  Optional: existing git repository directory
#   -o  Output file path for changelog

# --- Helper Functions ---
log_info() { echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_error() { echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; }
log_warn() { echo "[WARN] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; }

usage() {
  cat >&2 << 'USAGE'
Usage: generate-release-changelog.sh -r <owner/repo> -b <base_sha> -t <target_sha> [-d <repo_dir>] -o <out_file>

Arguments:
  -r  Repository in owner/repo format (e.g., konflux-ci/konflux-ui)
  -b  Base SHA (older commit, production)
  -t  Target SHA (newer commit, staging)
  -d  Optional: existing git repository directory (skips clone)
  -o  Output file path for changelog
USAGE
}

validate_sha() {
  local sha="$1" name="$2"
  if [[ ! "$sha" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
    log_error "Invalid SHA format for $name: '$sha'"
    return 1
  fi
}

validate_repo() {
  local repo="$1"
  if [[ ! "$repo" =~ ^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$ ]]; then
    log_error "Invalid repository format: '$repo'. Expected: owner/repo"
    return 1
  fi
}

# --- Parse Arguments ---
REPO=""
BASE_SHA=""
TARGET_SHA=""
REPO_DIR=""
OUT_FILE=""

while getopts ":r:b:t:d:o:h" opt; do
  case "$opt" in
    r) REPO="$OPTARG" ;;
    b) BASE_SHA="$OPTARG" ;;
    t) TARGET_SHA="$OPTARG" ;;
    d) REPO_DIR="$OPTARG" ;;
    o) OUT_FILE="$OPTARG" ;;
    h) usage; exit 0 ;;
    :) log_error "Option -$OPTARG requires an argument"; usage; exit 2 ;;
    *) log_error "Unknown option: -$OPTARG"; usage; exit 2 ;;
  esac
done

# --- Validate Inputs ---
if [[ -z "$REPO" || -z "$BASE_SHA" || -z "$TARGET_SHA" || -z "$OUT_FILE" ]]; then
  log_error "Missing required arguments"
  usage
  exit 2
fi

validate_repo "$REPO" || exit 2
validate_sha "$BASE_SHA" "base_sha" || exit 2
validate_sha "$TARGET_SHA" "target_sha" || exit 2

if [[ "$OUT_FILE" == *".."* ]]; then
  log_error "Invalid output path: directory traversal not allowed"
  exit 2
fi

JIRA_BASE_URL="${JIRA_BASE_URL:-https://issues.redhat.com}"

# --- Check Dependencies ---
for cmd in git gh jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log_error "Missing required dependency: $cmd"
    exit 1
  fi
done

# --- Prepare Working Directory ---
WORK_DIR=""
CLEANUP_CLONE=false

if [[ -n "$REPO_DIR" ]]; then
  if [[ ! -d "$REPO_DIR/.git" ]]; then
    log_error "Provided directory is not a git repository: $REPO_DIR"
    exit 1
  fi
  WORK_DIR="$REPO_DIR"
  log_info "Using existing repository: $WORK_DIR"
else
  WORK_DIR="$(mktemp -d)"
  CLEANUP_CLONE=true
  trap '[[ "$CLEANUP_CLONE" == true ]] && rm -rf "$WORK_DIR" 2>/dev/null || true' EXIT

  log_info "Cloning $REPO to $WORK_DIR"
  if ! git clone --depth=100 "https://github.com/${REPO}.git" "$WORK_DIR" 2>/dev/null; then
    log_error "Failed to clone repository: $REPO"
    exit 1
  fi
fi

OUT_DIR="$(dirname "$OUT_FILE")"
if [[ -n "$OUT_DIR" && "$OUT_DIR" != "." ]]; then
  mkdir -p "$OUT_DIR"
fi

# --- Fetch git history ---
pushd "$WORK_DIR" >/dev/null

log_info "Fetching commits..."
git fetch --all --tags --prune >/dev/null 2>&1 || true
git fetch origin "$BASE_SHA" "$TARGET_SHA" >/dev/null 2>&1 || true

for sha in "$BASE_SHA" "$TARGET_SHA"; do
  if ! git cat-file -t "$sha" >/dev/null 2>&1; then
    git fetch --unshallow 2>/dev/null || git fetch --depth=1000 2>/dev/null || true
  fi
  if ! git cat-file -t "$sha" >/dev/null 2>&1; then
    log_error "Commit not found after fetch: $sha"
    exit 1
  fi
done

# --- Extract PR numbers from git log ---
log_info "Extracting PRs from $BASE_SHA to $TARGET_SHA"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"; [[ "$CLEANUP_CLONE" == true ]] && rm -rf "$WORK_DIR" 2>/dev/null || true' EXIT

touch "$TMPDIR/features.md" "$TMPDIR/bugs.md" "$TMPDIR/other.md"
declare -A SEEN_PRS=()

while IFS= read -r subject; do
  pr_num=""
  if [[ "$subject" =~ \(#([0-9]+)\)$ ]]; then
    pr_num="${BASH_REMATCH[1]}"
  elif [[ "$subject" =~ Merge\ pull\ request\ #([0-9]+) ]]; then
    pr_num="${BASH_REMATCH[1]}"
  fi

  [[ -z "$pr_num" ]] && continue
  [[ -n "${SEEN_PRS[$pr_num]:-}" ]] && continue
  SEEN_PRS[$pr_num]=1

  # Fetch PR title via GitHub API
  pr_title=""
  if pr_title=$(gh api "repos/${REPO}/pulls/${pr_num}" --jq '.title' 2>/dev/null); then
    [[ -z "$pr_title" ]] && continue
  else
    pr_title="$subject"
  fi

  # Parse conventional commit type and scope from PR title
  cc_regex='^(feat|fix|chore|docs|test|ci|refactor|perf|style|build|revert)(\(([^)]*)\))?(!)?: (.+)$'
  if [[ "$pr_title" =~ $cc_regex ]]; then
    cc_type="${BASH_REMATCH[1]}"
    cc_scope="${BASH_REMATCH[3]:-}"
    description="${BASH_REMATCH[5]}"
  else
    cc_type=""
    cc_scope=""
    description="$pr_title"
  fi

  # Build scope reference: Jira ticket → markdown link, GitHub issue → repo#NNN
  scope_ref=""
  if [[ -n "$cc_scope" ]]; then
    if [[ "$cc_scope" =~ ^[A-Z][A-Z0-9]+-[0-9]+$ ]]; then
      scope_ref="[${cc_scope}](${JIRA_BASE_URL}/browse/${cc_scope})"
    elif [[ "$cc_scope" =~ ^#([0-9]+)$ ]]; then
      scope_ref="${REPO}#${BASH_REMATCH[1]}"
    fi
  fi

  if [[ -n "$scope_ref" ]]; then
    entry="- ${description} ${scope_ref} (${REPO}#${pr_num})"
  else
    entry="- ${description} (${REPO}#${pr_num})"
  fi

  case "$cc_type" in
    feat)     echo "$entry" >> "$TMPDIR/features.md" ;;
    fix)      echo "$entry" >> "$TMPDIR/bugs.md" ;;
    *)        echo "$entry" >> "$TMPDIR/other.md" ;;
  esac
done < <(git log --first-parent --format='%s' "${BASE_SHA}..${TARGET_SHA}" 2>/dev/null)

popd >/dev/null

# --- Render markdown ---
CHANGELOG_FILE="$(mktemp)"

{
  echo "**Full diff:** [\`${BASE_SHA:0:7}..${TARGET_SHA:0:7}\`](https://github.com/${REPO}/compare/${BASE_SHA}...${TARGET_SHA})"

  if [[ -s "$TMPDIR/features.md" ]]; then
    echo ""
    echo "### Features"
    echo ""
    cat "$TMPDIR/features.md"
  fi

  if [[ -s "$TMPDIR/bugs.md" ]]; then
    echo ""
    echo "### Bug Fixes"
    echo ""
    cat "$TMPDIR/bugs.md"
  fi

  if [[ -s "$TMPDIR/other.md" ]]; then
    echo ""
    echo "### Other Changes"
    echo ""
    cat "$TMPDIR/other.md"
  fi

  # If no PRs were found at all
  if [[ ! -s "$TMPDIR/features.md" && ! -s "$TMPDIR/bugs.md" && ! -s "$TMPDIR/other.md" ]]; then
    echo ""
    echo "_No PRs found in this range._"
  fi
} > "$CHANGELOG_FILE"

# --- Write Output ---
if [[ -s "$CHANGELOG_FILE" ]]; then
  cp "$CHANGELOG_FILE" "$OUT_FILE"
  rm -f "$CHANGELOG_FILE"
  log_info "Changelog written to: $OUT_FILE"
else
  log_error "Failed to generate changelog"
  rm -f "$CHANGELOG_FILE"
  exit 1
fi
