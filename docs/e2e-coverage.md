# E2E Test Code Coverage with V8/Istanbul

This document describes how to build and use an instrumented image for collecting end-to-end (e2e) test code coverage.

## Overview

The instrumented build uses Istanbul to instrument the application code at build time. During e2e test execution, coverage data is collected via `window.__coverage__` and aggregated by the `@cypress/code-coverage` plugin.

## Building the Instrumented Image

### Local Build

```bash
# Build the instrumented version locally
yarn build:instrumented

# The instrumented files will be in the dist/ directory
```

### Docker Image

```bash
# Build the instrumented Docker image
docker build -f Dockerfile.instrumented -t konflux-ui:instrumented .
```

## Running E2E Tests with Coverage

### Prerequisites

1. Install e2e test dependencies:
   ```bash
   cd e2e-tests
   yarn install
   ```

2. Deploy the instrumented image to your test environment.

### Running Tests

```bash
# Run tests with coverage collection enabled
cd e2e-tests
yarn cy:run:coverage

# Or open Cypress UI with coverage enabled
yarn cy:open:coverage
```

### Viewing Coverage Reports

After running tests, coverage reports are generated in `e2e-tests/coverage/`:

```bash
# Generate additional report formats
cd e2e-tests
yarn coverage:report

# Open the HTML report
open coverage/lcov-report/index.html
```

## Coverage Output

The coverage plugin generates reports in multiple formats:

- **HTML** (`coverage/lcov-report/index.html`) - Interactive HTML report
- **LCOV** (`coverage/lcov.info`) - For CI/CD integration
- **JSON** (`coverage/coverage-final.json`) - Raw coverage data
- **Text** - Console summary output

## CI/CD Integration

### Using the Instrumented Image in CI

1. Build and push the instrumented image:
   ```yaml
   - name: Build instrumented image
     run: |
       docker build -f Dockerfile.instrumented -t $IMAGE_REGISTRY/konflux-ui:instrumented-$SHA .
       docker push $IMAGE_REGISTRY/konflux-ui:instrumented-$SHA
   ```

2. Deploy the instrumented image to test environment

3. Run e2e tests with coverage:
   ```yaml
   - name: Run e2e tests with coverage
     run: |
       cd e2e-tests
       yarn install
       yarn cy:run:coverage
   ```

4. Upload coverage to your coverage service (e.g., Codecov):
   ```yaml
   - name: Upload coverage
     uses: codecov/codecov-action@v4
     with:
       files: ./e2e-tests/coverage/lcov.info
       flags: e2e
   ```

## How It Works

1. **Build Time Instrumentation**: The `webpack.instrumented.config.js` uses `babel-plugin-istanbul` to add instrumentation code that tracks which lines, branches, and functions are executed.

2. **Runtime Collection**: When the instrumented application runs in the browser, it populates `window.__coverage__` with coverage data.

3. **Test Integration**: The `@cypress/code-coverage` plugin:
   - Collects `window.__coverage__` after each test
   - Merges coverage from all tests
   - Generates reports in multiple formats

## Configuration Files

| File | Purpose |
|------|---------|
| `webpack.instrumented.config.js` | Webpack config with Istanbul instrumentation |
| `Dockerfile.instrumented` | Docker build for instrumented image |
| `e2e-tests/.nycrc.json` | NYC (Istanbul CLI) configuration |
| `e2e-tests/cypress.config.ts` | Cypress config with coverage plugin |

## Troubleshooting

### No Coverage Data

- Ensure you're testing against the instrumented build
- Check that `window.__coverage__` exists in the browser console
- Verify the coverage plugin is properly registered in Cypress

### Missing Source Files in Report

- Check the `include` patterns in `.nycrc.json`
- Ensure source maps are enabled in the build

### Low Coverage Numbers

- E2E tests typically cover less code than unit tests
- Focus on critical user flows and integration points
- Use coverage data to identify untested areas for additional tests

