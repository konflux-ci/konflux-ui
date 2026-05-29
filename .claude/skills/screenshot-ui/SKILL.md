---
name: screenshot-ui
description: >
  Capture UI screenshots of changed components for PRs or testing.
  Take screenshots, screenshot UI changes, capture UI, visual diff,
  screenshot pull request changes, PR screenshots
---

# Screenshot UI Skill

Capture screenshots of UI components changed in the current branch using Playwright MCP. Optionally capture the same pages on `main` for visual comparison.

## When to Use

- Before creating a PR with UI changes
- When the user asks to capture or preview UI changes visually
- As Step 4.5 of the `create-pr` skill

## Prerequisites

1. **Dev server running** on `https://localhost:8080` (`yarn start`)
2. **Playwright MCP available** — configured in `.mcp.json`

## Flow

### Step 1 — Run static analysis

Run the analysis script to identify changed UI components and their routes:

```bash
cd scripts/screenshot-ui && npx tsx src/index.ts
```

This outputs JSON with:
- `changedUiFiles` — list of changed `.tsx` files in `src/components/` or `src/shared/components/`
- `navigationPlans` — list of routes to visit, with interaction hints

If `changedUiFiles` is empty, report "No UI-visible changes" and stop.

### Step 2 — Authenticate (if needed)

Use Playwright MCP to navigate to the dev server:

```
browser_navigate { url: "https://localhost:8080/ns" }
browser_snapshot
```

Check the snapshot:
- If the page shows namespace content (table, list, headings) — already authenticated, proceed to Step 3.
- If redirected to `/oauth2/sign_in` or a login page — tell the user:
  > "Please complete OAuth login in the browser window that Playwright opened. I'll wait and continue once you're authenticated."

  Then re-check with `browser_snapshot` until authenticated. The persistent profile will save the session for future runs.

### Step 3 — Capture current branch screenshots

For each entry in `navigationPlans`, follow the interaction hints to navigate to the correct page and take a screenshot.

**General navigation pattern:**

1. Start at `/ns` — the namespace list page:
   ```
   browser_navigate { url: "https://localhost:8080/ns" }
   browser_snapshot
   ```

2. Select a namespace — find a namespace link in the snapshot and click it:
   ```
   browser_click { ref: "<ref-from-snapshot>" }
   browser_snapshot
   ```

3. Follow interaction hints in order. For each hint:

   | Hint | Action |
   |------|--------|
   | `namespace-select` | Already done in step 2 above |
   | `sidebar-applications` | Click the "Applications" link in the navigation/sidebar |
   | `sidebar-components` | Click the "Components" link in the navigation/sidebar |
   | `sidebar-secrets` | Click the "Secrets" link in the navigation/sidebar |
   | `click-first-application` | Click the first application link in the table/list |
   | `click-first-component` | Click the first component link in the table/list |
   | `click-first-pipeline-run` | Click the first pipeline run link in the list |
   | `click-first-task-run` | Click the first task run link in the list |
   | `click-first-commit` | Click the first commit link in the list |
   | `click-first-release` | Click the first release link in the list |
   | `click-first-snapshot` | Click the first snapshot link in the list |
   | `click-first-integration-test` | Click the first integration test link in the list |
   | `click-first-release-plan` | Click the first release plan link in the list |
   | `click-tab` | Click the tab matching `tabSegment` (e.g., "Activity", "Components", "Logs") |

4. After each click, use `browser_snapshot` to verify navigation succeeded and find the next element.

5. Once at the target page, take a screenshot:
   ```
   browser_screenshot
   ```
   Save the file to `.screenshots/current/<plan-id>.png`.

**Handling empty states:**
- If after navigating you see an empty state (no resources in a table, "No items found", etc.), skip that plan with a note: "Skipped — no resources available on this page."
- Continue to the next navigation plan.

**Handling errors:**
- If a click fails or navigation leads somewhere unexpected, log the issue and continue with the next plan.
- Never block the entire capture because of one failed plan.

### Step 4 — Capture main branch screenshots (comparison)

For each navigation plan where the changed component exists on `origin/main`:

