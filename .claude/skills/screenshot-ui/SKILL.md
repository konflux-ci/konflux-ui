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

- **DO NOT delegate this skill to a subagent (Task tool).** Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_take_screenshot`, `browser_close`, `browser_hover`) are only available in the root agent's MCP context. Subagents cannot access MCP servers.
- **DO NOT loop or retry indefinitely.** If a navigation step fails twice, skip that target and move on.
- **If Playwright MCP is unavailable**, stop immediately — do not attempt a fallback. Tell the user to check that the Playwright MCP server is configured and restart Cursor if needed.
- **Only navigate to `https://localhost:8080`.** The MCP server's `--allowed-origins` flag enforces this. Never call `browser_navigate` with any other host.

## When to Use

- Before creating a PR with UI changes
- When the user asks to capture or preview UI changes visually
- As Step 4.1 of the `create-pr` skill

## Prerequisites

1. **Playwright MCP available** — configured in `.cursor/mcp.json` and `.mcp.json` via `scripts/launch_playwright_mcp.sh`. The browser runs **headless** with a persistent profile (`.playwright-mcp/profile`), so authentication cookies survive across sessions. Verify by calling `browser_snapshot`; if it errors, stop. If running using Cursor, the user also has to have it enabled in Cursor Settings.
2. **Dev server running** on `https://localhost:8080` (`yarn start`). Check:

   ```bash
   curl -sk -o /dev/null -w "%{http_code}" https://localhost:8080/
   ```

   Expect `200` or `302`. If `000`, confirm the port is bound before giving up:

   ```bash
   # Linux
   ss -tlnp 2>/dev/null | grep 8080
   # macOS (ss is not available)
   lsof -iTCP:8080 -sTCP:LISTEN 2>/dev/null
   ```

   If either command shows port 8080 is listening, proceed anyway.

## Step 1 — Find changed UI files

Run all three git diff commands and combine results:

```bash
git diff --name-only origin/main...HEAD   # committed changes on branch
git diff --name-only                       # unstaged changes
git diff --cached --name-only              # staged but not yet committed
```

Deduplicate the combined list. Keep only files that meet **all** of:

- Path is `.tsx` (not `.ts`, `.scss`, etc.)
- Under `src/components/` or `src/shared/components/`
- Does not contain `/__tests__/`, `/__mocks__/`, `.spec.`, or `.test.` in the path
- File exists on disk and contains JSX (a `<UpperCase` tag or `React.createElement`)

If no files pass the filter, report "No UI-visible changes" and stop.

## Step 2 — Analyze each changed file

For each changed UI file:

**2a. Read the diff:**

```bash
git diff origin/main...HEAD -- <file>   # committed diff
git diff -- <file>                       # unstaged diff
```

Combine both. This shows exactly what lines changed.

**2b. Read the file** to understand its component structure.

**2c. Determine the target page** by tracing imports upward:

- Search for files that import this component: `rg --files-with-matches 'from.*<basename>'`
- If the importer is in `src/routes/page-routes/`, you have found the route file — read it to understand the URL pattern.
- If the importer is another component, repeat from that file.
- Continue until you reach a route file or exhaust reasonable depth (4-5 levels). If no route is found, use the namespace overview (`/ns`) as a fallback page.

**2d. Decide whether interaction is needed** by reading the diff and file together:

- Look at where the changed lines sit in the JSX tree.
- If the changed code is **inside the body/content** of an interactive element (e.g., inside `<Popover bodyContent={...}>`, inside a `<Modal>` body, inside a `<Tooltip>` content, inside an `<ExpandableSection>` body), the content is hidden behind a user action — you need to trigger it first.
- If the changed code is **the trigger element itself** (a button label, surrounding layout, or anything visible without interaction), a full-page screenshot suffices.
- For each interactive element that needs revealing: note what action opens it (click, hover), and identify the trigger — look for a `data-test` attribute, button text, or role in the surrounding JSX.

## Step 3 — Authenticate (if needed)

The browser runs headless. Authentication cookies persist in `.playwright-mcp/profile` between runs, so most invocations skip this step entirely.

```bash
browser_navigate { "url": "https://localhost:8080/ns" }
browser_snapshot
```

- **Page shows namespace content** → already authenticated, proceed to Step 4.
- **Redirected to a login / oauth2 sign-in page** → run the headed auth flow:
  1. Call `browser_close` — this closes the headless browser and releases the profile directory lock. The MCP server stays alive.
  2. Run the auth script via Shell:

     ```bash
     bash scripts/playwright_auth.sh
     ```

     This opens a **headed** Chrome window using the same profile directory. The user completes SSO login; the window closes automatically once the redirect back to `localhost:8080` succeeds (up to 5 minutes).

  3. After the script exits, call `browser_navigate { "url": "https://localhost:8080/ns" }` again — the MCP server opens a new headless browser that picks up the cookies saved by the auth script.
  4. `browser_snapshot` to verify authentication succeeded.
  5. If still on a login page after this, stop with an error — do **not** retry the auth script.

## Step 4 — Output directory, navigate, and capture

### 4a. Create a run-specific output directory

