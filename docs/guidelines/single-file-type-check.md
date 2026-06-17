# Single-File Type Check

Type-check one file without a webpack build.

## One file

```bash
yarn tsc --noEmit path/to/file.ts
```

## Project-wide (preferred for path aliases)

For edits using `~/` or `@routes/` imports, a single-file `tsc` invocation may not resolve path aliases. Prefer the project-wide check (~4s, no build):

```bash
yarn type-checks
```

## See also

- [single-file-verification.md](./single-file-verification.md) — overview
- [single-file-lint.md](./single-file-lint.md) — lint one file
