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

1. Read `./conventions.md` to load project rules (project key, issue types, title format, templates, parent linking).
2. Check if `jira_create_issue` is available in MCP tools. Record availability for Step 6.
3. **NEVER read `.env.local`, `.env`, or any `.env.*` file.**

## Context Gathering

Scan conversation history, `$ARGUMENTS`, and session context (errors, stack traces, test failures) before starting. Pre-fill fields from context — only ask for what you can't infer.

## Interview Flow

Do NOT call any Jira create tool until all required fields are collected and confirmed.

### Step 1 — Determine issue type
If obvious from context or slash command, set type silently. Otherwise ask.

### Step 2 — Collect title
Propose a title formatted per conventions.md (`[Area] imperative summary`). Ask for approval.

### Step 3 — Collect description
Use the template from conventions.md for the issue type. Pre-fill from context. Ask only for missing sections. See fill-in guidance below.

### Step 4 — Collect optional fields
- Component / Labels: ask if configured in conventions.md, skip if marked "skip"
- Priority: suggest based on conventions.md defaults, let user confirm or override
- Parent: use if provided in context/args. Ask only if user mentions a parent but didn't give the key. Do NOT ask unprompted.

### Step 5 — Show and confirm (MANDATORY GATE)
Render the draft, then ask for confirmation. Do NOT call the create tool until the user explicitly confirms.

```
## Ticket Draft

**Project:** <from conventions.md>
**Type:** <issue type>
**Title:** <validated title>
**Priority:** <priority>
**Component:** <if applicable>
**Labels:** <if applicable>
**Parent:** <parent ticket key, if applicable>

### Description
<full description from template>
```

### Step 6 — Create

**If MCP available:** Call `jira_create_issue`. Submit description as markdown — the MCP server handles ADF conversion.

```python
jira_create_issue(
    project_key="<from conventions.md>",
    issue_type="<Bug | Task | Story>",
    summary="<validated title>",
    description="<filled template as markdown>",
    # components="<if configured>",
    additional_fields='{"priority": {"name": "<priority>"}}'
    # With parent: '{"priority": {"name": "<priority>"}, "parent": "<PARENT_KEY>"}'
    # With labels: '{"priority": {"name": "<priority>"}, "labels": ["<label1>"]}'
)
```

**If MCP NOT available:** Render the same draft format from Step 5 with a note:
> Jira MCP server is not configured. Create this ticket manually at \<Jira URL from conventions.md\>.
> To enable, configure the `atlassian` MCP server with `pipx run mcp-atlassian --env-file <path>` and restart Claude Code.

### Step 7 — Post-creation
Report ticket key and URL. If conventions.md has a PR linking rule and there's a current PR, offer to add it as a comment.

## Fill-in Guidance

### Bug
| Section | Guidance |
|---------|----------|
| Description of problem | What is broken, where, for whom |
| How reproducible | Always / Sometimes / One-time |
| Steps to Reproduce | Numbered steps a stranger could follow, minimum 3. Include preconditions |
| Actual results | Include error messages, console output |
| Expected results | Be concrete |
| Is this a customer issue | Yes or No |
| Logs/screenshots | Raw errors in fenced code blocks |

### Task
| Section | Guidance |
|---------|----------|
| Description | 3-7 actionable bullet points covering scope, approach, edge cases. Not a restatement of the title |

### Story
| Section | Guidance |
|---------|----------|
| Acceptance Criteria | 3-7 testable criteria using "As a \<user\>, I can \<action\> so that \<outcome\>" format |
| Notes | Developer notes, design doc links, API specs. Optional — skip if nothing to add |

## Anti-patterns

