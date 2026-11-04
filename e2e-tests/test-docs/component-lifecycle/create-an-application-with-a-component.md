# Create an Application with a component

**Spec file:** `tests/component-lifecycle.spec.ts`

**Describe block:** `Create an Application with a component`

**Implementation:** ✅ Implemented

## Purpose

Covers the very first step of the Konflux onboarding journey: creating an Application and
importing a Component from a public GitHub repository. This is the entry point for almost
every other feature in the product, so it validates both the primary "happy path" and the
secondary UI entry points users can take to get there, plus the default integration test
that Konflux automatically provisions for a new application.

## Scope & Assumptions

- Depends on the GitHub repository created in the spec's top-level `before()`
  (`APIHelper.createRepositoryFromTemplate`) being available at `publicRepo`.
- Runs first in the spec; the application/component it creates are reused by every later
  describe block in this file.

## Setup & Teardown

- No dedicated `before`/`after` in this describe block — it relies entirely on the spec-level
  `before()`/`afterEach()` (repo creation, feature-flag reset, failure tracking).

## Test Cases

### ✅ `Create an Application with a component`

- **Status:** Active
- **Purpose:** Verify a user can create a new Application and import a Component from a
  public GitHub repo, and that the component immediately shows a build-in-progress state.
- **Key assertions:**
  - The component appears in the application's list view with status matching
    `Build not started|Build running`.

### ✅ `Check different ways to add a component`

- **Status:** Active
- **Purpose:** Verify the three different UI entry points that lead to the "add component"
  import flow all land on the same place, so users can discover it regardless of where they
  start from.
- **Key assertions:**
  - Each path navigates to a URL containing `/import?application=<applicationName>`.

### ✅ `Check default Integration Test`

- **Status:** Active
- **Purpose:** Verify that creating an application automatically provisions a default
  Enterprise Contract integration test, without any manual setup.
- **Key assertions:**
  - An integration test named `<applicationName>-enterprise-contract` exists.
