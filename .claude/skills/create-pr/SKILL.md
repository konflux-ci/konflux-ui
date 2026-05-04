---
name: create-pr
description: >
  Create a pull request, open a PR, submit a PR,
  push and create PR, send for review, open pull request, 
  make a PR, raise a pull request
---

# Pull Request Creation Skill

## Startup

1. Read the project's commit conventions from `CLAUDE.md` at the repo root.
2. Check if the `atlassian` MCP server is available (for Jira ticket transitions). Record availability.
3. Read `.github/PULL_REQUEST_TEMPLATE.md` to know the PR structure.

## Context Gathering

Before creating the PR, scan for existing context to build a rich description:

- **Conversation history**: what task the user was working on, decisions made, trade-offs discussed, problems solved, and approaches taken.
- **Command arguments**: if invoked via `/create-pr` with `$ARGUMENTS`, use those as input.
- **Git state**: commits on the branch, diff against main, branch name.

The PR description should reflect the full story of the change — not just a mechanical summary of the diff. Use conversation context to explain the *why* and *how*.

## Flow

### Step 1 — Check for uncommitted changes

- Run `git status` (never use `-uall`)
- If there are staged or unstaged changes relevant to current work:
  - Stage relevant files (prefer specific files over `git add .`)
  - Follow commit conventions from `CLAUDE.md`
  - If the commit type is ambiguous, ask the user
- If there are no changes and no commits ahead of main, stop and tell the user there is nothing to ship

### Step 2 — Analyze branch state

- Run `git log origin/main..HEAD` to see all commits on this branch
- Run `git diff origin/main...HEAD --stat` to see the full diff summary
- If on main/master, stop and ask what branch name to create
- Check if the branch has a remote tracking branch: `git rev-parse --abbrev-ref @{u} 2>/dev/null`

### Step 3 — Push to fork

- Always push to the user's fork remote, never to `origin`/`upstream`
- Use `-u` if the branch is new or has no upstream tracking
- If push fails due to conflicts, stop and report — never force push

### Step 4 — Build the PR description

Fill the PR template from `.github/PULL_REQUEST_TEMPLATE.md` using **all available context** — conversation history, commits, and diff:

- **Fixes**: extract Jira ticket ID from branch name or commit messages (pattern: `KFLUXUI-\d+` or `KONFLUX-\d+`). Format as `Fixes: https://redhat.atlassian.net/browse/<TICKET-ID>`. If no ticket ID found, leave the placeholder comment.
- **Description**: 2-3 sentences summarizing the change and motivation. Pull from conversation context — what problem was being solved, what approach was chosen, and why. Do not just restate the commit messages.
- **Type of change**: check the applicable box(es) based on the diff.
- **Screen shots / Gifs**: if automated screenshots were captured in Step 4a, embed them here (see Step 4a output). Otherwise, note that screenshots should be added manually.
- **How to test or reproduce**: list concrete steps to verify the change. Pull from conversation context — if the user described testing steps or verified behavior during the session, include those.
- **Browser conformance**: leave unchecked (manual verification).

### Step 4a — Capture UI Screenshots

Automatically capture before/after screenshots for UI changes. This step uses the `screenshot` skill (`.claude/skills/screenshot/SKILL.md`) for the actual capture work.

#### 4a.1 — Check for user override

If the user passed `--screenshots` or `--no-screenshots` as part of the `/create-pr` invocation:
- `--no-screenshots` → skip this entire step
- `--screenshots` → force screenshot capture (skip detection, go to 4a.3)
- No flag → continue to 4a.2

#### 4a.2 — Detect UI changes

Analyze the diff content (`git diff origin/main...HEAD`) for visual UI impact. Do **not** rely solely on file extensions.

**Strong UI signals** (capture screenshots):
- JSX/TSX markup changes, CSS/SCSS changes
- PatternFly component additions/removals/prop changes
- Changes to component return statements or render functions

**Weak/no UI signals** (skip):
- Type-only changes, test files, hook logic not affecting render, build config, docs

**Ambiguous**: trace usage of shared hooks/utilities; ask user if genuinely unclear.

If no UI change detected, skip the rest of Step 4a.

#### 4a.3 — Capture "after" screenshots

Read the `screenshot` skill (`.claude/skills/screenshot/SKILL.md`) and follow steps 1–6. You already have the diff from Step 4a.2, so pass that context forward — don't re-analyze from scratch. Specifically:

