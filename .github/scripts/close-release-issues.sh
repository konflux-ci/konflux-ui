#!/usr/bin/env bash
set -euo pipefail

# close-release-issues.sh
#
# Closes Jira issues found in a changelog or ID list file.
# Only issues in "Release Pending" status are auto-closed.
# Other statuses are reported for manual review.
#
# Usage:
#   ./close-release-issues.sh [OPTIONS]
#
# Options:
#   --changelog FILE    Path to file containing Jira IDs (default: changelog.md)
#   --dry-run           Preview changes without closing issues
#   --version VERSION   Release version to include in Jira comments
#   --jira-url URL      Jira server URL (default: from JIRA_URL env or https://issues.redhat.com)
#   --rate-limit N      Delay in seconds between API calls (default: 1)
#   --help              Show this help message
#
# Environment Variables:
#   JIRA_URL            Jira server URL
#   JIRA_API_TOKEN      Jira API token (required, Bearer auth)

# --- Configuration ---
CHANGELOG_FILE="changelog.md"
DRY_RUN=false
VERSION=""
JIRA_URL="${JIRA_URL:-https://issues.redhat.com}"
JIRA_API_TOKEN="${JIRA_API_TOKEN:-}"
RATE_LIMIT_SECONDS="${RATE_LIMIT_SECONDS:-1}"

# Statistics
SUCCESS_COUNT=0
ALREADY_CLOSED_COUNT=0
NOT_RELEASE_PENDING_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0

declare -a NON_RELEASE_PENDING_ISSUES=()

# --- Helper Functions ---
log_info()  { echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') $*"; }
log_error() { echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; }
log_warn()  { echo "[WARN] $(date '+%Y-%m-%d %H:%M:%S') $*" >&2; }

print_help() {
  sed -n '/^# Usage:/,/^# Environment/p' "$0" | sed 's/^# //' | sed 's/^#//'
  exit 0
}

validate_issue_key() {
  local key="$1"
  [[ "$key" =~ ^[A-Z][A-Z0-9]+-[0-9]+$ ]] && [[ ${#key} -le 50 ]]
}

validate_url() {
  local url="$1"
  [[ "$url" =~ ^https?://[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9](:[0-9]+)?(/.*)?$ ]]
}

rate_limit() {
  [[ "$RATE_LIMIT_SECONDS" -gt 0 ]] && sleep "$RATE_LIMIT_SECONDS"
}

# --- Argument Parsing ---
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --changelog)
        [[ -z "${2:-}" ]] && { log_error "--changelog requires a file path"; exit 1; }
        CHANGELOG_FILE="$2"; shift 2 ;;
      --dry-run)
        DRY_RUN=true; shift ;;
      --version)
        [[ -z "${2:-}" ]] && { log_error "--version requires a version string"; exit 1; }
        VERSION="$2"; shift 2 ;;
      --jira-url)
        [[ -z "${2:-}" ]] && { log_error "--jira-url requires a URL"; exit 1; }
        JIRA_URL="$2"; shift 2 ;;
      --rate-limit)
        [[ -z "${2:-}" ]] && { log_error "--rate-limit requires a number"; exit 1; }
        RATE_LIMIT_SECONDS="$2"; shift 2 ;;
      --help|-h)
        print_help ;;
      *)
        log_error "Unknown option: $1"; exit 1 ;;
    esac
  done
}

validate_inputs() {
  if [[ "$CHANGELOG_FILE" == *".."* ]]; then
    log_error "Invalid file path: directory traversal not allowed"; exit 1
  fi
  if [[ -n "$VERSION" ]] && [[ ! "$VERSION" =~ ^[a-zA-Z0-9._-]+$ ]]; then
    log_error "Invalid version format: $VERSION"; exit 1
  fi
  validate_url "$JIRA_URL" || { log_error "Invalid Jira URL: $JIRA_URL"; exit 1; }
  if [[ -z "$JIRA_API_TOKEN" ]]; then
    log_error "JIRA_API_TOKEN environment variable is required"; exit 1
  fi
}

