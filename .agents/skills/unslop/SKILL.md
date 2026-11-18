---
name: unslop
description: Cleans generated or verbose Konflux UI code while authoring changes. Removes comments that restate code, impossible defensive checks, one-caller helpers, vague names, speculative abstractions, duplicate logic, and custom styles replaceable by PatternFly or shared components. Use while writing or editing code.
---

# Konflux UI Unslop

Clean up newly written or modified Konflux UI code before requesting review. Preserve behavior and project conventions. This is an authoring-time skill, not a PR review dimension.

## When to use

- While generating or editing Konflux UI code.
- After finishing a feature, bug fix, refactor, or test change.
- Before asking for review or opening a PR.

Do not use this skill to review someone else’s PR.

## Inputs

- Default: the current working diff.
- Optional: one or more files or directories to clean.

Always inspect the full changed files, not only the diff hunks.

## Required context

Read `docs/BOOKMARKS.md`, then open only the documents and sections relevant to the changed files before editing them.

## Cleanup checklist

Apply only to code you are currently changing.

### Remove generated-looking code

- Delete comments that merely restate the code or narrate the task. Keep comments that explain a non-obvious invariant or constraint.
- Move design history out of code comments when it does not explain current behavior.
- Delete defensive checks only when the type and runtime contract rule out the case.
- Inline one-caller helpers only when the call site becomes clearer and the helper does not mark a useful domain boundary.
- Rename vague identifiers when their meaning is unclear in context.
- Replace nested ternaries with a data map, `switch`, or extracted named condition when clearer.
- Remove commented-out code, debug logs, and unused imports.
- Remove speculative options, parameters, and abstractions with no present use, while preserving public contracts.

### Reuse existing logic

- Replace duplicated logic with an existing shared utility, hook, or component when one fits.
- Prefer `textMatch` or `filterByText` over hand-rolled filtering.
- Use `TableV2` for new list or table views; do not migrate unrelated existing tables during cleanup.
- Prefer the shared filter, saved-view, and status-registry systems over local reimplementations.
- Prefer data-driven objects or arrays over long `if`/`else` chains.
- Extract logic when it has a concrete second consumer or a clear domain boundary.
- Keep data fetching, state, presentation, styling, and side effects separable.

### Prefer PatternFly and shared components

Before keeping custom SCSS or inline styles, follow the styling decision order in `docs/guidelines/patternfly-guidelines.md`. Check relevant PatternFly v6 documentation and existing shared components for an equivalent.

Name the exact replacement before changing custom styling. If there is no equivalent, keep the style. Follow the repository's co-located SCSS, BEM, and token conventions when editing it.

## Workflow

1. Inspect the current diff and full changed files.
2. Read the required and targeted guidelines.
3. Identify concrete cleanup candidates and exclude unrelated code.
4. Apply only behavior-preserving cleanups. If a candidate changes behavior or a public contract, leave it for a separate task.
5. Re-read the full diff and changed files.
6. Run checks relevant to the touched files. Use `docs/guidelines/single-file-verification.md` for file-scoped lint and type checks, and run targeted tests when a related test exists.
7. If rendered UI behavior could have changed, inspect the affected component or route.

## Output

Report:

- files cleaned,
- categories of cleanup applied,
- evidence that behavior was preserved, or the remaining uncertainty,
- verification commands run and their results.

If no cleanup is needed, say so explicitly.
