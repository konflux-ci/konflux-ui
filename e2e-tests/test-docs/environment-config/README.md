# `environment-config.spec.ts`

## Purpose

Covers a set of independent, "ambient" UI areas that aren't part of the application/component
build lifecycle but that most users will touch regardless of which Konflux feature they're
using: Secrets management, the Issues page, User Access (RBAC) management, and the global
Page Header controls (theme/contrast switching). Unlike `component-lifecycle.spec.ts`, these
`describe` blocks are self-contained — each creates and tears down its own fixtures and does
not depend on state from a sibling block.

The spec also carries dedicated infrastructure (not test logic per se, but worth knowing
about when reading or extending it) that captures and sanitizes network traffic via
`cy.intercept` and writes it to `cypress/network-logs/*.json` whenever a test — or the
top-level `before()` setup itself — fails, to aid debugging CI failures without leaking
credentials into artifacts.

## Shared setup

- Top-level `before()` either replays a cached SSO session (`STUDIO_MODE`) or resets feature
  flags to default (`Features.resetToDefault()`), identical in spirit to
  `component-lifecycle.spec.ts`.
- `beforeEach`/`afterEach` capture per-test network traffic and persist it only if the test
  failed, with header/URL values matching `SENSITIVE_KEY_PATTERN` redacted first.

## Test groups in this spec

| Describe block       | Doc                                                | Implementation | What it covers                                                           |
| -------------------- | -------------------------------------------------- | -------------- | ------------------------------------------------------------------------ |
| `Check Secrets Page` | [`check-secrets-page.md`](./check-secrets-page.md) | ✅ Implemented | Adding, verifying, and deleting a secret                                 |
| `Check Issues page`  | [`check-issues-page.md`](./check-issues-page.md)   | ✅ Implemented | Issues page availability, including the "no local cluster support" state |
| `User Access flow`   | [`user-access-flow.md`](./user-access-flow.md)     | ✅ Implemented | Granting, changing, and revoking a user's role                           |
| `Check Page Header`  | [`check-page-header.md`](./check-page-header.md)   | ✅ Implemented | Theme and contrast switchers in the page header                          |

> See [`../README.md`](../README.md#planned-vs-implemented-test-cases) for what the
> `Implementation` status means and how it's kept in sync as new, ticket-driven test cases
> land as 🧭 Planned before being built.
