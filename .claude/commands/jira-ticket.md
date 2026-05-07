Create a new Jira ticket.

Use the `jira-ticket` skill to drive the interview. The skill handles reading conventions, collecting fields, validation, and confirmation.

Pass all context below to the skill — conversation history, arguments, errors, stack traces. The skill will pre-fill what it can and ask for the rest.

## Shorthand hints

If the arguments contain a stack trace, error output, or test failure, pre-fill a Bug with the raw output in a code block in the description.

If the arguments mention "bug" or describe broken behavior, pin issue type to Bug and pre-scaffold the bug template.

$ARGUMENTS
