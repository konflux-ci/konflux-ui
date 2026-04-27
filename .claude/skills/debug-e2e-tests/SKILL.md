---
name: debug-e2e-tests
description: >
  Debug e2e test failures, triage CI failures, analyze Cypress test logs,
  investigate flaky tests, diagnose test failures, check PR test results,
  why did tests fail, debug cypress, analyze test artifacts
---

# Debug E2E Tests Skill

Investigate failed Cypress e2e test runs by downloading logs and artifacts from GitHub Actions, analyzing test failures, and suggesting fixes.

## Startup

```bash
gh auth status 2>&1 | head -3 && echo "---" && gh repo view --json nameWithOwner -q .nameWithOwner
```

Expected repo: `konflux-ci/konflux-ui`

## Input

The user provides a **run URL**, **run ID**, **PR number**, or asks about "the latest failure".

- **Run URL or ID:** Extract the run ID and go to Step 2.
- **PR number:** Find the failed run first (Step 1).
- **"Latest failure":** Find the latest failed run (Step 1b).

## Workflow

### Step 1 — Find the run (PR number only)

```bash
HEAD_SHA=$(gh pr view PR_NUMBER --repo konflux-ci/konflux-ui --json headRefOid -q .headRefOid)
gh api "repos/konflux-ci/konflux-ui/actions/runs?head_sha=$HEAD_SHA&per_page=5" \
  --jq '.workflow_runs[] | {id, name, status, conclusion}'
```

### Step 1b — Find the latest failed run (no PR/run ID)

```bash
gh run list --repo konflux-ci/konflux-ui --workflow "PR Check Test" --status failure --limit 5
```

### Step 2 — Download artifacts

Single command — gets run status, downloads logs artifact, and lists files:

```bash
ARTIFACT_DIR=$(mktemp -d) && echo "ARTIFACT_DIR=$ARTIFACT_DIR" && \
gh run view RUN_ID --repo konflux-ci/konflux-ui --json status,conclusion,jobs \
  --jq '{status: .status, conclusion: .conclusion, failed_jobs: [.jobs[] | select(.conclusion == "failure") | .name], all_jobs: [.jobs[] | {name: .name, status: .status, conclusion: .conclusion}]}' && \
echo "---" && \
gh run download RUN_ID --repo konflux-ci/konflux-ui --name logs --dir "$ARTIFACT_DIR" 2>&1 && \
echo "--- artifacts:" && \
find "$ARTIFACT_DIR" -type f | sort
```

If `status` is `in_progress`, artifacts may still exist from a completed test step — proceed with analysis.

If download fails (no artifacts), fall back to: `gh run view RUN_ID --repo konflux-ci/konflux-ui --log-failed`

### Step 3 — Analyze and report

Use the artifact file list from Step 2. Analyze in priority order — stop early if root cause is clear.

**File paths:** The `find` output from Step 2 prints absolute paths — use those directly when reading files.

**Cascade awareness:** The test suite runs with `testIsolation: false` — tests within a `describe` block share state. Find the **first** failure chronologically; subsequent failures in the same block are likely cascades. Focus on the root failure only.

#### Analysis priority

1. **JUnit XML** (`junit-*.xml`) — Which tests failed, error messages, durations. Identify cascades here.
2. **Cypress log** (`cypress-log.txt`) — Full terminal output. Search for `CypressError`, `AssertionError`, or `failing` to locate the error, then read the 10-20 commands before it for context.
3. **Screenshots** (`screenshots/*.png`) — Visual state at failure. Use the Read tool.
4. **Saved DOMs** (`saved-doms/*.html`) — Check for: element not visible, error banner/modal blocking UI, loading state, logged out.
5. **Infrastructure logs** — When the failure points to backend/cluster issues:

| File                              | What to look for                                |
| --------------------------------- | ----------------------------------------------- |
| `konflux-ui.log`                  | Proxy pod logs, API routing errors              |
| `pipelinerun-res.log`             | PipelineRun status (empty = none created)       |
| `taskrun-res.log`                 | TaskRun status, Tekton-level failures           |
| `failed-pods-logs.log`            | Container failures, OOMKilled, CrashLoopBackOff (only if Warning events exist) |
| `failed-pods-definitions.yaml`    | Pod specs for failed pods (only if Warning events exist) |
| `operator-logs.log`               | Operator crashes, reconciliation errors         |
| `system-resources.log`            | Node CPU/memory pressure, disk usage            |
| `cluster-resources.log`           | Cluster-wide resource overview                  |
| `container-resources.log`         | Per-container resource usage                    |
| `mem.log`                         | Memory usage over time during test run          |
| `konflux-crs-status.log`          | Custom Resource readiness conditions            |
| `failed-deployment-event-log.log` | Deployment rollout failures                     |
| `kyverno-policy-pods.log`         | Kyverno policy violations                       |

6. **Cluster resource dumps** (`artifacts/`) — `events.json` for timing issues, `pipelineruns.json`, `components.json`. Pod logs in `artifacts/pods/` (especially build-service and PaC controller).
7. **Skip** `index.html` (mochawesome — too large to read) and `videos/*.mp4` (can't view in CLI).

#### If the failure looks like a regression

Check what code was changed: `gh pr diff PR_NUMBER --repo konflux-ci/konflux-ui`

Cross-reference: selector changes (`data-test`), API endpoint changes, component modifications.

#### Root cause categories

| Category                    | Description                                          | Where to fix     |
| --------------------------- | ---------------------------------------------------- | ---------------- |
| **A. Test code issue**      | Bad selector, missing wait, wrong assertion          | `e2e-tests/`     |
| **B. UI bug**               | Component rendering error, broken user flow          | `src/`           |
| **C. Infrastructure flake** | WebSocket drop, cluster timeout, resource exhaustion | Test resilience  |
| **D. Pipeline/backend**     | Build failure, API error, auth problem               | Backend/config   |
| **E. Cascade failure**      | Caused by an earlier test failing                    | Fix root failure |

#### Report format

```markdown
## E2E Test Failure Analysis

**Run:** [link to GH Actions run]
**PR:** [link to PR, if applicable]
**Failed tests:** X of Y (Z cascade failures)

### Root Failure
**Test:** [test name]
**Category:** [A/B/C/D/E] — [category name]
**Error:** [one-line error message]

**Analysis:**
[2-3 sentences explaining what happened and why]

**Suggested fix:**
[Concrete suggestion — file path, what to change, or "retry if flake"]

### Cascade Failures (if any)
- [test name] — caused by root failure above

### Artifacts reviewed
- [list of files that were analyzed]
```

## Common failure patterns

| Pattern                                                      | Likely cause                             | Quick check                                      |
| ------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------ |
| `Timed out retrying: cy.get() - element not found`           | Selector changed or element not rendered | Check DOM snapshot for element presence          |
| `expected X to equal Y` but values look correct              | Whitespace or timing issue               | Check if text has leading/trailing spaces        |
| `cy.get() - exceeded timeout of 40000ms`                     | Slow page load or missing element        | Check infrastructure logs for API errors         |
| `Status still running. Reloading page (0 retries remaining)` | Pipeline too slow or websocket dropped   | Check `system-resources.log` for resource issues |
| All tests after a certain point failed                       | Cascade failure                          | Find the first failure                           |
| Login-related errors in before() hook                        | Auth/cluster issue                       | Check infrastructure logs for 401/403            |