1. Check if the file exists on main:
   ```bash
   git show origin/main:<filepath> > /dev/null 2>&1
   ```
   If the file doesn't exist (new component), skip comparison for that plan.

2. Set up the worktree (once, for all comparisons):
   ```bash
   git worktree remove .worktree-main 2>/dev/null || true
   git worktree add .worktree-main origin/main
   ```

3. Check if dependencies need installing:
   ```bash
   diff <(git show HEAD:yarn.lock | md5sum) <(git show origin/main:yarn.lock | md5sum)
   ```
   - If lockfiles match: symlink or copy `node_modules` to avoid reinstall
   - If they differ: run `yarn install` in the worktree

4. Start a dev server on a different port:
   ```bash
   cd .worktree-main && yarn start --port 8081
   ```
   Wait for it to be ready (check `https://localhost:8081` responds).

5. Navigate the same routes against `https://localhost:8081` using the same flow as Step 3.
   Save screenshots to `.screenshots/main/<plan-id>.png`.

6. Clean up when done:
   ```bash
   # Kill the dev server process
   git worktree remove .worktree-main --force
   ```

**Graceful degradation for main comparison:**

| Condition | Action |
|-----------|--------|
| Component is new (doesn't exist on main) | Skip comparison, note "new component" |
| `yarn install` fails | Skip all comparisons, note the error |
| Dev server won't start on main | Skip all comparisons, note the error |
| Route doesn't exist on main | Skip that specific comparison |
| Page is empty on main | Skip that comparison |
| Worktree already exists | Remove it first, then recreate |

**Never block current-branch screenshots because main comparison fails.**

### Step 5 — Report results

Present results to the user:

1. **Summary**: number of screenshots captured (current + main), skipped targets
2. **Current branch screenshots**: embed each with `![description](path)`
3. **Comparison pairs** (where both current and main exist): show side-by-side
4. **Skipped targets**: list with reasons

Write a `manifest.json` to `.screenshots/`:
```json
{
  "generatedAt": "<ISO timestamp>",
  "branch": "<current branch name>",
  "baseRef": "origin/main",
  "screenshots": {
    "current": [
      { "planId": "...", "path": ".screenshots/current/...", "label": "..." }
    ],
    "main": [
      { "planId": "...", "path": ".screenshots/main/...", "label": "..." }
    ]
  },
  "skipped": [
    { "planId": "...", "label": "...", "reason": "..." }
  ]
}
```

## Navigation Tips

- **Use `browser_snapshot`** after every navigation action — it shows the accessibility tree with clickable refs.
- **Prefer role-based identification**: look for links, buttons, tabs, and table rows in the snapshot.
- **Don't assume element text** — read it from the snapshot. Resource names differ per user.
- **Wait for content**: if a snapshot shows loading indicators, wait briefly and snapshot again.
- **Re-use the namespace**: once you've selected a namespace, subsequent plans on the same namespace can navigate directly (e.g., `browser_navigate { url: "https://localhost:8080/ns/<namespace>/applications" }`).

## Output Structure

```
.screenshots/
  current/              # Current branch screenshots
    <plan-id>.png
    ...
  main/                 # Main branch screenshots (for comparison)
    <plan-id>.png
    ...
  manifest.json         # Metadata about the capture run
```

All outputs are gitignored.

## Error Handling Summary

| Condition | Action |
|-----------|--------|
| Dev server not running | Stop, tell user to run `yarn start` |
| No UI changes in diff | Stop cleanly, report no screenshots needed |
| Auth required | Ask user to complete OAuth in the browser |
| Page has no data | Skip that target, continue with others |
| Single plan fails | Log and continue with remaining plans |
| Main comparison fails | Continue with current-branch screenshots |
| Playwright MCP unavailable | Stop, tell user to check `.mcp.json` config |

## Anti-patterns

1. **Do not commit** `.screenshots/` or `.worktree-main/`
2. **Do not hardcode** namespace names, application names, or resource names
3. **Do not force screenshots** when no UI files changed
4. **Do not block PR creation** if screenshots fail — degrade gracefully
5. **Do not assume page structure** — always read from `browser_snapshot` results
