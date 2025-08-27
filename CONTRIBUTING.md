# Contributing to Konflux UI

Thanks for your interest in contributing to **Konflux UI**! 🎉  
This document will help you get started with contributing code, documentation, or ideas.

---

## How to Contribute

We welcome contributions of all kinds! Follow these steps to get started:

1. **Fork the repository** and create your branch from `main`.

2. Install dependencies in the root of your local repository and in the `e2e-tests` directory with `yarn install`.

3. Make sure your code builds and passes all checks:

   - Lint (`yarn lint`)
   - Type check (`yarn tsc`)
   - Tests (`yarn test`)

4. **Write or update tests**:

   - Use [Jest](https://jestjs.io/) for unit tests.
   - Add tests for new components, utility functions, or any logic added/changed.
   - When fixing bugs or refactoring code, consider whether a new test would help prevent regressions.
   - We use [Codecov](https://app.codecov.io/gh/konflux-ci/konflux-ui) to track test coverage and aim to maintain at least **80% coverage**.
   - Pull Requests that significantly reduce coverage may be asked to add more tests.
   - If your changes impact end-to-end behavior or UI flows, consider updating or adding to the e2e tests located in the `e2e-tests/` folder.  
     For guidance on contributing to e2e tests, please refer to the [e2e-tests/README.md](e2e-tests/README.md) documentation.

5. **Use feature flags when needed**:

   - If you're contributing a feature that is not yet fully implemented or will be completed in follow-up PRs, please wrap it with a feature flag.
   - Refer to our [feature flags guide](./docs/feature-flags.md) for more information.

6. Submit a Pull Request following our [PR template](.github/PULL_REQUEST_TEMPLATE.md).  
   The template includes required fields such as:

   - **Fixes**: include references to related issues, if applicable
   - **Description**: clear overview of what was changed
   - **Screenshots**: required for any UI changes
   - **How to test or reproduce**: how to verify the change

Tip: If your PR is still a work in progress and not ready for review, mark it as a draft to let others know that it's not ready for approval yet.

7. **Tag reviewers in your Pull Request**:

   - Please tag at least one or two active maintainers who are responsible for reviewing PRs.
   - You can also tag the [konflux-ui team](https://github.com/orgs/konflux-ci/teams/konflux-ui) for broader visibility if needed.
   - If you’re unsure who to tag, check recent contributors.

8. Once your PR is ready:

   - ✅ Ensure tests pass and all required checks are green.
   - ✅ Get at least **2 approvals** from reviewers.
   - ✅ Make sure there are no pending **requested changes**.

   After that, you (or someone with write access) can add the PR to the **merge queue** for merging.

Please ensure your PR is complete and clear — this helps reviewers respond faster.

---

## Development Environment

- For detailed instructions on how to build and run the project, refer to the [README](./README.md).
- We support [Dev Containers](https://containers.dev/) for a simplified setup process.
  If you're using VS Code, the project will automatically configure your environment using the files in [`.devcontainer`](./.devcontainer/). Please, refer to our [Dev Containers README](.devcontainer/README.md) for more information.

---

## Project Structure and Conventions

To keep the codebase maintainable and consistent, please follow the conventions below when contributing.

### File Structure Overview

| Folder                 | Purpose                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `src/components/`      | Feature-specific components, typically tied to a page or domain logic.                            |
| `src/shared/`          | Generic, reusable code such as components, hooks, and utilities with little to no business logic. |
| `src/hooks/`           | Custom React hooks for logic reuse (e.g. API calls).                                              |
| `src/utils/`           | Utility functions                                                                                 |
| `src/consts/`          | Shared constants, enums.                                                                          |
| `src/feature-flags/`   | Logic for managing and checking feature flags.                                                    |
| `src/routes/`          | Route definitions and related layout/wrapper logic.                                               |
| `src/types/`           | Shared TypeScript types and interfaces used across the app.                                       |
| `src/unit-test-utils/` | Testing utilities and helper functions for unit tests.                                            |
| `src/kubearchive/`     | Specific integrations and logic related to KubeArchive.                                           |

### Styling Guidelines

- Use [PatternFly](https://www.patternfly.org/) components and utility classes whenever possible.

  - ✅ Example (good):
    ```tsx
    <Button variant="primary" onClick={handleSubmit}>
      Submit
    </Button>
    ```
  - ❌ Avoid custom-styled buttons like:
    ```tsx
    <button style={{ backgroundColor: 'blue', color: 'white' }}>Submit</button>
    ```

- Avoid adding custom CSS unless strictly necessary.

- If custom styles are required:

  - ✅ **Prefer class-based styling** over inline styles:
    ```tsx
    <div className="action-menu-container">Content</div>
    ```
    ```css
    .action-menu-container {
      display: flex;
      justify-content: flex-end;
    }
    ```
  - ❌ Avoid:

    ```tsx
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>Content</div>
    ```

- ✅ **Scope styles locally and place them alongside the component**:
  - Place styles in a local SCSS module file (e.g. `MyComponent.scss`) in the same folder as the component.
  - Use clear, prefixed class names following the [BEM naming convention](https://getbem.com/naming/) to avoid conflicts and maintain modularity.

### Import Guidelines

Use absolute imports for paths under src/ whenever possible to improve readability and avoid relative paths.

- ❌ Instead of:

  ```tsx
  import { FilterContext } from '../../../components/Filter/generic/FilterContext';
  ```

- ✅ Prefer:

  ```tsx
  import { FilterContext } from '~/components/Filter/generic/FilterContext';
  ```

Commonly used aliases:

```txt
~/components
~/types
~/k8s
~/utils
```

---

## Commit Guidelines

- Use descriptive commit messages (e.g., `fix: resolve alignment issue in table header`).
- Follow [Conventional Commits](https://www.conventionalcommits.org/) if possible (e.g., `feat: add dark mode support`).

### AI Assistance in Commits

If you use AI tools (like code assistants or generators) to help with your changes, please acknowledge this by adding an `Assisted-by: <ToolName>` trailer in your commit messages.

For example: _Assisted-by: Cursor_

This helps keep contributions transparent and compliant with our policies.

---

## AI Assistance in Development

We encourage contributors to use AI tools to speed up development, but please ensure they follow the same rules as human-written code.

Our project tracks AI development guidelines in [.cursor/rules/](.cursor/rules/), which includes:

- Project structure and conventions
- Styling components
- Package management
- Feature flags workflow
- Testing best practices
- AI-assisted workflow

When using AI tools, please make sure these rules are loaded into your environment before generating code.

For example, with **Claude AI**, you can create a `CLAUDE.local.md` file that imports all the rules. When Claude starts, these rules will be auto-loaded.
Other AI tools may have different ways of configuring rules—please check their documentation.

This ensures that pull requests remain consistent with the team’s existing styles and conventions.

---

## Reporting Issues

If you find a bug or have a feature request:

- Check if it’s already reported.
- If not, [open a new issue](https://github.com/konflux-ci/konflux-ui/issues/new).
- Please include steps to reproduce, screenshots (if UI-related), and relevant logs.

---

## Questions?

Feel free to reach out via [GitHub Issues](https://github.com/konflux-ci/konflux-ui/issues).

Happy coding! 💙