At the **start** of Step 4 (before any screenshots), create a new directory for this run.

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
BRANCH_SLUG=$(printf '%s' "$BRANCH" | tr '/' '-')
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
OUTPUT_DIR=".screenshots/${BRANCH_SLUG}/${RUN_ID}"
mkdir -p "$OUTPUT_DIR"
```

Use `OUTPUT_DIR` for every screenshot and for `manifest.json` in this run. Example path:

`.screenshots/KFLUXUI-1247-automated-ui-screenshots/20260603T152130Z/related-pipelines-popover.png`

The timestamp folder keeps each run separate; the branch folder groups runs for the same PR branch.

### 4b. Navigate and capture

For each target page, navigate using Playwright MCP. Always call `browser_snapshot` after every action to verify the page state and find element refs.

**Navigation pattern:**

1. `browser_navigate { "url": "https://localhost:8080/ns" }` → snapshot → click first namespace in table
2. Navigate to the relevant section using sidebar links or by constructing the list URL from the namespace you just discovered (`https://localhost:8080/ns/<namespace>/applications`, etc.)
3. If the component lives on a detail page, click the first relevant row in the list
4. If the component is on a tab, find and click that tab
5. Once on the target page, snapshot to confirm content loaded

**Navigation rules:**

- Always read element refs from the snapshot — never guess or hardcode resource names.
- If a table or list is empty (no resources to click), skip this target with a note.
- If a step fails, retry once. If it fails again, skip and move to the next target.
- If still loading (spinners, skeleton screens), snapshot again. Max 2 re-snapshots per step.

**Capturing:**

After reaching the target page:

- If **no interaction is needed** (Step 2d determined a plain layout change):

  ```
  browser_take_screenshot { "type": "png", "filename": "<OUTPUT_DIR>/<label>.png", "fullPage": true }
  ```

- If **interaction is needed** (content is hidden behind a trigger):
  1. `browser_snapshot` to find the trigger element by its `data-test` attribute, role, or text
  2. Perform the action (`browser_click` for popovers/dropdowns/expandable sections, `browser_hover` for tooltips)
  3. `browser_snapshot` to confirm the element opened
  4. `browser_take_screenshot { "type": "png", "filename": "<OUTPUT_DIR>/<label>.png", "fullPage": true }`
  5. If the trigger element cannot be found after reading the snapshot carefully, take a full-page screenshot and add a note explaining what interaction was needed

Use a short descriptive `<label>` (e.g., `pipeline-run-details`, `application-list`) — not a path with slashes. Filenames do not need a timestamp prefix because the parent `RUN_ID` folder already identifies the run.

## Step 5 — Report results

1. **Summary**: number of screenshots captured, targets skipped with reasons, and the **`OUTPUT_DIR`** used for this run
2. **Screenshots**: embed each inline with paths under `OUTPUT_DIR`, e.g. `![description](.screenshots/<branch-slug>/<run-id>/<label>.png)`
3. **Interaction notes**: for any component where you opened a popover/tooltip/etc., explain what you did

Then proceed to **Step 6** to close the browser before finishing.

Write **`${OUTPUT_DIR}/manifest.json`** (one manifest per run — do not overwrite manifests from earlier runs):

```json
{
  "generatedAt": "<ISO-8601 timestamp>",
  "branch": "<git rev-parse --abbrev-ref HEAD>",
  "branchSlug": "<BRANCH_SLUG>",
  "runId": "<RUN_ID>",
  "outputDir": "<OUTPUT_DIR>",
  "screenshots": [{ "label": "...", "path": "<OUTPUT_DIR>/<label>.png", "file": "src/..." }],
  "skipped": [{ "file": "src/...", "reason": "..." }]
}
```

## Step 6 — Close browser

After **all** screenshot targets are captured or skipped and `manifest.json` is written, close the Playwright browser **before** sending the final response to the user:

```
browser_close {}
```

- Call this once at the end of the skill — do not close between individual screenshots.
- Only call if the browser was opened during this run (any `browser_navigate`, `browser_snapshot`, or screenshot call succeeded).
- Skip if the skill stopped early with no browser interaction (e.g., Playwright MCP unavailable, dev server down, no UI changes found).
- Note: `browser_close` is also called during Step 3 if auth is needed (to release the profile lock for the headed auth script). This is separate from the final close here.

## Error Handling

| Condition                     | Action                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Playwright MCP unavailable    | Stop, tell user to check MCP config                                                                                     |
| Dev server not running        | Stop, tell user to run `yarn start`                                                                                     |
| No UI changes found           | Stop cleanly, report no screenshots needed                                                                              |
| Auth required                 | `browser_close`, run `scripts/playwright_auth.sh` (headed login), re-navigate headlessly; stop if still unauthenticated |
| Page has no data (empty list) | Skip that target, continue                                                                                              |
| Target navigation fails twice | Skip, log reason, continue                                                                                              |
| Interactive element not found | Take full-page screenshot, add explanatory note                                                                         |

## Anti-patterns

1. **Do not delegate to subagents** — MCP tools are not available in subagent contexts
2. **Do not commit** `.screenshots/` or `.playwright-mcp/`
3. **Do not hardcode** namespace names, application names, or resource names — always read from snapshots
4. **Do not force screenshots** when no UI files changed
5. **Do not block PR creation** if screenshots fail — degrade gracefully
6. **Do not loop** — skip after 2 failed attempts on any step
7. **Do not use a fallback capture script** — if Playwright MCP is unavailable, stop
8. **Do not leave the browser open** — always call `browser_close` at the end of Step 6 when the skill finishes after using the browser
