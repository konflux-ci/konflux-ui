---
name: unslop
description: Explore Konflux UI code and the relevant guides indexed by AGENTS.md before authoring a change, then simplify the code being written. Use when planning, writing, or editing a feature, fix, refactor, or test to avoid speculative abstractions, duplicate logic, verbose comments, and unnecessary custom styling.
---

# Konflux UI Unslop

Explore existing code and guidance, choose a small approach, then clean up newly written or modified Konflux UI code before requesting review. Preserve behavior and project conventions. This is an authoring-time skill, not a PR review dimension.

## When to use

- Before generating or editing Konflux UI code.
- After finishing a feature, bug fix, refactor, or test change.
- Before asking for review or opening a PR.

Do not use this skill to review someone else’s PR.

## Inputs

- Default: the requested change and, when present, the current working diff.
- Optional: one or more files or directories to inspect or clean.

When a diff exists, inspect the full changed files, not only the diff hunks.

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

Before keeping custom SCSS or inline styles, verify that no PatternFly component, prop, utility class, token, or shared component can produce the same result.

Name the exact replacement before changing custom styling. If there is no equivalent, keep the style. Follow the repository's co-located SCSS, BEM, and token conventions when editing it.

## Workflow

1. Before editing, define the intended behavior and inspect nearby code, callers, and existing shared utilities or components.
2. Use the `Guidelines` and `Other Documentation` bookmarks in `AGENTS.md` to read only the sections relevant to the change. Verify dated guidance against current source.
3. Brainstorm the smallest plausible approaches. Choose one that fits existing contracts; surface a real tradeoff before adding an abstraction or custom style.
4. Inspect the current diff and full changed files when they exist. Identify concrete cleanup candidates and exclude unrelated code.
5. Apply only behavior-preserving cleanups. If a candidate changes behavior or a public contract, leave it for a separate task.
6. Re-read the full diff and changed files.
7. Run checks relevant to the touched files. Use `docs/guidelines/single-file-verification.md` for file-scoped lint and type checks, and run targeted tests when a related test exists.
8. If rendered UI behavior could have changed, inspect the affected component or route.

## Output

Report:

- files cleaned,
- the approach and relevant guidance used when starting before code exists,
- categories of cleanup applied,
- evidence that behavior was preserved, or the remaining uncertainty,
- verification commands run and their results.

If no cleanup is needed, say so explicitly.