1. From the diff, identify the **view-level component** to render (step 1 in screenshot skill)
2. Skip step 2 (diff analysis) — you already did this in 4a.2
3. Follow steps 3–6: research data deps, choose scenarios, write render file, run capture with `--prefix after`

If capture fails, do **not** block PR creation — note "Automated screenshots failed — add manually" and continue to Step 5.

#### 4a.4 — Capture "before" screenshots (for existing files)

Check if the changed component exists on main: `git cat-file -e origin/main:<path> 2>/dev/null`

If it does:
1. Verify clean working tree: `git status --porcelain` should be empty
2. `BRANCH=$(git rev-parse --abbrev-ref HEAD)`
3. `git switch origin/main --detach`
4. Run capture with `--prefix before` using the **same render file** from 4a.3
5. `git switch "$BRANCH"`

If the component is new (does not exist on main), skip — only "after" screenshots are produced. If before-capture fails, continue without them.

**Note**: The render file from 4a.3 lives in `scripts/screenshots/tmp/` and is not tracked by git. It will persist across the branch switch. The mock data and scenario structure remain valid for the "before" state — only the component source code changes.

#### 4a.5 — Embed screenshot references in the PR body

The capture script outputs a JSON array with `{ scenarioId, label, filePath }` for each screenshot. Use the `label` field as the description — it tells the reviewer what the screenshot shows and what to look for.

List captured screenshots in the PR body under "Screen shots / Gifs for design review":

```markdown
### Screen shots / Gifs for design review

Screenshots were captured automatically. After the PR is created, drag and drop these files into this section:

**<ComponentName>**
| Screenshot | What to look for |
|---|---|
| `<path-to-after-screenshot.png>` | <label from capture output — e.g. "Populated table showing the new Status column with varied values"> |
| `<path-to-before-screenshot.png>` | Before: <label> (main branch) |
```

Each row pairs the screenshot file with the scenario label so the reviewer immediately knows what is important in that screenshot without having to guess.

For new components, list only the "after" screenshots. Also print file paths to the console in Step 5.

### Step 5 — Show and confirm (MANDATORY GATE)

Render the complete PR draft:

```
## PR Draft

**Title:** <title>
**Base:** main
**Draft:** yes/no

### Body
<full PR body from template>
```

Then ask:
> Does this look good? Reply "yes" to create the PR, or tell me what to change.

**Do NOT create the PR until the user explicitly confirms.**

### Step 6 — Create the PR

- Write the PR body to a temp file to avoid shell escaping
- Create the PR from fork to upstream:
  ```
  gh pr create --repo konflux-ci/konflux-ui --head <fork-owner>:<branch> --base main --draft --title "..." --body-file /tmp/pr-body.md
  ```
- Default to `--draft` unless the user says "ready"

### Step 7 — Jira ticket transition

After the PR is created, check if a Jira ticket ID (pattern: `KFLUXUI-\d+` or `KONFLUX-\d+`) appears in:
- The branch name
- Any commit message on the branch

If a ticket ID is found:
1. Fetch the ticket's current status using `jira_get_issue`
2. If the status is already one of: **Code Review**, **Review**, **Release Pending**, **Closed**, **Done**, **Resolved** — report the current status and take no action
3. Otherwise, ask the user: "Move <TICKET-ID> from '<current status>' to 'Code Review'?"
4. If the user confirms, use `jira_get_transitions` to find the transition ID for the review state, then `jira_transition_issue` to move it

If no ticket ID is found, skip this step silently.

**If MCP server is NOT available:** Skip the transition step. Report the ticket ID and suggest the user move it manually.

### Step 8 — Report

Output:
- The PR URL
- One-line summary of what was shipped
- Jira ticket status (if applicable — current state and whether it was transitioned)

## PR Title Guidelines

- Keep under 70 characters
- Use the conventional commit prefix: `feat:`, `fix:`, `chore:`, etc.
- Include the Jira ticket ID in scope if one exists: `feat(KFLUXUI-1234): add dark mode toggle`
- If multiple commits exist, summarize the overall change — don't concatenate commit messages

## Anti-patterns

1. **Mega-commits**: if unrelated changes are staged together, ask the user whether to split them into separate commits before proceeding.
2. **Empty descriptions**: every PR section in the template must have content, not just the placeholder comments.
3. **Diff-only descriptions**: the Description section should explain *why* and *how*, not just list what files changed. Use conversation context.
4. **Force pushing**: never force push. If the push fails, stop and report.
5. **Skipping confirmation**: always show the draft and wait for user approval before creating.