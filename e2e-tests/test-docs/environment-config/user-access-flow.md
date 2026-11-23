# User Access flow

**Spec file:** `tests/environment-config.spec.ts`

**Describe block:** `User Access flow`

**Implementation:** ✅ Implemented

## Purpose

Validates Konflux's RBAC/user-management flow: granting a role to a new user, changing
their role, and revoking access entirely — the full lifecycle an admin would go through
when managing who can access a namespace. Also includes an accessibility check
(`cy.testA11y`) on the User Access page itself.

## Scope & Assumptions

- Self-contained: generates a unique `username` per run (timestamp-suffixed) so repeated
  runs don't collide.
- Uses two fixed roles for the transition: granted as `Contributor`, changed to
  `Maintainer`.

## Setup & Teardown

- **after:** Revokes access for the generated user (`UserAccessPage.revokeAccess`) and
  verifies they no longer appear in the access list table — ensures the test user doesn't
  linger regardless of the `it()`'s outcome.

## Test Cases

### ✅ `Grant, change, and revoke user access`

- **Status:** Active
- **Purpose:** Verify an admin can grant a role to a new user, see it reflected in the access
  table, change it to a different role, and see that change reflected too.
- **Key assertions:**
  - URL matches the namespaced access-page pattern after granting access.
  - The user row reflects the granted role, then the changed role.
  - No accessibility violations on the User Access page.