# --- Jira Issue Extraction ---
extract_jira_issues() {
  if [[ ! -f "$CHANGELOG_FILE" ]]; then
    log_error "File not found: $CHANGELOG_FILE"; exit 1
  fi

  local raw_issues validated_issues=""
  raw_issues=$(grep -oE '\b[A-Z][A-Z0-9]*-[0-9]+\b' "$CHANGELOG_FILE" 2>/dev/null | sort -u || true)

  while IFS= read -r key; do
    if [[ -n "$key" ]] && validate_issue_key "$key"; then
      validated_issues+="$key"$'\n'
    fi
  done <<< "$raw_issues"

  echo -n "$validated_issues" | sed '/^$/d'
}

# --- Jira API Functions ---
get_issue() {
  local issue_key="$1"
  validate_issue_key "$issue_key" || return 1

  local response http_code body
  response=$(curl -s -w "\n%{http_code}" --max-time 30 \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${JIRA_API_TOKEN}" \
    "${JIRA_URL}/rest/api/2/issue/${issue_key}")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" == "404" ]]; then
    echo "  Issue $issue_key not found"; return 1
  elif [[ "$http_code" != "200" ]]; then
    echo "  Error fetching $issue_key: HTTP $http_code"; return 1
  fi

  echo "$body"
}

get_transitions() {
  local issue_key="$1"
  curl -s --max-time 30 \
    -H "Accept: application/json" \
    -H "Authorization: Bearer ${JIRA_API_TOKEN}" \
    "${JIRA_URL}/rest/api/2/issue/${issue_key}/transitions"
}

transition_issue() {
  local issue_key="$1"
  local transitions transition_id="" transition_name=""

  transitions=$(get_transitions "$issue_key")
  [[ -z "$transitions" ]] && { echo "  No transitions available for $issue_key"; return 1; }

  for name in "Done" "Close" "Closed" "Resolve" "Resolved"; do
    local name_lower
    name_lower=$(echo "$name" | tr '[:upper:]' '[:lower:]')
    transition_id=$(echo "$transitions" | jq -r \
      ".transitions[] | select(.name | ascii_downcase == \"$name_lower\") | .id" 2>/dev/null | head -n1)
    if [[ -n "$transition_id" && "$transition_id" != "null" ]]; then
      transition_name="$name"; break
    fi
  done

  if [[ -z "$transition_id" || "$transition_id" == "null" ]]; then
    local available
    available=$(echo "$transitions" | jq -r '.transitions[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//' || echo "none")
    echo "  No suitable transition found for $issue_key (available: $available)"
    return 1
  fi

  local payload http_code
  payload=$(jq -n --arg id "$transition_id" '{"transition": {"id": $id}}')

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST --max-time 30 \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${JIRA_API_TOKEN}" \
    -d "$payload" \
    "${JIRA_URL}/rest/api/2/issue/${issue_key}/transitions")

  http_code=$(echo "$response" | tail -n1)

  if [[ "$http_code" == "204" || "$http_code" == "200" ]]; then
    echo "  Transitioned $issue_key to '$transition_name'"; return 0
  else
    echo "  Error transitioning $issue_key: HTTP $http_code"; return 1
  fi
}

