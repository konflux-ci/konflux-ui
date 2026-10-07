# Check Page Header

**Spec file:** `tests/environment-config.spec.ts`

**Describe block:** `Check Page Header`

**Implementation:** ✅ Implemented

## Purpose

Validates the global page-header appearance controls — the theme switcher (System / Light /
Dark) and contrast switcher (System / Default / High) — which are available from every page
in the application and affect the whole UI's rendering, so regressions here have an
outsized blast radius relative to their visual simplicity.

## Scope & Assumptions

- Self-contained; doesn't depend on any other describe block.

## Setup & Teardown

- None specific to this describe block.

## Test Cases

### ✅ `Check Theme Switcher`

- **Status:** Active
- **Purpose:** Verify a user can switch between all theme and contrast options via the page
  header's switcher controls, confirming each transition is applied.
- **Key assertions:**
  - Each theme/contrast transition is confirmed by `ThemeSwitcher.switchTheme` /
    `ContrastSwitcher.switchContrast` before moving to the next one.
