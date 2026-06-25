# Single-File Lint

Lint one file without running the full repo lint pass.

## TypeScript / TSX

Basic:

```bash
yarn eslint path/to/file.ts
```

CI-equivalent flags (`.ts` and `.tsx` paths):

```bash
yarn eslint path/to/file.ts --report-unused-disable-directives --max-warnings 0
yarn eslint path/to/file.ts --config .eslintrc.restrict-imports.cjs --no-eslintrc --max-warnings 0
```

The first command matches `yarn lint:ts`; the second matches `yarn lint:restricted-imports`.

## SCSS

```bash
yarn stylelint path/to/file.scss --config .stylelintrc.json
```

## See also

- [single-file-verification.md](./single-file-verification.md) — overview
- [single-file-type-check.md](./single-file-type-check.md) — type-check one file
