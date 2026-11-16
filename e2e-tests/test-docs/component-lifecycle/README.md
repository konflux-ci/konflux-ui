# `component-lifecycle.spec.ts`

## Purpose

This is the primary **end-to-end happy-path journey** for the core Konflux UI workflow:
create an Application, add a Component backed by a real GitHub repository, let the build
pipelines run, verify the results surface correctly in the UI (pipeline runs, logs, graph
view, build image, Enterprise Contract), and finally clean everything up. It exercises the
full "import a component → build → verify → delete" loop that most other features (secrets,
integration tests, deployments) sit on top of, so a failure here usually indicates a
regression in a foundational flow rather than an edge case.

The suite is written as a single ordered narrative — later `describe` blocks assume the
application/component created in the first one still exists — rather than independent,
isolated test cases.

## Shared state & setup

- `applicationName` / `componentName` / `repoName` are generated once per run
  (`Common.generateAppName`) and reused across every `describe` block below.
- A real GitHub repository is created from a template (`APIHelper.createRepositoryFromTemplate`)
  in the top-level `before()`, and deleted again in the final describe block.
- `pipeline` (`docker-build-oci-ta` or `-min`) is read from the Cypress environment and drives
  which build-pipeline task list (`pipelineConfigs`) is expected to appear in pipeline runs/logs.
- In `STUDIO_MODE`, setup instead replays a cached SSO session against `KONFLUX_BASE_URL`
  rather than creating fresh fixtures.
- `hasTestFailed` is tracked via `afterEach` across the whole file: if any test fails, the
  final "Delete the application via UI" describe skips cleanup so the app/repo are preserved
  for debugging (only enforced on the periodic/stage run).

## Test groups in this spec

| Describe block                           | Doc                                                                                        | Implementation | What it covers                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `Create an Application with a component` | [`create-an-application-with-a-component.md`](./create-an-application-with-a-component.md) | ✅ Implemented | Creating the Application + Component, alternate "add component" entry points, default integration test        |
| `Explore Pipeline runs Tab`              | [`explore-pipeline-runs-tab.md`](./explore-pipeline-runs-tab.md)                           | ✅ Implemented | Auto-generated PR merge, pipeline run details/graph, on-pull pipeline + EC, vulnerability reporting (skipped) |
| `Check Component`                        | [`check-component.md`](./check-component.md)                                               | ✅ Implemented | Build status, build logs, deployed image                                                                      |
| `Delete the application via UI`          | [`delete-the-application-via-ui.md`](./delete-the-application-via-ui.md)                   | ✅ Implemented | Cleanup: deleting the Application via UI + the backing GitHub repo                                            |

> See [`../README.md`](../README.md#planned-vs-implemented-test-cases) for what the
> `Implementation` status means and how it's kept in sync as new, ticket-driven test cases
> land as 🧭 Planned before being built.
