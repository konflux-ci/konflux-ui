# E2E Test Code Coverage

Collect e2e test code coverage using Istanbul instrumentation and upload to Codecov.

## How It Works

1. **Build**: `webpack.instrumented.config.js` uses `babel-loader` with `babel-plugin-istanbul` to instrument the code
2. **Runtime**: Instrumented app exposes coverage via `window.__coverage__`
3. **Collection**: `@cypress/code-coverage` plugin collects data after each test into `.nyc_output/`
4. **Upload**: `coverport-cli` processes NYC data and uploads to Codecov

## Building

```bash
# Local build
yarn build:instrumented

# Docker image
docker build -f Dockerfile.instrumented -t konflux-ui:instrumented .
```

## Running Tests with Coverage

```bash
cd e2e-tests
yarn install
yarn cy:run:coverage   # headless
yarn cy:open:coverage  # interactive
```

Coverage data is saved to `e2e-tests/.nyc_output/out.json`.

## CI Integration

The PR check workflow automatically:
1. Builds the instrumented image (`pr_check.sh build`)
2. Runs e2e tests with coverage collection
3. Uploads coverage to Codecov (`pr_check.sh upload-coverage`)

Coverage upload uses `coverport-cli` which:
- Reads NYC coverage from `.nyc_output/`
- Clones the repo to remap container paths to source paths
- Generates LCOV and uploads to Codecov

## Configuration Files

| File | Purpose |
|------|---------|
| `webpack.instrumented.config.js` | Webpack config with Istanbul instrumentation |
| `Dockerfile.instrumented` | Docker build for instrumented image |
| `e2e-tests/cypress.config.ts` | Cypress config with coverage plugin |

## Troubleshooting

- **No coverage data**: Check `window.__coverage__` exists in browser console
- **Empty reports**: Ensure testing against instrumented build, not production
