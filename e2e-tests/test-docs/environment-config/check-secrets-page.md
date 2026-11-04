# Check Secrets Page

**Spec file:** `tests/environment-config.spec.ts`

**Describe block:** `Check Secrets Page`

**Implementation:** ✅ Implemented

## Purpose

Validates the core secret-management CRUD flow from the Secrets page: that a user can
create a secret, find it again through the search/filter field, inspect its key/value
contents, and delete it — and that deletion is actually reflected by the secret no longer
appearing in search results.

## Scope & Assumptions

- Self-contained: creates and deletes its own secret (`testing-secret-e2e-flow`), with no
  dependency on other describe blocks in this spec.

## Setup & Teardown

- **after:** Deletes the secret (`SecretsPage.deleteSecret`) and verifies it no longer
  appears when searched for — acting as both cleanup and an implicit assertion that deletion
  works, independent of whether the `it()` itself passed.

## Test Cases

### ✅ `Add, Verify and Delete a secret`

- **Status:** Active
- **Purpose:** Verify the end-to-end secret lifecycle through the UI: navigation, creation,
  search/filter, and value verification.
- **Key assertions:**
  - Secrets page renders its description and tab.
  - The newly created secret is found when searched for.
  - The secret's key/value match the input, with no edits applied.
