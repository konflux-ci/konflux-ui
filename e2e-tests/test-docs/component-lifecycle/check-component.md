# Check Component

**Spec file:** `tests/component-lifecycle.spec.ts`

**Describe block:** `Check Component`

**Implementation:** ✅ Implemented

## Purpose

Confirms that once the build pipeline completes, the component's build outcome is correctly
reflected in the UI — both the summary status and the detailed build log — and that the
resulting container image was actually produced and is discoverable from the component page.

## Scope & Assumptions

- Depends on the on-push pipeline run completing successfully in
  [`explore-pipeline-runs-tab.md`](./explore-pipeline-runs-tab.md).
- Uses `piplinerunlogsTasks` and `pipelineConfig.logCheckTask` from the spec-level
  `pipelineConfigs` map to know which tasks/log lines to expect.

## Setup & Teardown

- None specific to this describe block.

## Test Cases

### ✅ `Check component build status and logs`

- **Status:** Active
- **Purpose:** Verify the component shows "Build completed" and that its build log contains
  all expected tasks, no failed tasks, and the expected success marker in the final task's
  log output — plus that the resulting image is visible on the component detail page.
- **Key assertions:**
  - Component status label is "Build completed".
  - Build log task list matches `piplinerunlogsTasks` with no failures.
  - The build image is present on the component detail page.
- **Notes:** The task list used for log verification is currently hardcoded per pipeline in
  the spec file rather than fetched from the cluster at runtime (flagged as a TODO in code).
