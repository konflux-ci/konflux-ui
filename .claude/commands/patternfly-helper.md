Build, fix, or review components using PatternFly. Use the PatternFly MCP server to ensure components follow best practices, use correct APIs, and adhere to design and accessibility guidelines.

## Inputs

- `$ARGUMENTS`: file path(s) or component name(s) to work on. If empty, ask the user what to work on.

## Steps

### 1. Read the source file(s)

- Read the file(s) provided in `$ARGUMENTS`.
- Identify all PatternFly imports: components, icons, tokens, CSS classes, and types.
- Flag any imports from deprecated paths (`@patternfly/react-core/deprecated`, `@patternfly/react-table/deprecated`).

### 2. Look up PatternFly documentation

For each PatternFly component used in the file, query the PatternFly MCP server:

1. Use `searchPatternFlyDocs` to find the component.
2. Use `usePatternFlyDocs` to fetch the documentation and JSON schema.
3. Compare the current usage against the documented API — identify incorrect props, deprecated patterns, missing accessibility attributes, or outdated component composition.

### 3. Apply changes

Follow these rules, in order of priority:

**Imports:**

- Replace any deprecated imports with their current equivalents.
- Use the correct package paths per current PatternFly docs.

**Props and API:**

- Use props and component composition as documented in the current PatternFly API.
- If a component has been restructured, update the code to use the new pattern.
- Maintain existing behavior — do not change what the component does, only how it calls PatternFly APIs.

**CSS and tokens:**

- Verify CSS semantic correctness: a token's semantic purpose must match its usage (e.g., do not use a `--pf-*-border-*` token as a `background-color`, do not use a `--pf-*-spacing-*` token as a `font-size`).
- Prefer PatternFly utility classes and tokens over custom CSS. If custom CSS duplicates what a PF class provides, replace it with the PF class.
- Do not introduce custom CSS where a PatternFly class exists.

**Accessibility:**

- Follow accessibility guidelines from the PatternFly MCP server docs.
- Ensure required ARIA attributes are present per PatternFly's component accessibility documentation.

**Do NOT:**

- Change component behavior or business logic.
- Add new features or refactor unrelated code.

### 4. Fix tests

- Find the corresponding test file(s) in the `__tests__/` sibling directory.
- Update test imports, mocks, and assertions to match any component changes.
- Run `yarn test --watchAll=false --testPathPattern=<test-file>` to verify.
- If tests fail, read the error output, fix, and re-run until they pass.

### 5. Verify

Run a final check on the changed file(s):

- `yarn type-checks` — ensure no TypeScript errors.
- `yarn lint:ts` — ensure no lint violations.

### 6. Summary

Report what was changed:

- Components updated and their file paths.
- Props or composition patterns corrected.
- CSS classes or tokens updated.
- Accessibility improvements applied.
- Tests updated and passing.
- Any manual follow-ups needed (e.g., visual verification).
