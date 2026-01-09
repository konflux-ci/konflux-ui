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
    echo "Cleaning up GitHub repositories and bots..."
    gh auth login --with-token <<< $GH_TOKEN
    
    # We create approximately 20 repositories per day (100 per week). 
    # The repositories from successful PRs should removed after the test.
    # We want to keep repositories younger then a month.
    # The job should run weekly.
    # Setting limit to 400 repositories to be safe as we keep ~70 repositories per week.
    gh_repos_json=$(gh repo list $GH_ORG --json createdAt,owner,name -L 400)

    removed_repos=0
    skipped_repos=0

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
            echo "Deleting $repo_locator created at $created_at"
            gh repo delete $repo_locator --yes
            removed_repos=$((removed_repos + 1))
        else
            echo "Skipping $name from deletion - younger than a month - created at $created_at."
            skipped_repos=$((skipped_repos + 1))
        fi
    done < <(jq -c '.[]' <<<"$gh_repos_json")

    echo "Removed $removed_repos repositories."
    echo "Skipped $skipped_repos repositories."
}

clean_quay() {
    echo "Cleaning up Quay repositories and bots..."
    clean_quay_repos
    clean_quay_bots
}

clean_quay_repos() {
    echo "Cleaning up Quay repositories..."

    while true; do
        response=$(curl -s -H "Authorization: Bearer $QUAY_TOKEN" "${QUAY_HOMEPAGE}/api/v1/repository?namespace=${QUAY_TEST_ORG}&last_modified=true${NEXT_PAGE_PARAM}" )
        
        # We skip repositories that are empty/never pushed.
        echo "$response" | jq -r '.repositories[] | "\(.name)|\(.last_modified // "null")"' | \
        while IFS="|" read -r REPO_NAME LAST_MOD; do

            if [ "$LAST_MOD" == "null" ]; then
                # If last_modified is null, the repo is empty/never pushed. 
                # Safety check: We skip deleting these automatically to avoid deleting brand new empty repos.
                echo "Skipping $REPO_NAME - Empty/Never pushed"
                continue
            fi

            # Only delete repositories that match the name pattern.
            if [[ "$REPO_NAME" == *"${QUAY_SEARCH_PHASE}"* ]]; then
                # Check Age
                if [ "$LAST_MOD" -lt "$month_ago" ]; then
                    echo -n "Deleting $REPO_NAME - Last modified at $(date -d @$LAST_MOD +%Y-%m-%d)"
                    DELETE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${QUAY_HOMEPAGE}/api/v1/repository/${QUAY_TEST_ORG}/${REPO_NAME}" \
                    -H "Authorization: Bearer $QUAY_TOKEN")
                    [ "$DELETE_RES" -eq 204 ] && echo "  ✅ DELETED" || echo "  ❌ FAILED ($DELETE_RES)"
                else
                    echo "Skipping $REPO_NAME - Last modified at $(date -d @$LAST_MOD +%Y-%m-%d) - younger than a month"
                fi
            else
                echo "Skipping $REPO_NAME - Not matching name pattern"
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
    response=$(curl -s $QUAY_HOMEPAGE/api/v1/organization/$QUAY_TEST_ORG/robots -H "Authorization: Bearer $QUAY_TOKEN")
    echo $response | jq -r '.robots[] | "\(.name) \(.created)"' | while read -r bot; do
        # The bot variable looks like this: konflux_ui_qe+user_ns1_sample_component_0d4f133c71 Fri, 01 Aug 2025 12:22:04 -0000
        # So we need to:
        # 1. Get the name
        # 2. Get the created at timestamp and convert it to epoch
        bot_name=$(echo $bot | cut -d' ' -f1 )
        short_name=$(echo $bot_name | cut -d'+' -f2 )
        bot_created_at=$(echo $bot | cut -d' ' -f2-)
        bot_created_epoch=$(date -d "$bot_created_at" +%s)

        if [ "$bot_created_epoch" -lt "$month_ago" ]; then
            # echo "Removing $bot_name bot created at $bot_created_at."
            for match_bot in "${MATCH_BOTS[@]}"; do
                if [[ $bot_name == *"$match_bot"* ]]; then
                    echo -n "Deleting $short_name created at $bot_created_at."
                    DELETE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${QUAY_HOMEPAGE}/api/v1/organization/${QUAY_TEST_ORG}/robots/${short_name}" \
                    -H "Authorization: Bearer $QUAY_TOKEN")
                    [ "$DELETE_RES" -eq 204 ] && echo "  ✅ DELETED" || echo "  ❌ FAILED ($DELETE_RES)"
                    break
                fi
            done
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