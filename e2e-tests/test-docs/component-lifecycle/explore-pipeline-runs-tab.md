# Explore Pipeline runs Tab

**Spec file:** `tests/component-lifecycle.spec.ts`

**Describe block:** `Explore Pipeline runs Tab`

**Implementation:** ✅ Implemented

## Purpose

Validates the full build-pipeline lifecycle for a newly imported component: merging the
auto-generated PR that Konflux opens against the repo, confirming the resulting on-push
pipeline run surfaces correctly (details, node graph, logs), and confirming the on-pull
pipeline is cancelled once it's superseded, including its Enterprise Contract (EC) test
run. This is where most of the "did the CI/CD plumbing actually work" assertions live.

## Scope & Assumptions

- Depends on the application/component created in
  [`create-an-application-with-a-component.md`](./create-an-application-with-a-component.md).
- `piplinerunlogsTasks` (expected task list for the configured `pipeline`) and
  `pipelineConfig.logCheckTask` come from the spec-level `pipelineConfigs` map and drive the
  graph-node and log assertions below.

## Setup & Teardown

- **after:** Navigates back to the application via breadcrumb, so the next describe block
  starts from a known location regardless of which test ran last.

## Test Cases

### ✅ `Merge the auto-generated PR, and verify the event status on modal`

- **Status:** Active
- **Purpose:** Verify the on-pull pipeline run is visible on the component, and that merging
  the bot-authored PR is reflected correctly in the UI.
- **Key assertions:**
  - The on-pull pipeline run is visible on the component detail page before merging.
- **Notes:** Waiting for/verifying the PR-merge status in the modal is temporarily disabled
  (see KFLUXUI-766); a `cy.wait(5000)` stands in for it until the underlying issue is fixed.

### ✅ `Verify the Pipeline run details and Node Graph view`

- **Status:** Active
- **Purpose:** Verify that once merged, the on-push pipeline run's detail page shows correct
  metadata (namespace, pipeline, application, component) and that its task graph renders the
  expected nodes for the configured pipeline.
- **Key assertions:**
  - Label/value pairs on the details page match expected metadata.
  - "Related pipelines" count updates after logs are available.
  - All expected pipeline tasks are present in the Node Graph view.
- **Notes:** TaskRuns-tab assertions are commented out ("skip due to instability"); the
  Node Graph check is currently the stand-in coverage for per-task status.

### ✅ `Verify on-pull pipeline and EC`

- **Status:** Active
- **Purpose:** Verify the superseded on-pull pipeline run is cancelled, and that the
  Enterprise Contract test pipeline run (triggered by the merge) reaches a terminal state.
- **Key assertions:**
  - On-pull pipeline run status is "Cancelled".
  - EC pipeline run reaches the expected terminal status.
- **Notes:** EC checks are relaxed to accept `Failed` outside of periodic stage runs because
  of known instability running EC against a local deployment.

### ⏭️ `Verify vulnerabilities` _(skipped)_

- **Status:** Skipped — see KFLUXUI-1642.
- **Purpose:** Once re-enabled, verifies the vulnerability column/indicators on the Pipeline
  runs table for both on-push and on-pull-request runs, and the vulnerability scan detail
  view for an on-push run.
- **Key assertions:**
  - The vulnerability column exists on the Pipeline run List.
  - Vulnerability indicators for `<componentName>-on-push` match the expected
    severity-count pattern (or `-`/`N/A`).
  - The vulnerability cell is visible for `<componentName>-on-pull-request`.
  - Vulnerability scan details open for `<componentName>-on-push`.
- **Notes:** Comment in the code notes a prior false pass caused by asserting against a
  not-fully-loaded page — worth re-validating that condition when this is re-enabled.
