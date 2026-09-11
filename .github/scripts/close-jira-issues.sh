#!/usr/bin/env bash
# Close Jira issues referenced in a changelog (or any markdown file).
#
# Requires JIRA_USER and JIRA_TOKEN environment variables.
# JIRA_API_URL (optional) - REST API base URL (default: https://redhat.atlassian.net/rest/api/3)
# issues.redhat.com is the browse alias for the redhat.atlassian.net Jira instance.
#
# Usage: ./close-jira-issues.sh [path/to/changelog.md]

set -euo pipefail

JIRA_ISSUES_FILE="${1:-/tmp/jira_issues.md}"
mapfile -t JIRA_ISSUES < "$JIRA_ISSUES_FILE"
SKIPPED=() # issues that were already closed
CLOSED=()
FAILED=()
USER="${JIRA_USER:-}"
TOKEN="${JIRA_TOKEN:-}"

JIRA_API_URL="${JIRA_API_URL:-https://redhat.atlassian.net/rest/api/3}"
JIRA_API_URL="${JIRA_API_URL%/}"

if [[ -z "$USER" || -z "$TOKEN" ]]; then
  echo "JIRA_USER and JIRA_TOKEN must be set" >&2
  exit 1
fi

sanitize_api_response() {
  local value="${1:-}"
  echo "${value//::/}"
}

build_close_transition_payload() {
  local issue_key="$1"
  local target_status="$2"
  local transitions_response payload available_transitions safe_response

  if [[ -z "$target_status" ]]; then
    echo "Target status is required for ${issue_key}" >&2
    return 1
  fi

  if ! transitions_response="$(
    curl -sS --fail-with-body -u "${USER}:${TOKEN}" \
      -H 'Accept: application/json' \
      "${JIRA_API_URL}/issue/${issue_key}/transitions?expand=transitions.fields"
  )"; then
    safe_response="$(sanitize_api_response "$transitions_response")"
    echo "Failed to fetch transitions for ${issue_key}: ${safe_response:-curl request failed}" >&2
    return 1
  fi

  payload="$(jq -c --arg target "$target_status" '
    [.transitions[] | select(.to.name == $target)] | first | if . == null then empty else
      { transition: { id: .id } }
      + if .fields.resolution then {
          fields: {
            resolution: {
              name: (
                [.fields.resolution.allowedValues[]?.name] as $names
                | if ($names | index($target)) then $target
                  elif ($names | index("Done")) then "Done"
                  elif ($names | index("Closed")) then "Closed"
                  elif ($names | length) > 0 then $names[0]
                  else $target
                  end
              )
            }
          }
        } else {} end
    end
  ' <<<"$transitions_response")"

  if [[ -z "$payload" ]]; then
    echo "No transition to \"${target_status}\" available for ${issue_key}" >&2
    return 1
  fi

  echo "$payload"
}

if [[ ! -f "$JIRA_ISSUES_FILE" ]]; then
  echo "File not found: $JIRA_ISSUES_FILE" >&2
  exit 1
fi


if [[ ${#JIRA_ISSUES[@]} -eq 0 ]]; then
  echo "No Jira issues found in $JIRA_ISSUES_FILE" >&2
  exit 0
fi

for issue_key in "${JIRA_ISSUES[@]}"; do
  issue_response=""
  if ! issue_response="$(
    curl -sS --fail-with-body -u "${USER}:${TOKEN}" \
      -H 'Accept: application/json' \
      "${JIRA_API_URL}/issue/${issue_key}"
  )"; then
    safe_response="$(sanitize_api_response "$issue_response")"
    echo "Failed to fetch status for ${issue_key}: ${safe_response:-curl request failed}" >&2
    FAILED+=("$issue_key")
    continue
  fi

  status="$(jq -r '.fields.status.name // empty' <<<"$issue_response")"

  transition_payload=""
  target_status=""

  if [[ "$status" == *"Release Pending"* ]]; then
    target_status="Closed"
  else
    echo "Skipping ${issue_key} (status: ${status})" >&2
    SKIPPED+=("$issue_key")
    continue
  fi

  if ! transition_payload="$(build_close_transition_payload "$issue_key" "$target_status")"; then
    FAILED+=("$issue_key")
    continue
  fi

  if ! transition_response="$(
    curl -sS -w $'\n%{http_code}' -u "${USER}:${TOKEN}" \
      -H 'Accept: application/json' \
      -H 'Content-Type: application/json' \
      -X POST \
      "${JIRA_API_URL}/issue/${issue_key}/transitions" \
      -d "$transition_payload"
  )"; then
    echo "Failed to close ${issue_key}: curl request failed" >&2
    FAILED+=("$issue_key")
    continue
  fi

  http_code="${transition_response##*$'\n'}"
  response_body="${transition_response%$'\n'*}"

  if [[ "$http_code" =~ ^2[0-9]{2}$ ]]; then
    CLOSED+=("$issue_key")
  else
    safe_response="$(sanitize_api_response "$response_body")"
    echo "Failed to close ${issue_key} (HTTP ${http_code}): ${safe_response:-empty response}" >&2
    FAILED+=("$issue_key")
  fi
done

echo "Skipped issues: ${SKIPPED[*]:-none}"
echo "Closed issues: ${CLOSED[*]:-none}"
echo "Failed issues: ${FAILED[*]:-none}"

if [[ ${#FAILED[@]} -gt 0 ]]; then
  exit 1
fi
