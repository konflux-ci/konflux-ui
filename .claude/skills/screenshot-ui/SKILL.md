---
name: screenshot-ui
description: >
  Capture UI screenshots of changed components for PRs or testing.
  Take screenshots, screenshot UI changes, capture UI, visual diff,
  screenshot pull request changes, PR screenshots
---

# Screenshot UI Skill

Capture screenshots of UI components changed in the current branch using Playwright MCP.

## Critical Constraints

- **DO NOT delegate this skill to a subagent (Task tool).** Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`) are only available in the root agent's MCP context. Subagents cannot access MCP servers.
- **DO NOT loop or retry indefinitely.** If a navigation step fails twice, skip that plan and move to the next.
- **DO NOT construct URLs from the `routePath` field.** The `routePath` is a route definition with parameter placeholders — it is NOT a navigable URL. Some route patterns do not match the actual URL structure (e.g. the route pattern may omit intermediate segments like `activity`). Only use the `steps` array from each navigation plan, which provides the correct sequence of goto/click actions.

## When to Use

- Before creating a PR with UI changes
- When the user asks to capture or preview UI changes visually
- As Step 4.5 of the `create-pr` skill

## Prerequisites

1. **Dev server running** on `https://localhost:8080` (`yarn start`)
2. **Playwright MCP available** — configured in `.cursor/mcp.json` and `.mcp.json` via `scripts/screenshot-ui/launch-playwright-mcp.sh` (auto-detects Chrome/Chromium, no manual path config needed)
3. **Analysis deps installed** — `scripts/screenshot-ui/node_modules/` must exist; if not: `cd scripts/screenshot-ui && yarn install`

No API keys, no Playwright browser downloads. The launcher handles browser detection automatically.

## Flow

### Step 0 — Verify dev server is running

```bash
curl -sk -o /dev/null -w "%{http_code}" https://localhost:8080/ 2>/dev/null
```

Expected: `200` or `302`. If `000`, tell the user:
> "Dev server is not running at https://localhost:8080. Start it with `yarn start` and try again."

**Important:** Do NOT use `%{redirect_url}` in the format string — it causes false negatives on some systems. Only check the status code.

If curl gives `000` but you suspect a timing issue, also check:
```bash
ss -tlnp 2>/dev/null | grep 8080
```
If port 8080 is listening, proceed anyway.

### Step 1 — Run static analysis

```bash
cd scripts/screenshot-ui && npx tsx src/index.ts
```

This outputs JSON with:
- `changedUiFiles` — changed `.tsx` files in `src/components/` or `src/shared/components/`
- `navigationPlans` — ordered steps to reach each changed component's page
- `componentAnalysis` — per-file interactive pattern detection, `data-test` attributes, and raw git diff

**Reading `componentAnalysis`** — for each changed file, you get:

```jsonc
{
  "file": "src/components/...",
  "interactivePatterns": [
    { "type": "popover", "dataTest": "related-pipelines-popover" }
  ],
  "dataTestAttributes": ["related-pipelines-popover"],
  "diff": "@@ -38,3 +38,3 @@ ..."   // what actually changed
}
```

Use `interactivePatterns` and `diff` together to decide whether you need to interact with the component before screenshotting (see Step 3).

**Stopping conditions:**
- `changedUiFiles` is empty → report "No UI-visible changes" and stop.
- `navigationPlans` is empty but `changedUiFiles` is not → the components couldn't be mapped to any route. Report this, then take one fallback screenshot of the namespace overview via MCP.

### Step 2 — Authenticate (if needed)

Playwright MCP uses a **persistent browser profile** — once you log in, the session is saved across MCP restarts. You do NOT need to close the browser window after logging in.

```
browser_navigate { "url": "https://localhost:8080/ns" }
browser_snapshot
```

Check the snapshot result:
- Page shows namespace content (table, list, headings) → already authenticated, proceed.
- Redirected to `/oauth2/sign_in` or a login page → tell the user:
  > "Please complete OAuth login in the browser window that Playwright opened. Do NOT close the browser — just log in. I'll wait and then take a snapshot to confirm."

  After the user says they logged in, call `browser_snapshot` to verify. If still on login after 2 attempts, stop and tell the user authentication failed.

### Step 3 — Capture current branch screenshots

For each `navigationPlan`, follow the `steps` array using MCP tools, then decide how to screenshot based on `componentAnalysis`.

#### 3a — Navigate to the target page

