# Test Features Flags

**Spec file:** `tests/features.spec.ts`

**Describe block:** `Test Features Flags`

**Implementation:** ✅ Implemented

## Purpose

Verifies that the "System Notifications" experimental feature flag, once enabled, actually
surfaces a working notification bell + drawer in the top navigation — i.e. that the feature
flag is correctly wired end-to-end into real UI behavior, not just a toggle that does
nothing.

## Scope & Assumptions

- Assumes the Experimental Features panel is reachable and defaults can be reset from it.
- Written with `cy.prompt(...)` natural-language steps instead of explicit selectors for
  most of the interaction, aside from the one direct `cy.get(featureFlagsPO.systemNotifications)`
  click.

## Setup & Teardown

- None — setup (visiting the base URL, opening Experimental Features, resetting defaults)
  happens inline inside the single `it()`.

## Test Cases

### ✅ `System Notifications`

- **Status:** Active
- **Purpose:** Verify enabling the System Notifications feature flag makes the notification
  bell in the top menu produce a working notification drawer.
- **Key assertions:**
  - A notification drawer is present on the page after clicking the bell icon.
