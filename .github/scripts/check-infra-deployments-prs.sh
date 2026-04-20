#!/bin/bash
# Check for open PRs in infra-deployments repository related to konflux-ui
#
# This script queries the infra-deployments repository for PRs that mention
# konflux-ui in their title and sends a report to Slack to prevent deployment
# PRs from being forgotten.
#
# Environment Variables (required):
#   SLACK_WEBHOOK_URL - Slack incoming webhook URL for notifications
#   GH_TOKEN          - GitHub token for API access
#
# Environment Variables (optional):
#   INFRA_DEPLOYMENTS_REPO - Target repo (default: redhat-appstudio/infra-deployments)
#   COMPONENT_NAME         - Component to search (default: konflux-ui)
#   INFRA_PR_LIMIT         - Max PRs to fetch (default: 100)
#   INFRA_PR_STATE         - PR state: open, closed, merged, all (default: open)
#   INFRA_BOT_LOGIN        - Bot account name (default: app/rh-tap-build-team)
#   TEST_MODE              - Set to 'true' to log output instead of sending to Slack

set -euo pipefail

# ----- Configuration -----

INFRA_REPO="${INFRA_DEPLOYMENTS_REPO:-redhat-appstudio/infra-deployments}"
COMPONENT="${COMPONENT_NAME:-konflux-ui}"
PR_LIMIT="${INFRA_PR_LIMIT:-100}"
PR_STATE="${INFRA_PR_STATE:-open}"
BOT_LOGIN="${INFRA_BOT_LOGIN:-app/rh-tap-build-team}"
TEST_MODE="${TEST_MODE:-false}"

# Validate required environment variables
if [ -z "${GH_TOKEN:-}" ]; then
    echo "Error: GH_TOKEN is not set" >&2
    exit 1
fi

if [ "$TEST_MODE" != "true" ] && [ -z "${SLACK_WEBHOOK_URL:-}" ]; then
    echo "Error: SLACK_WEBHOOK_URL is not set (or set TEST_MODE=true for testing)" >&2
    exit 1
fi

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "Error: gh CLI not found. Please install GitHub CLI." >&2
    exit 1
fi

# ----- Functions -----

check_infra_deployments_prs() {
    echo "Checking ${PR_STATE} PRs in ${INFRA_REPO} for ${COMPONENT} (limit: ${PR_LIMIT})..." >&2

    # Get PRs that mention the component in title using GitHub search
    local prs_json
    if ! prs_json=$(gh pr list \
        --repo "${INFRA_REPO}" \
        --search "${COMPONENT} in:title state:${PR_STATE}" \
        --json number,title,author,createdAt,url,state,body \
        --limit "${PR_LIMIT}" 2>&1); then
        echo "Warning: Failed to fetch PRs from ${INFRA_REPO}" >&2
        echo "  Error: $prs_json" >&2

        # Return error in JSON format
        jq -n \
            --arg error "Failed to fetch PRs from ${INFRA_REPO}" \
            --arg details "${prs_json}" \
            '{error: $error, details: $details}'
        return 1
    fi

    # For bot-created PRs, extract included PRs from body
    prs_json=$(echo "$prs_json" | jq --arg bot "$BOT_LOGIN" '
        map(
            if .author.login == $bot then
                .includedPRs = [.body // "" |
                    scan("https://github.com/[^/]+/[^/]+/pull/\\d+") |
                    sub("https://github.com/"; "") |
                    sub("/pull/"; "#")
                ]
            else
                .includedPRs = []
            end
        )
    ')

    if [ -z "$prs_json" ] || [ "$prs_json" = "[]" ]; then
        echo "✅ No ${PR_STATE} PRs found in infra-deployments for ${COMPONENT}" >&2
        echo "[]"
        return 0
    fi

    local pr_count
    pr_count=$(echo "$prs_json" | jq '. | length')

    echo "⚠️ Found ${pr_count} ${PR_STATE} PR(s) in infra-deployments:" >&2
    echo "$prs_json" | jq -r '.[] | "  #\(.number): \(.title) (by \(.author.login), created \(.createdAt | split("T")[0])) - \(.url)"' >&2

    # Output JSON for further processing
    echo "$prs_json"
}

format_slack_message() {
    local prs_json="$1"
    local pr_state="$2"

    # Capitalize first letter of state (open -> Open, closed -> Closed, etc.)
    local state_display
    state_display="$(echo "${pr_state}" | sed 's/^\(.\)/\U\1/')"

    # Check if input is an error object (not an array)
    local file_type
    file_type=$(echo "$prs_json" | jq -r 'type')

    if [ "$file_type" != "array" ]; then
        # Handle error case
        local error_msg
        error_msg=$(echo "$prs_json" | jq -r '.error // "Unknown error"')

        cat <<EOF
{
  "text": "⚠️ *Failed to fetch infra-deployments PRs*\n${error_msg}"
}
EOF
        return 0
    fi

    # Handle normal PR list
    local pr_count
    pr_count=$(echo "$prs_json" | jq '. | length')

    if [ "$pr_count" -eq 0 ]; then
        cat <<EOF
{
  "text": "✅ *No ${state_display} infra-deployments PRs for ${COMPONENT}*"
}
EOF
        return 0
    fi

    # Format PR list for Slack
    # Different formatting for bot vs human PRs:
    # - Bot PRs: highlight included konflux-ui PRs with clickable links
    # - Human PRs: show full title and author info
    local pr_list
    pr_list=$(echo "$prs_json" | jq -r --arg bot "$BOT_LOGIN" '
        .[] |
        # Common format: #number - title by @author at date
        # For bot PRs, prepend "(includes ui#xxx, ui#yyy)" if available
        (
            if (.author.login == $bot and (.includedPRs | length) > 0) then
                "(includes " + (
                    .includedPRs | map(
                        # Extract PR number and create clickable link
                        (. | sub("konflux-ci/konflux-ui#"; "")) as $num |
                        "<https://github.com/konflux-ci/konflux-ui/pull/" + $num + "|ui#" + $num + ">"
                    ) | join(", ")
                ) + ") "
            else
                ""
            end
        ) as $includes |
        "• <\(.url)|#\(.number)> " + $includes + "- \(.title) by @\(.author.login) at \(.createdAt | split("T")[0])"
    ' | sed 's/$/\\n/' | tr -d '\n')

    # Build Slack message JSON
    cat <<EOF
{
  "text": "📋 *${state_display} infra-deployments PRs (${pr_count}):*\n${pr_list}"
}
EOF
}

send_to_slack() {
    local message="$1"

    if [ "$TEST_MODE" = "true" ]; then
        echo ""
        echo "=== TEST MODE: Would send to Slack ===" >&2
        echo "$message" | jq '.' >&2
        echo "=====================================" >&2
        return 0
    fi

    # Send to Slack
    local response
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$message" \
        "${SLACK_WEBHOOK_URL}")

    if [ "$response" != "ok" ]; then
        echo "Warning: Slack API returned: $response" >&2
        return 1
    fi

    echo "✅ Report sent to Slack successfully" >&2
}

# ----- Main Script -----

main() {
    echo "🔍 Checking infra-deployments PRs for ${COMPONENT}..." >&2

    # Check for PRs
    local prs_json
    prs_json=$(check_infra_deployments_prs)

    # Format Slack message
    local slack_message
    slack_message=$(format_slack_message "$prs_json" "$PR_STATE")

    # Send to Slack
    send_to_slack "$slack_message"

    echo "✅ Done!" >&2
}

# Run main function
main
