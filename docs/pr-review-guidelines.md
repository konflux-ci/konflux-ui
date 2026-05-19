# Konflux UI -- PR Review Guidelines

A process checklist for reviewing pull requests. For coding standards and detailed rules, see [best-practices.md](./best-practices.md).

---

## 1. Initial Checks

- [ ] **Jira link present.** "Fixes" section references a KFLUXUI issue.
- [ ] **PR template filled out.** Description, type of change, and "How to test" sections are completed -- not just placeholder comments.
- [ ] **Type of change is accurate.** The checked box matches the actual changes.
- [ ] **Screenshots for UI changes.** Any PR modifying visual output includes before/after screenshots or GIFs.
- [ ] **PR is appropriately sized.** If the diff exceeds ~400 lines, consider whether it should be split.
- [ ] **Commit messages follow conventions.** e.g., `feat(KFLUXUI-1234): add snapshot details view`.
- [ ] **No unrelated changes bundled.** Formatting fixes, refactors, or cleanups unrelated to the stated goal belong in a separate PR.

## 2. Code Quality

- [ ] **[Best practices](./best-practices.md) are followed.** Verify against the full coding standards document, paying special attention to:
  - No `as` type assertions or `any` types
  - No `useEffect` for derived state (use `useMemo`)
  - `useCallback` only where reference stability matters
  - Custom hook outputs are memoized
  - PatternFly components used over raw HTML elements
  - Absolute imports via `~/` alias
- [ ] **No `eslint-disable` comments** without a documented justification directly above. Never suppress `exhaustive-deps` or `no-explicit-any`.
- [ ] **No `console.*` calls.** Use `logger` from `~/monitoring/logger`.
- [ ] **No magic strings or numbers.** Use constants from `src/consts/` or local named constants.
- [ ] **Import boundaries respected.** Run `yarn lint:restricted-imports` to verify.
- [ ] **Dead code removed.** No commented-out code, unused imports, or unreachable branches.
- [ ] **File length under 500 lines.**

## 3. Testing

- [ ] **Tests added for new logic.** New components, hooks, and utilities have `.spec.ts(x)` files.
- [ ] **Tests cover success, error, and loading states.**
- [ ] **Semantic queries used.** `getByRole`, `getByLabelText`, `getByText` -- not `getByTestId`.
- [ ] **User interactions use `userEvent`** (with `userEvent.setup()`), not `fireEvent`.
- [ ] **Correct rendering utilities from `~/unit-test-utils/`.**
- [ ] **K8s mocks use `createK8sWatchResourceMock`.**
- [ ] **No snapshot tests.**
- [ ] **Coverage is not reduced** (project targets 80%+).

## 4. Functional Review

Skip this section if the PR has no UI changes.

- [ ] **Happy path works** as described in the PR description.
- [ ] **Error flows are graceful.** API failures show user-friendly messages.
- [ ] **Loading states present.** Async data shows spinners/skeletons, no layout shifts.
- [ ] **Empty states are informative.** Empty lists show a clear message.
- [ ] **Accessibility basics.** Keyboard navigation, alt text, visible labels, color is not sole state indicator.
- [ ] **No regressions** in related features.

## 5. Security

- [ ] **No secrets or credentials** in source files, configs, or test fixtures.
- [ ] **User input is sanitized** (project uses `sanitize-html`).
- [ ] **RBAC is respected.** Permission-gated actions use `useAccessReviewForModel`.

## 6. Final Approval

- [ ] All CI checks pass.
- [ ] No unresolved review comments.
- [ ] PR is not a draft.
- [ ] At least 2 approvals.
- [ ] New dependencies are justified and license-compatible.

---

## Quick Reference: Red Flags

| Pattern | Fix |
|---|---|
| `as SomeType` | Use type guard or fix the actual type |
| `any` | Use `unknown` + narrowing or define a type |
| `// eslint-disable` | Fix the underlying issue |
| `console.log(...)` | Use `logger` from `~/monitoring/logger` |
| `useEffect` + `setState` from props | Use `useMemo` |
| `style={{ ... }}` | Use co-located SCSS with BEM |
| `import ... from '../../../'` | Use `~/` absolute import |
| `localStorage.getItem(...)` | Use `useLocalStorage` hook |
