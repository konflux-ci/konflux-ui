---
name: jira-ticket
description: >
  Create a Jira ticket, file a bug, open a Jira issue, draft a story,
  log a spike, raise an issue, create a task, report a bug, write a ticket,
  submit a Jira, new Jira ticket, open a task, file an issue, draft a bug report,
  create Jira bug, create Jira task
---

# Jira Ticket Creation Skill

## Startup

**MUST do before anything else:**

1. Read `./conventions.md` (sibling file in the same directory as this skill) to load project-specific rules: project key, issue types, title format, templates, components, labels, and epic linking rules.
2. Check if the `atlassian` MCP server is available by looking for `jira_create_issue` in the available MCP tools. Record whether it's available — this determines behavior at Step 6.
3. **NEVER read `.env.local`, `.env`, or any file matching `.env.*`** — credentials are handled by the MCP server process, not by this skill.

## Context Gathering

Before starting the interview, scan for existing context:
- **Conversation history**: errors, stack traces, failing tests, problem descriptions the user has been discussing.
- **Command arguments**: if invoked via a slash command with `$ARGUMENTS`, use that as starting input.
- **Session context**: recent build failures, test output, or console errors.

Pre-fill as many fields as possible from this context. Only ask the user for information you can't infer.

## Interview Flow

Do NOT call any Jira create tool until all required fields are collected and confirmed.

### Step 1 — Determine issue type
If already pinned by a slash command or obvious from context (e.g., user said "file a bug", or context contains an error/defect), set the type without asking. Otherwise ask:
> What type of issue? (available types from conventions.md: Bug, Task, etc.)

### Step 2 — Collect title
Propose a title derived from context, formatted per conventions.md title format. If no context is available, ask for a summary. Validate format and show the proposed title for approval.

### Step 3 — Collect description
Use the template from conventions.md for the issue type (Bug Template, Task Template, etc.). Pre-fill sections from conversation context where possible — stack traces, error messages, reproduction steps the user already described. Refer to the Templates section below for fill-in guidance on each section. Ask only for missing sections.

### Step 4 — Collect optional fields
Check conventions.md for:
- Component (if configured, ask; if marked "skip", skip silently)
- Labels (if configured, ask; if marked "skip", skip silently)
- Priority: suggest one based on the Severity and Priority guidelines below, then let the user confirm or override
- Epic link (if required by conventions.md for this issue type, ask; otherwise skip)

### Step 5 — Show and confirm (MANDATORY GATE)
Render the complete draft:

```
## Ticket Draft

**Project:** <from conventions.md>
**Type:** <issue type>
**Title:** <validated title>
**Priority:** <priority>
**Component:** <if applicable>
**Labels:** <if applicable>
**Epic:** <if applicable>

### Description
<full description from template>
```

Then ask:
> Does this look good? Reply "yes" or "confirm" to create the ticket, or tell me what to change.

**Do NOT call the create tool until the user explicitly confirms.**

### Step 6 — Create

**If MCP server is available:** Call `jira_create_issue` with all collected fields. Submit the description as markdown — the MCP server handles ADF conversion.

**Tool call shape:**
```python
jira_create_issue(
    project_key="<from conventions.md>",
    issue_type="<Bug | Task>",
    summary="<validated title>",
    description="<filled template as markdown>",
    # components="<from conventions.md, if configured>",
    additional_fields={
        "priority": {"name": "<priority>"},
        # "labels": ["<label1>", "<label2>"],  # if configured in conventions.md
        # "customfield_XXXXX": "<value>",       # epic link or other custom fields from conventions.md
    }
)
```

**If MCP server is NOT available:** Do not attempt the call. Instead, present the complete ticket details in a copyable format so the user can create it manually:

```
## Ready to create — MCP server not available

Jira MCP server is not configured. Create this ticket manually at <Jira URL from conventions.md>.
To enable automatic creation, export `JIRA_URL`, `JIRA_USERNAME`, and `JIRA_API_TOKEN` in your shell profile and restart Claude Code. See `.env.example` for details.

**Project:** <project key>
**Type:** <issue type>
**Title:** <title>
**Priority:** <priority>
**Component:** <if applicable>
**Labels:** <if applicable>

### Description
<full description>
```

