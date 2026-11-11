# Explore Commits Tab

**Spec file:** `tests/component-lifecycle.spec.ts`

**Describe block:** `Explore Commits Tab`

**Implementation:** ✅ Implemented

## Purpose

Validates that the commit created by merging the auto-generated PR surfaces correctly in
the Commits UI: the application Activity → Latest commits list and details page, and the
component Activity → Commits list and details page. This guards regressions in commit list
rendering, navigation into commit details, and the commit overview metadata/graph.

## Scope & Assumptions

- Depends on the application/component created in
  [`create-an-application-with-a-component.md`](./create-an-application-with-a-component.md).
- Depends on the PR merge (`firstCommit`) and settled pipeline runs from
  [`explore-pipeline-runs-tab.md`](./explore-pipeline-runs-tab.md). Placed after that
  describe so the commit row and status are stable.
- Commit SHA is exposed from the merge API response as `firstCommit_SHA`.

## Setup & Teardown

- **after:** Navigates back to the application via breadcrumb, so the next describe block
  starts from a known location regardless of which test ran last.

## Test Cases

### ✅ `Verify commits from Activity tabs`

- **Status:** Active
- **Purpose:** Verify the merge commit appears in both Activity entry points and that its
  details page shows expected metadata and overview graph nodes.
- **Key assertions:**
  - From application Activity → Latest commits, Commit List shows `firstCommit` with
    branch `main`, the component name, the GitHub username, and status Succeeded.
  - Clicking the commit opens details: title includes `firstCommit` with Succeeded status,
    Commit SHA label/link matches `firstCommit_SHA`, Branch is `main`, Component matches,
    and overview graph shows `commit` and `<componentName>-build` nodes.
  - From component Activity → Commits, the same `firstCommit` row is visible; opening it
    again reaches the commit details page with matching title/status and Commit SHA link.
