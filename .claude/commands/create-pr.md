Ship pending changes as a pull request from fork to upstream.

Use the `create-pr` skill to drive the flow. The skill handles checking for uncommitted changes, committing, pushing, building the PR description, confirmation, and Jira ticket transitions.

Pass all context below to the skill — conversation history, arguments, what was worked on, decisions made. The skill will use this to build a rich PR description.

## Shorthand hints

If the arguments say "ready", create the PR without `--draft`.

If the arguments include a Jira ticket ID, use it for the PR title scope and Fixes link.

$ARGUMENTS