### Step 7 — Post-creation
- Report the created ticket key and URL to the user.
- If conventions.md specifies a PR linking rule and there is a current PR, offer to add the PR URL as a comment on the newly created ticket.

## Markdown Formatting Guidelines

The MCP server converts markdown to Jira-compatible format. Use these conventions for best rendering:

### Headers
- `##` for section headers (→ `h2.` in Jira)
- `###` for subsection headers (→ `h3.` in Jira)

### Text Formatting
- `**bold**` → `*bold*` in Jira
- `*italic*` → `_italic_` in Jira
- `` `inline code` `` → `{{code}}` in Jira

### Lists
- Bullet lists: use `- Item` (not `*`). Indent nested items with 2 spaces.
- Numbered lists: use `1.` for all items. Indent nested items with 4 spaces.
- Do NOT use `*`, `#`, or other symbols for lists.

### Code Blocks
Use fenced code blocks with language identifier:
````
```python
code here
```
````
Converts to `{code:python}...{code}` in Jira.

### Links
- `[link text](url)` → `[link text|url]` in Jira

### Tables
- Use standard markdown table format with `|` separators — auto-converted to Jira `||` header format.

## Severity and Priority

Use these guidelines when asking the user for priority, or when suggesting one based on context.

### Severity (Bugs only)
- **Critical**: Broken core functionality, crashes, data loss, no workaround, security vulnerability
- **Major**: Non-critical functional issue, performance degradation, reasonable workaround exists
- **Normal**: Default — validation issues, non-blocking functional problems
- **Minor**: Cosmetic issues (alignment, layout, color, copy)
- **Trivial**: Console warnings, log noise, no user impact

### Priority Mapping
| Severity | Suggested Priority |
|----------|-------------------|
| Critical | Blocker or Critical |
| Major | Major |
| Normal | Normal |
| Minor | Minor |
| Trivial | Minor |

For Tasks, default to Normal unless the user specifies urgency.

## Templates — Fill-in Guidance

The canonical template structure comes from conventions.md. Below is guidance on how to fill each section. If conventions.md defines a template for the issue type, use that structure and apply this guidance.

### Bug — Section Guidance

| Section | How to fill |
|---------|-------------|
| Description of problem | Be specific — what is broken, where, and for whom |
| How reproducible | One of: Always, Sometimes, One-time |
| Steps to Reproduce | Numbered steps a stranger could follow. Minimum 3 steps. Include preconditions (logged in? specific page?) |
| Actual results | What happens — include error messages, console output, or visual description |
| Expected results | What should happen instead — be concrete |
| Is this a customer issue | Yes or No |
| Logs/screenshots | Paste raw errors in a fenced code block. If from conversation context, include verbatim |

### Task — Section Guidance

| Section | How to fill |
|---------|-------------|
| Description | Bullet points summarizing the work. Each bullet should be an actionable item, not a restatement of the title. Aim for 3-7 bullets covering scope, approach, and edge cases |

## Anti-patterns

Before confirming a ticket, actively check for and reject these:

1. **Vague titles** starting with "Fix", "Update", "Change" without specifics — rewrite to be descriptive.
   - Bad: `Fix the bug`
   - Good: `[LogViewer] Fix log line duplication when switching tabs`
2. **Bug descriptions without reproduction steps** — all Steps to Reproduce fields must be filled.
3. **Task descriptions that just restate the title** — bullet points must add actionable detail beyond the summary.
4. **Missing required template sections** — every section in the template must have content, not blanks or placeholders.
5. **Epic link missing on Stories** (when conventions.md requires it) — block creation until provided.
6. **Filing as Bug when it's not a Bug.** A Bug is a defect — something that should work but doesn't. These are NOT Bugs:
   - New functionality that doesn't exist yet (→ Task or Story)
   - Flaky/intermittent test failures without a proven product defect (→ Task)
   - Test coverage gaps (→ Task)
   - Refactoring or code cleanup (→ Task)
   - Feature requests or improvements beyond current expected behavior (→ Task)
   
   If the user asks to "file a bug" but the description is actually a feature request or test fix, flag it and suggest Task instead.