add_comment() {
  local issue_key="$1" comment="$2"
  local payload http_code

  payload=$(jq -n --arg body "$comment" '{"body": $body}')

  local response
  response=$(curl -s -w "\n%{http_code}" -X POST --max-time 30 \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${JIRA_API_TOKEN}" \
    -d "$payload" \
    "${JIRA_URL}/rest/api/2/issue/${issue_key}/comment")

  http_code=$(echo "$response" | tail -n1)

  if [[ "$http_code" == "201" || "$http_code" == "200" ]]; then
    echo "  Added comment to $issue_key"; return 0
  else
    echo "  Error adding comment to $issue_key: HTTP $http_code"; return 1
  fi
}

# --- Issue Processing ---
process_issue() {
  local issue_key="$1"
  echo ""
  echo "Processing $issue_key..."

  rate_limit

  local issue
  if ! issue=$(get_issue "$issue_key"); then
    ((FAILED_COUNT++)) || true; return 1
  fi

  local status assignee
  status=$(echo "$issue" | jq -r '.fields.status.name // "Unknown"' 2>/dev/null || echo "Unknown")
  assignee=$(echo "$issue" | jq -r '.fields.assignee.displayName // "Unassigned"' 2>/dev/null || echo "Unassigned")

  echo "  Status: $status | Assignee: $assignee"

  local status_lower
  status_lower=$(echo "$status" | tr '[:upper:]' '[:lower:]')

  if [[ "$status_lower" == "done" || "$status_lower" == "closed" || "$status_lower" == "resolved" ]]; then
    echo "  Already $status — skipping"
    ((ALREADY_CLOSED_COUNT++)) || true; return 0
  fi

  if [[ "$status_lower" != "release pending" ]]; then
    echo "  Not in 'Release Pending' status — skipping"
    NON_RELEASE_PENDING_ISSUES+=("${issue_key}|${status}|${assignee}")
    ((NOT_RELEASE_PENDING_COUNT++)) || true; return 0
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would transition to Done"
    [[ -n "$VERSION" ]] && echo "  [DRY RUN] Would add comment: Released in $VERSION"
    ((SKIPPED_COUNT++)) || true; return 0
  fi

  if [[ -n "$VERSION" ]]; then
    rate_limit
    add_comment "$issue_key" "This issue has been released in version $VERSION."
  fi

  rate_limit
  if transition_issue "$issue_key"; then
    ((SUCCESS_COUNT++)) || true
  else
    ((FAILED_COUNT++)) || true
  fi
}

# --- GitHub Actions Outputs ---
output_github_summary() {
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    {
      echo "issues_closed=$SUCCESS_COUNT"
      echo "issues_already_closed=$ALREADY_CLOSED_COUNT"
      echo "issues_skipped=$NOT_RELEASE_PENDING_COUNT"
      echo "issues_failed=$FAILED_COUNT"
    } >> "$GITHUB_OUTPUT"
  fi

  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    {
      echo "## Jira Issue Closer Summary"
      echo ""
      echo "| Metric | Count |"
      echo "|--------|-------|"
      echo "| Successfully closed | $SUCCESS_COUNT |"
      echo "| Already closed | $ALREADY_CLOSED_COUNT |"
      echo "| Not 'Release Pending' | $NOT_RELEASE_PENDING_COUNT |"
      echo "| Skipped (dry-run) | $SKIPPED_COUNT |"
      echo "| Failed | $FAILED_COUNT |"

      if [[ ${#NON_RELEASE_PENDING_ISSUES[@]} -gt 0 ]]; then
        echo ""
        echo "### Issues Not Auto-Closed (Not in 'Release Pending' status)"
        echo ""
        echo "| Issue | Status | Assignee |"
        echo "|-------|--------|----------|"
        for item in "${NON_RELEASE_PENDING_ISSUES[@]}"; do
          IFS='|' read -r key status assignee <<< "$item"
          echo "| $key | $status | $assignee |"
        done
      fi
    } >> "$GITHUB_STEP_SUMMARY"
  fi
}

# --- Main ---
main() {
  for cmd in jq curl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log_error "Missing required dependency: $cmd"; exit 1
    fi
  done

  parse_args "$@"
  validate_inputs

  log_info "Jira Issue Closer"
  [[ "$DRY_RUN" == "true" ]] && log_warn "DRY RUN MODE — no changes will be made"

  log_info "Reading: $CHANGELOG_FILE"
  local issues
  issues=$(extract_jira_issues)

  if [[ -z "$issues" ]]; then
    log_info "No Jira issues found"
    output_github_summary
    exit 0
  fi

  local issue_count
  issue_count=$(echo "$issues" | wc -l | tr -d ' ')
  log_info "Found $issue_count unique Jira issue(s)"

  while IFS= read -r issue_key; do
    [[ -n "$issue_key" ]] && process_issue "$issue_key" || true
  done <<< "$issues"

  # Report non-release-pending issues
  if [[ ${#NON_RELEASE_PENDING_ISSUES[@]} -gt 0 ]]; then
    echo ""
    log_info "Issues NOT in 'Release Pending' status (not auto-closed):"
    for item in "${NON_RELEASE_PENDING_ISSUES[@]}"; do
      IFS='|' read -r key status assignee <<< "$item"
      printf "  %-15s Status: %-20s Assignee: %s\n" "$key" "$status" "$assignee"
    done
  fi

  # Summary
  echo ""
  log_info "Summary:"
  printf "  Closed: %d | Already closed: %d | Not Release Pending: %d | Skipped: %d | Failed: %d\n" \
    "$SUCCESS_COUNT" "$ALREADY_CLOSED_COUNT" "$NOT_RELEASE_PENDING_COUNT" "$SKIPPED_COUNT" "$FAILED_COUNT"

  output_github_summary

  [[ $FAILED_COUNT -gt 0 ]] && exit 1
  exit 0
}

main "$@"
