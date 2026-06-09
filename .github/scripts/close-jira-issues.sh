#!/usr/bin/env bash
# Close Jira issues referenced in a changelog (or any markdown file).
#
# Requires JIRA_USER and JIRA_TOKEN environment variables.
# Optional:
#   CHANGELOG_PATH - changelog file path (default: /tmp/changelog.md)
#   JIRA_BASE_URL  - browse URL for issue links (default: https://issues.redhat.com)
#   JIRA_API_URL   - REST API base URL (default: https://redhat.atlassian.net/rest/api/2)
# issues.redhat.com is the browse alias for the redhat.atlassian.net Jira instance.
#
# Usage: ./close-jira-issues.sh [path/to/changelog.md]

set -euo pipefail

CHANGELOG="${1:-${CHANGELOG_PATH:-/tmp/changelog.md}}"
SKIPPED=() #issues that were already closed
CLOSED=()
FAILED=()
USER="${JIRA_USER:-}"
TOKEN="${JIRA_TOKEN:-}"
JIRA_BASE_URL="${JIRA_BASE_URL:-https://issues.redhat.com}"
JIRA_BASE_URL="${JIRA_BASE_URL%/}"
JIRA_BASE_URL_PATTERN="${JIRA_BASE_URL//./\\.}"
JIRA_API_URL="${JIRA_API_URL:-https://redhat.atlassian.net/rest/api/2}"
JIRA_API_URL="${JIRA_API_URL%/}"

if [[ -z "$USER" || -z "$TOKEN" ]]; then
  echo "JIRA_USER and JIRA_TOKEN must be set" >&2
  exit 1
fi

build_close_transition_payload() {
  local issue_key="$1"
  local transitions_response payload
  if ! transitions_response="$(
    curl -sS --fail-with-body -u "${USER}:${TOKEN}" \
      -H 'Accept: application/json' \
      "${JIRA_API_URL}/issue/${issue_key}/transitions?expand=transitions.fields"
  )"; then
    echo "Failed to fetch transitions for ${issue_key}: ${transitions_response:-curl request failed}" >&2
    return 1
  fi

  payload="$(jq -c '
    [.transitions[] | select(.to.name == "Closed")] | first | if . == null then empty else
      { transition: { id: .id } }
      + if .fields.resolution then {
          fields: {
            resolution: {
              name: (
                [.fields.resolution.allowedValues[]?.name] as $names
                | if ($names | index("Closed")) then "Closed"
                  elif ($names | index("Done")) then "Done"
                  elif ($names | length) > 0 then $names[0]
                  else "Closed"
                  end
              )
            }
          }
        } else {} end
    end
  ' <<<"$transitions_response")"

  if [[ -z "$payload" ]]; then
    echo "No Close transition available for ${issue_key}" >&2
    return 1
  fi

  echo "$payload"
}

if [[ ! -f "$CHANGELOG" ]]; then
  echo "File not found: $CHANGELOG" >&2
  exit 1
fi

mapfile -t JIRA_ISSUES < <(
  grep -oE "${JIRA_BASE_URL_PATTERN}/browse/[A-Z]+-[0-9]+" "$CHANGELOG" \
    | sed 's|.*/||' \
    | sort -u
)

if [[ ${#JIRA_ISSUES[@]} -eq 0 ]]; then
  echo "No Jira issues found in $CHANGELOG" >&2
  exit 0
fi

for issue_key in "${JIRA_ISSUES[@]}"; do
  issue_response=""
  if ! issue_response="$(
    curl -sS --fail-with-body -u "${USER}:${TOKEN}" \
      -H 'Accept: application/json' \
      "${JIRA_API_URL}/issue/${issue_key}"
  )"; then
    echo "Failed to fetch status for ${issue_key}: ${issue_response:-curl request failed}" >&2
    FAILED+=("$issue_key")
    continue
  fi

  status="$(jq -r '.fields.status.name // empty' <<<"$issue_response")"

  if [[ "$status" == *"Closed"* ]]; then
    SKIPPED+=("$issue_key")
    continue
  fi

  transition_payload=""
  if ! transition_payload="$(build_close_transition_payload "$issue_key")"; then
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
    echo "Failed to close ${issue_key} (HTTP ${http_code}): ${response_body:-empty response}" >&2
    FAILED+=("$issue_key")
  fi
done

echo "Skipped issues: ${SKIPPED[*]:-none}"
echo "Closed issues: ${CLOSED[*]:-none}"
echo "Failed issues: ${FAILED[*]:-none}"

if [[ ${#FAILED[@]} -gt 0 ]]; then
  exit 1
fi
