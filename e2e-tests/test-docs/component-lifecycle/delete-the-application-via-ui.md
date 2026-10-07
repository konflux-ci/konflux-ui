# Delete the application via UI

**Spec file:** `tests/component-lifecycle.spec.ts`

**Describe block:** `Delete the application via UI`

**Implementation:** ✅ Implemented

## Purpose

Validates the destructive counterpart to the whole journey: that an application can be
deleted through the UI's confirmation flow, that it actually disappears from the list, and
that the backing GitHub repository created for the test run is cleaned up afterwards — so
test runs don't leak long-lived cloud resources.

## Scope & Assumptions

- Depends on the application created at the start of the spec still existing.
- Relies on `hasTestFailed`, set by the spec-level `afterEach`, to decide whether cleanup
  should actually happen.

## Setup & Teardown

- **before:** Skips the entire describe block (`this.skip()`) if any earlier test in the
  spec failed **and** the run is a periodic/stage run (`PERIODIC_RUN_STAGE`) — preserving the
  application for debugging instead of deleting it.

## Test Cases

### ✅ `Delete the application via UI`

- **Status:** Active
- **Purpose:** Verify the full delete-application UI flow (kebab menu → confirm modal with
  typed confirmation → delete) removes the application from the list, and that the GitHub
  repository is deleted afterward as a final cleanup step.
- **Key assertions:**
  - The application row is removed from the Application List table.
- **Notes:** GitHub repo deletion is intentionally skipped when `hasTestFailed` is true, so
  the repo remains available for debugging a failure elsewhere in the spec.