Reject these before confirming:
1. **Vague titles** — "Fix the bug" is bad. "[LogViewer] Fix log line duplication when switching tabs" is good.
2. **Bugs without repro steps** — all Steps to Reproduce fields must be filled.
3. **Task descriptions restating the title** — bullets must add detail beyond the summary.
4. **Empty template sections** — every section needs content, not blanks.
5. **Missing parent** — if user mentioned a parent ticket, it must be in the draft.
6. **Wrong issue type** — new features, flaky tests, refactoring, and test coverage gaps are Tasks or Stories, not Bugs. Flag and suggest the right type.

## Worked Examples

### Example 1: Task under a parent epic

**User:** "Create a task under KFLUXUI-1200 for adding pagination to the pipeline runs table"

**Interview:** Type is Task, parent is KFLUXUI-1200. Propose title: `[PipelineRuns] Add pagination to pipeline runs table`. Ask what the task should cover.

**User:** "Use numbered pagination with a default page size of 20. The API already supports limit/offset."

**Draft:**
```
## Ticket Draft

**Project:** KFLUXUI
**Type:** Task
**Title:** [PipelineRuns] Add pagination to pipeline runs table
**Priority:** Normal
**Parent:** KFLUXUI-1200

### Description
- Add numbered pagination to the pipeline runs table
- Default page size of 20 rows
- Use limit/offset query parameters against the existing API
- Update table footer with page controls (previous, next, page numbers)
- Preserve current sort and filter state across page changes
```

**Tool call after confirmation:**
```python
jira_create_issue(
    project_key="KFLUXUI",
    issue_type="Task",
    summary="[PipelineRuns] Add pagination to pipeline runs table",
    description="""- Add numbered pagination to the pipeline runs table
- Default page size of 20 rows
- Use limit/offset query parameters against the existing API
- Update table footer with page controls (previous, next, page numbers)
- Preserve current sort and filter state across page changes""",
    additional_fields='{"priority": {"name": "Normal"}, "parent": "KFLUXUI-1200"}'
)
```

### Example 2: Story under a parent epic

**User:** "Create a story under KFLUXUI-1200 for letting users filter pipeline runs by status"

**Interview:** Type is Story, parent is KFLUXUI-1200. Propose title: `[PipelineRuns] Add status filter to pipeline runs table`. Ask about filterable statuses and design references.

**User:** "Succeeded, Failed, Running, and Pending. Mockup: https://figma.com/file/abc123"

**Draft:**
```
## Ticket Draft

**Project:** KFLUXUI
**Type:** Story
**Title:** [PipelineRuns] Add status filter to pipeline runs table
**Priority:** Normal
**Parent:** KFLUXUI-1200

### Description
## Acceptance Criteria

- [ ] As a user, I can filter pipeline runs by status so that I can focus on runs that need attention
- [ ] As a user, I can select multiple statuses (Succeeded, Failed, Running, Pending) so that I can view combinations of results
- [ ] As a user, I can clear the status filter so that I can return to the unfiltered view
- [ ] As a user, I can see the active filter state reflected in the URL so that I can share filtered views

## Notes

- Mockup: https://figma.com/file/abc123
- Statuses to support: Succeeded, Failed, Running, Pending
- Filter should integrate with existing table toolbar alongside search
```

**Tool call after confirmation:**
```python
jira_create_issue(
    project_key="KFLUXUI",
    issue_type="Story",
    summary="[PipelineRuns] Add status filter to pipeline runs table",
    description="""## Acceptance Criteria

- [ ] As a user, I can filter pipeline runs by status so that I can focus on runs that need attention
- [ ] As a user, I can select multiple statuses (Succeeded, Failed, Running, Pending) so that I can view combinations of results
- [ ] As a user, I can clear the status filter so that I can return to the unfiltered view
- [ ] As a user, I can see the active filter state reflected in the URL so that I can share filtered views

## Notes

- Mockup: https://figma.com/file/abc123
- Statuses to support: Succeeded, Failed, Running, Pending
- Filter should integrate with existing table toolbar alongside search""",
    additional_fields='{"priority": {"name": "Normal"}, "parent": "KFLUXUI-1200"}'
)
```
