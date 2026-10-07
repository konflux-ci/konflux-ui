# Check Issues page

**Spec file:** `tests/environment-config.spec.ts`

**Describe block:** `Check Issues page`

**Implementation:** ✅ Implemented

## Purpose

Validates that the Issues page is reachable from the sidebar and renders the correct state
depending on cluster type: full page content (description, Overview/Issues tabs) against a
remote/staging cluster, versus a "service unavailable" state when running against a local
cluster where the Issues backend isn't supported.

## Scope & Assumptions

- Behavior branches on `Cypress.expose('LOCAL_CLUSTER')`, so this single test effectively
  covers two different UI states depending on the environment it runs in.

## Setup & Teardown

- None specific to this describe block.

## Test Cases

### ✅ `Navigate to Issues page from the sidebar`

- **Status:** Active
- **Purpose:** Verify the Issues page is reachable and renders the environment-appropriate
  state — populated content on a remote cluster, or a clear "unavailable" message locally.
- **Key assertions:**
  - Remote cluster: page description + both tabs are present.
  - Local cluster: service-unavailable state + title are present instead.
