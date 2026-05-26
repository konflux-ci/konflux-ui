---
name: screenshot-ui
description: >
  Capture UI screenshots of changed components for PRs or testing.
  Take screenshots, screenshot UI changes, capture UI, visual diff,
  screenshot pull request changes, PR screenshots
---

# Screenshot UI Skill

Automatically capture screenshots of UI/UX changes on the local dev server using Stagehand browser automation.

## When to Use

- Before creating a PR with UI changes
- To test the screenshot pipeline independently
- When the user asks to capture or preview UI changes visually

## Prerequisites

1. **Dev server running** on `https://localhost:8080` (`yarn start`)
2. **Stagehand dependencies installed**: `yarn --cwd scripts/screenshot-ui install`
3. **LLM API key** in `scripts/screenshot-ui/.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```
4. **One-time authentication** (first run only):
   - Run with visible browser: `SCREENSHOT_HEADLESS=false yarn screenshot-ui`
   - Complete OAuth login (including 2FA) in the browser window
   - Session saved to `.screenshot-auth/state.json` (gitignored)

## Flow

### Step 1 — Verify prerequisites

- Check dev server responds at `https://localhost:8080`
- Check `scripts/screenshot-ui/node_modules` exists; if not, run `yarn --cwd scripts/screenshot-ui install`
- Check `OPENAI_API_KEY` is set (in `scripts/screenshot-ui/.env` or environment)

### Step 2 — Analyze the diff

Run static analysis to find UI-visible changes and map them to routes:

```bash
yarn screenshot-ui --analyze-only
```

Or invoke the analyzer programmatically via the script. The analysis:

- Reads `git diff origin/main...HEAD` (override with `--base` / `--head`)
- Filters to UI-visible `.tsx` files in `src/components/` and `src/shared/components/`
- Maps changed components to routes via `src/routes/page-routes/` imports
- Builds navigation plans with interaction hints (namespace selection, tab clicks, etc.)

If no UI-visible changes are found, stop and report.

### Step 3 — Capture screenshots

Run the full capture pipeline:

```bash
yarn screenshot-ui
```

Optional flags:

| Flag | Default | Description |
|------|---------|-------------|
| `--base` | `origin/main` | Git base ref for diff |
| `--head` | `HEAD` | Git head ref |
| `--namespace` | auto | Force a specific namespace |
| `--dev-server` | `https://localhost:8080` | Dev server URL |
| `--output` | `.screenshots/` | Output directory |
| `--headless` | `true` | Run browser headless |
| `--cache-dir` | `.screenshot-cache/` | Stagehand action cache |

First run without saved session:

```bash
SCREENSHOT_HEADLESS=false yarn screenshot-ui
```

### Step 4 — Report results

Output:

- List of captured screenshot paths under `.screenshots/`
- Namespace used
- Any skipped targets with reasons
- Path to `manifest.json` with full analysis + capture metadata

Present screenshots to the user when possible.

## Navigation Strategy

The pipeline uses a hybrid approach:

1. **Static analysis** determines *what* routes/components changed
2. **Stagehand** handles *how* to navigate:
   - Start at `/ns`, select first available namespace
   - Click sidebar items, tabs, and first resource in lists as needed
   - Interactions can occur mid-navigation, not only at the end
3. **Caching** (`.screenshot-cache/`) makes repeated runs deterministic

## Authentication

- Uses Playwright `storageState` saved to `.screenshot-auth/state.json`
- No passwords stored — only session cookies + localStorage
- Works regardless of the user's daily browser (Firefox, Chrome, etc.)
- Session expires naturally; re-run with `SCREENSHOT_HEADLESS=false` to refresh

## Outputs

```
.screenshots/
  manifest.json          # Full run metadata
  ns-workspacename-applications.png
  ...
.screenshot-auth/
  state.json             # Persisted session (gitignored)
.screenshot-cache/
  ...                    # Cached Stagehand actions (gitignored)
```

## Error Handling

| Condition | Action |
|-----------|--------|
| Dev server not running | Stop, tell user to run `yarn start` |
| No UI changes in diff | Stop, report no screenshots needed |
| Auth session expired | Prompt re-login with `SCREENSHOT_HEADLESS=false` |
| Page has no data | Skip that target, continue with others |
| Capture fails for one plan | Log warning, continue with remaining plans |

## Anti-patterns

1. **Do not commit** `.screenshot-auth/`, `.screenshots/`, or `.screenshot-cache/`
2. **Do not store credentials** in env files — only API keys for the LLM
3. **Do not force screenshots** when no UI files changed
4. **Do not block PR creation** if screenshots fail — degrade gracefully
