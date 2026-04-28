#!/usr/bin/env bash
set -euo pipefail

# generate-release-changelog.sh
#
# Generates a changelog between two SHAs in a git repository.
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

# --- Check Dependencies ---
for cmd in git sed awk; do
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

# --- Generate Changelog ---
pushd "$WORK_DIR" >/dev/null

log_info "Fetching commits..."
git fetch --all --tags --prune >/dev/null 2>&1 || true
git fetch origin "$BASE_SHA" "$TARGET_SHA" >/dev/null 2>&1 || true

for sha in "$BASE_SHA" "$TARGET_SHA"; do
  if ! git cat-file -t "$sha" >/dev/null 2>&1; then
    git fetch --unshallow 2>/dev/null || git fetch --depth=1000 2>/dev/null || true
  fi
done

log_info "Generating changelog from $BASE_SHA to $TARGET_SHA"

CHANGELOG_FILE="$(mktemp)"

{
  echo "# Changelog"
  echo ""
  echo "**Repository:** ${REPO}"
  echo "**Range:** \`$(echo "$BASE_SHA" | head -c 12)..$(echo "$TARGET_SHA" | head -c 12)\`"
  echo ""
  echo "## Commits"
  echo ""

  if git log --oneline "${BASE_SHA}..${TARGET_SHA}" >/dev/null 2>&1; then
    git log --no-merges --pretty=format:'- `%h` %s (%an, %ad)' --date=short "${BASE_SHA}..${TARGET_SHA}" 2>/dev/null || true

    echo ""
    echo ""
    echo "### Merged PRs"
    echo ""
    git log --merges --pretty=format:'- %s' "${BASE_SHA}..${TARGET_SHA}" 2>/dev/null | \
      grep -E 'Merge pull request|#[0-9]+' || echo "_No merge commits found_"
  else
    log_warn "Could not generate commit log, commits may not be available"
    echo "_Could not retrieve commit history. Please check the SHA range._"
  fi

  echo ""
  echo ""
  echo "## Compare"
  echo ""
  echo "[View full diff on GitHub](https://github.com/${REPO}/compare/${BASE_SHA}...${TARGET_SHA})"
  echo ""
  echo "---"
  echo ""
  echo "_Generated on $(date '+%Y-%m-%d %H:%M:%S UTC')_"
} > "$CHANGELOG_FILE"

popd >/dev/null

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
