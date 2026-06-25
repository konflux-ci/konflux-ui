# Single-File Verification

Fast feedback on one changed file — no webpack build. Use `yarn` so tool versions match the repo.

## When to use

- After editing a single file and you want quick validation before committing
- When a full `yarn lint` or `yarn type-checks` run is slower than needed
- When an agent or script needs to verify only the files it touched

## Guides

| Document                                                 | Use When                                           |
| -------------------------------------------------------- | -------------------------------------------------- |
| [single-file-lint.md](./single-file-lint.md)             | Lint one `.ts`, `.tsx`, or `.scss` file            |
| [single-file-type-check.md](./single-file-type-check.md) | Type-check one file (or fall back to project-wide) |
| [unit-testing.md](./unit-testing.md)                     | Run one unit test file                             |

## CI equivalence

CI runs `yarn lint` → `yarn lint:restricted-imports` → `yarn type-checks` → `yarn test`. Single-file commands mirror subsets of those steps; use project-wide commands before opening a PR if you only ran file-scoped checks locally.
