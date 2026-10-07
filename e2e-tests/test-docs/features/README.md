# `features.spec.ts`

## Purpose

Covers feature-flag-driven UI behavior exposed through the "Experimental Features" panel —
currently the System Notifications feature flag — verifying that toggling a flag actually
changes observable UI behavior (the notification bell/drawer in the top nav), not just the
flag's own stored state.

Unlike the other two specs, this file has a single `describe` block with no nested grouping,
and is notably written using `cy.prompt(...)`, a natural-language test step rather than
granular Cypress commands — worth keeping in mind if this spec becomes flaky, since the
underlying UI interactions aren't pinned to specific selectors in the test file itself.

## Shared setup

- None beyond the single `it()` below — it visits `KONFLUX_BASE_URL` directly rather than
  using a shared `before()` hook.

## Test groups in this spec

| Describe block        | Doc                                                  | Implementation | What it covers                                                        |
| --------------------- | ---------------------------------------------------- | -------------- | --------------------------------------------------------------------- |
| `Test Features Flags` | [`test-features-flags.md`](./test-features-flags.md) | ✅ Implemented | System Notifications feature flag → notification bell/drawer behavior |

> See [`../README.md`](../README.md#planned-vs-implemented-test-cases) for what the
> `Implementation` status means and how it's kept in sync as new, ticket-driven test cases
> land as 🧭 Planned before being built.
