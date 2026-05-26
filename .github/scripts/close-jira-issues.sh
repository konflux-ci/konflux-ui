#!/usr/bin/env bash
# Print all Jira issue URLs from a changelog (or any markdown file).
# Usage: ./print-jira-urls.sh [path/to/changelog.md]

set -euo pipefail

CHANGELOG="${1:-/tmp/changelog.md}"
SKIPPED=() #issues that were already closed
CLOSED=()
#TODO - get USER and TOKEN
TOKEN=""
USER=""

if [[ ! -f "$CHANGELOG" ]]; then
  echo "File not found: $CHANGELOG" >&2
  exit 1
fi

mapfile -t JIRA_ISSUES < <(
  grep -oE 'https://issues\.redhat\.com/browse/[A-Z]+-[0-9]+' "$CHANGELOG" \
    | sed 's|.*/||' \
    | sort -u
)

if [[ ${#JIRA_ISSUES[@]} -eq 0 ]]; then
  echo "No Jira issues found in $CHANGELOG" >&2
  exit 0
fi

for issue_key in "${JIRA_ISSUES[@]}"; do
  status="$(curl -s -u "${USER}:${TOKEN}" \
    -H 'Accept: application/json' \
    "https://redhat.atlassian.net/rest/api/2/issue/${issue_key}" \
    | jq -r '.fields.status.name // empty')"

  if [[ "$status" == *"Closed"* ]]; then
    SKIPPED+=("$issue_key")
    continue
  fi

  #close the issue
  curl --request POST \
  --url "https://redhat.atlassian.net/rest/api/2/issue/${issue_key}/transitions" \
  --user "${USER}":"${TOKEN}" \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{
  "resolution": {
    "name": "Closed"
  },
  "transition": {
    "id": "51"
  }
}'
  CLOSED+=("$issue_key")
done

echo "Skipped issues: ${SKIPPED[@]}"
echo "Closed issues: ${CLOSED[@]}"