Follow the plan's `steps` array **exactly in order**. Each step has a `type`:

| Step type | MCP action |
|-----------|-----------|
| `goto` | `browser_navigate { "url": "..." }` — use the URL from the step verbatim |
| `wait` | `browser_snapshot` — if still loading, wait briefly and snapshot again |
| `act` with a hint | See the interaction hint table below |
| `screenshot` | Do NOT use the plan's screenshot step directly — see Step 3b instead |

**Interaction hint → MCP action:**

| Hint | Action |
|------|--------|
| `namespace-select` | `browser_snapshot` → find a namespace link in the table → `browser_click { "target": "<ref>" }` |
| `sidebar-applications` | `browser_snapshot` → find "Applications" sidebar link → `browser_click { "target": "<ref>" }` |
| `sidebar-components` | `browser_snapshot` → find "Components" sidebar link → `browser_click { "target": "<ref>" }` |
| `sidebar-secrets` | `browser_snapshot` → find "Secrets" sidebar link → `browser_click { "target": "<ref>" }` |
| `click-first-application` | `browser_snapshot` → click the first application row link in the table |
| `click-first-component` | `browser_snapshot` → click the first component row link |
| `click-first-pipeline-run` | `browser_snapshot` → click the first pipeline run row link |
| `click-first-task-run` | `browser_snapshot` → click the first task run row link |
| `click-first-commit` | `browser_snapshot` → click the first commit row link |
| `click-first-release` | `browser_snapshot` → click the first release row link |
| `click-first-snapshot` | `browser_snapshot` → click the first snapshot row link |
| `click-first-integration-test` | `browser_snapshot` → click the first integration test row link |
| `click-first-release-plan` | `browser_snapshot` → click the first release plan row link |
| `click-tab` | `browser_snapshot` → find the tab matching `tabSegment` → `browser_click { "target": "<ref>" }` |

**Important navigation rules:**
- **Follow the `steps` array, do not improvise URLs.** The `routePath` in the navigation plan is a route definition, not a valid URL — some routes omit intermediate path segments that are present in the actual URL. Only use URLs from `goto` steps.
- Always call `browser_snapshot` AFTER each click/navigate to verify the page changed and find refs for the next step.
- If the snapshot shows loading indicators (spinners, skeleton screens), wait a moment and snapshot again before proceeding. Max 2 re-snapshots per step.
- If a step fails (element not found, wrong page), skip this plan and continue with the next. Do NOT retry more than once.
- If a table or list is empty (no resources), skip this plan with a note: "Skipped — no resources available."
- Once a namespace is selected, subsequent plans for the same namespace can skip straight to `browser_navigate { "url": "https://localhost:8080/ns/<namespace>/applications" }` for the sidebar step — but do NOT try to construct deeper URLs.

#### 3b — Decide how to interact with the changed component

After reaching the target page, check the `componentAnalysis` for the changed file(s).

**If `interactivePatterns` is empty** — the change is purely layout/display. Take a full-page screenshot directly:
```
browser_take_screenshot { "type": "png", "filename": ".screenshots/current/<plan-id>.png", "fullPage": true }
```

**If `interactivePatterns` is non-empty** — read the `diff` field first to understand what changed:

| Pattern type | Diff touches... | Action before screenshot |
|---|---|---|
| `popover` | body content, header, link inside popover | Use `browser_snapshot` to find the trigger button/link (by `dataTest` attr or text), `browser_click` it to open the popover, then screenshot |
| `popover` | trigger button label, surrounding layout only | Full-page screenshot is sufficient; popover body is not what changed |
| `modal` | modal body, form fields inside modal | Screenshot the page as-is; add a note that the modal content requires a trigger action to view — describe what the trigger is |
| `tooltip` | tooltip content | `browser_snapshot` → find the trigger element (by `dataTest` or surrounding context in diff), `browser_hover { "target": "<ref>" }`, then screenshot |
| `expandable-section` | content inside the section | `browser_snapshot` → find and click the section toggle to expand it, then screenshot |
| `drawer` | drawer panel content | Screenshot page as-is; note that the drawer requires a separate trigger interaction |
| `dropdown` | dropdown items/options | Full-page screenshot is usually sufficient; opening a dropdown mid-capture is unreliable |

