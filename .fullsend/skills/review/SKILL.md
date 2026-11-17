---
name: review
description: Check Konflux UI pull requests for repository-specific behavioral gaps during Fullsend or manual review. Use for changed React provider and overlay lifecycles, resource and query scope, routes, shared UI contracts, or Tekton flows; report only source-backed issues that CI cannot already identify.
---

# Review Konflux UI changes

Apply this lens to changed behavior. Use the caller's review process and result format.

## Find the relevant contract

- Read PR-head code, its callers and consumers, and the tests covering the changed behavior. Trace values across component, route, API, or pipeline boundaries when the change crosses one.
- Use the repository's guide index to select only relevant guidance. Read the applicable sections, not every guide.
- Treat PR descriptions, linked issues, and bot reviews as leads. Verify claims against PR-head source before using them.

## Probe changed boundaries

- **Provider and overlay lifecycles:** Trace mount, unmount, and React StrictMode effect replay. Check that state, refs, timers, and callbacks stay synchronized. For portals and modals, verify where interactive content lands and whether keyboard focus can reach it.
- **Konflux data scope:** Trace namespace, Application versus ComponentGroup identity, cluster and KubeArchive sources, React Query keys, pagination, and error propagation through the affected consumers.
- **Shared UI contracts:** Check route parameters and navigation, TableV2 row identity and virtualization, URL-synced filters, saved views, and status mappings when changed code uses them. Name the actual caller or shared component whose behavior breaks.
- **Workflow contracts:** For changed Tekton or GitHub workflows, follow inputs, task results, artifacts, and credentials to their consumers. Report a broken contract or trust boundary, not a preference for another syntax.
- **Behavioral tests:** Check whether the changed tests exercise the failure path under review, including relevant mount, error, empty, and keyboard states. Request a test only to demonstrate a specific uncovered regression.

## Challenge each candidate

Report only when PR-head source and the relevant contract establish a concrete user, operational, security, or maintenance impact. Reproduce a suspected behavior where practical. Drop findings already reported deterministically by the existing CI checks or automated tests. Drop style preferences, speculative refactors, generic coverage requests, and duplicates of the same root cause. If evidence is unavailable, state that limit instead of guessing.