## Worked Examples

### Example 1: Bug

**User:** "The sidebar crashes when you click the settings icon on Firefox"

**Skill interview:**
> Issue type is Bug. Let me draft the title.
>
> Proposed title: `[Sidebar] Fix crash when clicking settings icon on Firefox`
>
> Let me fill out the bug template. A few questions:
> 1. How reproducible is this? (always / sometimes / one-time)
> 2. What are the exact steps — do you need to be logged in? Any specific page?
> 3. What's the actual result — blank screen, error message, console error?
> 4. Is this a customer issue?

**User provides answers.**

**Skill shows draft:**
```
## Ticket Draft

**Project:** <PROJECT_KEY>
**Type:** Bug
**Title:** [Sidebar] Fix crash when clicking settings icon on Firefox
**Priority:** Major

### Description
Description of problem:
Clicking the settings icon in the sidebar causes a crash on Firefox 128.

How reproducible:
Always

Steps to Reproduce:

1. Open the application in Firefox 128
2. Navigate to any page with the sidebar visible
3. Click the settings (gear) icon in the sidebar

Actual results:
Page crashes with a blank white screen. Console shows: TypeError: Cannot read properties of undefined (reading 'map')

Expected results:
Settings panel opens in the sidebar without errors.

Is this a customer issue: No

Please attach any logs/print screens to the ticket or share any additional info/links:
Console stacktrace attached.
```

> Does this look good? Reply "yes" or "confirm" to create the ticket.

**User:** "yes"

**Skill tool call:**
```python
jira_create_issue(
    project_key="<PROJECT_KEY>",
    issue_type="Bug",
    summary="[Sidebar] Fix crash when clicking settings icon on Firefox",
    description="""Description of problem:
Clicking the settings icon in the sidebar causes a crash on Firefox 128.

How reproducible:
Always

Steps to Reproduce:

1. Open the application in Firefox 128
2. Navigate to any page with the sidebar visible
3. Click the settings (gear) icon in the sidebar

Actual results:
Page crashes with a blank white screen. Console shows: TypeError: Cannot read properties of undefined (reading 'map')

Expected results:
Settings panel opens in the sidebar without errors.

Is this a customer issue: No

Please attach any logs/print screens to the ticket or share any additional info/links:
Console stacktrace attached.""",
    additional_fields={
        "priority": {"name": "Major"}
    }
)
```

### Example 2: Task

**User:** "I need a ticket to add unit tests for the commit label component"

**Skill interview:**
> Issue type is Task. Let me draft the title.
>
> Proposed title: `[CommitLabel] Add unit tests for CommitLabel component`
>
> What should the task cover? Any specific scenarios or edge cases to test?

**User:** "Test the rendering with different commit SHAs, truncation logic, and the copy-to-clipboard behavior"

**Skill shows draft:**
```
## Ticket Draft

**Project:** <PROJECT_KEY>
**Type:** Task
**Title:** [CommitLabel] Add unit tests for CommitLabel component
**Priority:** Normal

### Description
- Add unit tests for the CommitLabel component
- Test rendering with full and short commit SHAs
- Verify SHA truncation logic displays correct abbreviated format
- Test copy-to-clipboard behavior on click
- Cover edge cases: empty SHA, undefined SHA, extremely long input
```

> Does this look good? Reply "yes" or "confirm" to create the ticket.

**User:** "confirm"

**Skill tool call:**
```python
jira_create_issue(
    project_key="<PROJECT_KEY>",
    issue_type="Task",
    summary="[CommitLabel] Add unit tests for CommitLabel component",
    description="""- Add unit tests for the CommitLabel component
- Test rendering with full and short commit SHAs
- Verify SHA truncation logic displays correct abbreviated format
- Test copy-to-clipboard behavior on click
- Cover edge cases: empty SHA, undefined SHA, extremely long input""",
    additional_fields={
        "priority": {"name": "Normal"}
    }
)
```