**How to locate the element in a snapshot:**
1. Use `dataTest` from `interactivePatterns` (e.g. `data-test="related-pipelines-popover"`) — search the snapshot for this value as a target ref.
2. Look at the `diff` to understand what props the trigger has (e.g. a `<Button variant="link">` with dynamic text like `"2 pipelines"`).
3. Search the snapshot for that button/link by role and approximate text.
4. If you cannot find it, take a full-page screenshot and add a note explaining what interaction was needed.

**After any interaction, always take the screenshot immediately** — do not navigate away.

#### 3c — Save the screenshot

```
browser_take_screenshot {
  "type": "png",
  "filename": ".screenshots/current/<plan-id>.png",
  "fullPage": true
}
```

The `plan-id` comes from the navigation plan's `id` field (e.g. `ns-workspacename-applications-applicationname-pipelineruns-pipelinerunname-0`).

### Step 4 — Report results

Present results to the user:

1. **Summary**: number of screenshots captured, skipped targets with reasons
2. **Current branch screenshots**: embed each with `![description](path)`
3. **Skipped targets**: list with reasons
4. **Interaction notes**: for any component where you opened a popover/tooltip/etc., explain what you did and why

Write a `manifest.json` to `.screenshots/`:
```json
{
  "generatedAt": "<ISO timestamp>",
  "branch": "<current branch name>",
  "baseRef": "origin/main",
  "screenshots": {
    "current": [
      { "planId": "...", "path": ".screenshots/current/...", "label": "..." }
    ]
  },
  "skipped": [
    { "planId": "...", "label": "...", "reason": "..." }
  ]
}
```

## Fallback: Standalone Capture Script

If Playwright MCP tools are not available (e.g. running outside Cursor, or MCP is disabled), use the standalone capture script as a fallback. It handles page-level navigation with fixed selectors but **cannot** open popovers, modals, or other interactive elements:

```bash
cd scripts/screenshot-ui && yarn capture
```

Optional args: `--base <ref>`, `--head <ref>`, `--dev-server <url>`, `--chrome-path <path>`

The script auto-detects Chrome/Chromium. To verify browser detection:
```bash
cd scripts/screenshot-ui && yarn detect-browser
```

This fallback is appropriate for:
- Quick overview screenshots of list/detail pages with no interactive components
- CI environments where no MCP context is available

## Navigation Tips

- **Use `browser_snapshot`** after every navigation action — it returns the accessibility tree with clickable `target` refs. These refs are stable within a page session.
- **Prefer role-based identification** in snapshots: look for links, buttons, tabs, and table rows.
- **Don't assume element text** — read it from the snapshot. Resource names vary per user and cluster.
- **Wait for content**: if a snapshot shows loading indicators, wait briefly and snapshot again. Max 2 re-snapshots per step.
- **Re-use the namespace**: once selected, you can navigate to `https://localhost:8080/ns/<namespace>/applications` for the applications list — but do NOT construct deeper URLs from the `routePath`.
- **Read the diff**: it tells you exactly what changed and where — whether the change is inside an interactive element or just around it.

## Output Structure

```
.screenshots/
  current/              # Current branch screenshots
    <plan-id>.png
    ...
  manifest.json         # Metadata about the capture run
```

All outputs are gitignored.

## Error Handling Summary

| Condition | Action |
|---|---|
| Dev server not running | Stop, tell user to run `yarn start` |
| No UI changes in diff | Stop cleanly, report no screenshots needed |
| Auth required | Ask user to log in in the browser (don't close it), wait, snapshot |
| Page has no data | Skip that target, continue |
| Single plan fails | Log and continue with remaining plans |
| Interactive element not found | Take full-page screenshot, add explanatory note |
| MCP unavailable | Use fallback `yarn capture` script |
| Looping/stuck on a step | Skip after 2 attempts, move to next plan |

## Anti-patterns

1. **Do not delegate to subagents** — MCP tools are not available in subagent contexts
2. **Do not commit** `.screenshots/`, `.worktree-main/`, or `.playwright-mcp/`
3. **Do not hardcode** namespace names, application names, or resource names
4. **Do not force screenshots** when no UI files changed
5. **Do not block PR creation** if screenshots fail — degrade gracefully
6. **Do not assume page structure** — always read from `browser_snapshot` results
7. **Do not loop** — if a step fails twice, skip and move on
8. **Do not use `%{redirect_url}`** in curl checks — it causes false negatives
9. **Do not skip reading the diff** — the diff is what tells you whether a popover needs to be opened
10. **Do not construct URLs from `routePath`** — route definitions differ from actual browser URLs; only follow the plan's `steps`
