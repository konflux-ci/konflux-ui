#!/bin/bash
# Purpose: This script cleans up repositories and bots that remain on GitHub and Quay after CI automation runs.
GH_ORG="redhat-hac-qe"
GH_SEARCH_PHASE="devfile-sample-code-with-quarkus-"

MATCH_BOTS=("sample_component" "java_quarkus")
QUAY_HOMEPAGE="https://quay.io"
QUAY_SEARCH_PHASE="java-quarkus-"

# 2592000 is the number of seconds in 30 days (60*60*24*30)
month_ago=$(($(date +%s) - 2592000))


clean_up() {
    echo "Starting CI cleanup process..."
    clean_github
    clean_quay
    echo "Cleanup completed."
}

clean_github() {
    # Validate GH_TOKEN environment variable
    if [ -z "${GH_TOKEN}" ]; then
        echo "Error: Required environment variable GH_TOKEN is not set"
        exit 1
    fi
    
    echo "Cleaning up GitHub repositories and bots..."
    gh auth login --with-token <<< $GH_TOKEN
    
    # We create approximately 20 repositories per working day (100 per week). 
    # The repositories from successful PRs should removed after the test.
    # We want to keep repositories younger then a month.
    # The job should run weekly.
    # Setting limit to 500 repositories to be safe as we keep ~70 repositories per week.
    gh_repos_json=$(gh repo list $GH_ORG --json createdAt,owner,name -L 500)

    removed_repos=0
    skipped_repos=0
    failed_repos=0

    while read -r repo; do
        name=$(echo "$repo" | jq -r '.name')
        if [[ $name != *${GH_SEARCH_PHASE}* ]]; then
            echo "Skipping $name from deletion - not matching repo name."
            skipped_repos=$((skipped_repos + 1))
            continue
        fi

        created_at=$(echo "$repo" | jq -r '.createdAt')
        created_epoch=$(date -d "$created_at" +%s)
        if [ "$created_epoch" -lt "$month_ago" ]; then
            repo_locator=$(echo "$repo" | jq -r '.owner.login + "/" + .name')
            echo -n "Deleting $repo_locator created at $created_at... "
            if gh repo delete $repo_locator --yes 2>/dev/null; then
                echo "✅ DELETED"
                removed_repos=$((removed_repos + 1))
            else
                echo "❌ FAILED"
                failed_repos=$((failed_repos + 1))
            fi
        else
            echo "Skipping $name from deletion - younger than a month - created at $created_at."
            skipped_repos=$((skipped_repos + 1))
        fi
    done < <(jq -c '.[]' <<<"$gh_repos_json")

    echo "Removed $removed_repos repositories."
    echo "Skipped $skipped_repos repositories."
    echo "Failed $failed_repos repositories."
}

clean_quay() {
    required_vars=("QUAY_TOKEN" "QUAY_TEST_ORG")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "Error: Required environment variable $var is not set"
            exit 1
        fi
    done
    echo "Cleaning up Quay repositories and bots..."
    clean_quay_repos
    clean_quay_bots
}

clean_quay_repos() {
    echo "Cleaning up Quay repositories..."
    NEXT_PAGE_PARAM=""

    while true; do
        response=$(curl -s -H "Authorization: Bearer $QUAY_TOKEN" "${QUAY_HOMEPAGE}/api/v1/repository?namespace=${QUAY_TEST_ORG}&last_modified=true${NEXT_PAGE_PARAM}" )
        
        echo "$response" | jq -c '.repositories[] | { name: .name, last_modified: .last_modified}' | \
        while read -r repo_json; do
            repo_name=$(echo "$repo_json" | jq -r '.name')
            last_modified=$(echo "$repo_json" | jq -r '.last_modified')
    
            if [ "$last_modified" == "null" ]; then
                # If last_modified is null, the repo is empty/never pushed. 
                # Safety check: We skip deleting these automatically to avoid deleting brand new empty repos.
                echo "Skipping $repo_name - Empty/Never pushed"
                continue
            fi

            # Only delete repositories that match the name pattern.
            if [[ "$repo_name" == *"${QUAY_SEARCH_PHASE}"* ]]; then
                # Check Age
                if [ "$last_modified" -lt "$month_ago" ]; then
                    echo -n "Deleting $repo_name - Last modified at $(date -d @$last_modified +%Y-%m-%d)"
                    DELETE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${QUAY_HOMEPAGE}/api/v1/repository/${QUAY_TEST_ORG}/${repo_name}" \
                        -H "Authorization: Bearer $QUAY_TOKEN")
                    [ "$DELETE_RES" -eq 204 ] && echo "  ✅ DELETED" || echo "  ❌ FAILED ($DELETE_RES)"
                else
                    echo "Skipping $repo_name - Last modified at $(date -d @$last_modified +%Y-%m-%d) - younger than a month"
                fi
            else
                echo "Skipping $repo_name - Not matching name pattern"
            fi
        done
          # Pagination
        NEXT_PAGE=$(echo "$response" | jq -r '.next_page // empty')
        if [ -z "$NEXT_PAGE" ] || [ "$NEXT_PAGE" == "null" ]; then break; fi
        NEXT_PAGE_PARAM="&next_page=${NEXT_PAGE}"
    done
}

clean_quay_bots() {
    echo "Cleaning up Quay bots..."
    matched_bot=false

    response=$(curl -s $QUAY_HOMEPAGE/api/v1/organization/$QUAY_TEST_ORG/robots -H "Authorization: Bearer $QUAY_TOKEN")
    echo $response | jq -c '.robots[] | {name: .name, created: .created}' | while read -r bot_json; do
        bot_name=$(echo "$bot_json" | jq -r '.name')
        short_name=$(echo "$bot_name" | cut -d'+' -f2)
        bot_created_at=$(echo "$bot_json" | jq -r '.created')
        bot_created_epoch=$(date -d "$bot_created_at" +%s)

        if [ "$bot_created_epoch" -lt "$month_ago" ]; then
            for match_bot in "${MATCH_BOTS[@]}"; do
                if [[ $bot_name == *"$match_bot"* ]]; then
                    echo -n "Deleting $short_name created at $bot_created_at."
                    DELETE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${QUAY_HOMEPAGE}/api/v1/organization/${QUAY_TEST_ORG}/robots/${short_name}" \
                    -H "Authorization: Bearer $QUAY_TOKEN")
                    [ "$DELETE_RES" -eq 204 ] && echo "  ✅ DELETED" || echo "  ❌ FAILED ($DELETE_RES)"
                    matched_bot=true
                    break
                fi
            done
            if [ "$matched_bot" = false ]; then
                echo "Skipping $short_name - Not matching bot name pattern"
            fi
        else
            echo "Skipping $short_name - younger than a month - created at $bot_created_at."
        fi
    done
}

# Parse script arguments
case "$1" in
  github)
    clean_github
    ;;
  quay)
    clean_quay
    ;;
  "" )
    clean_up
    ;;
  * )
    echo "Usage: $0 [github|quay]"
    exit 1
    ;;
esac
