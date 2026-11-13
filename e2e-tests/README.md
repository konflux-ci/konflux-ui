# Konflux UI Tests

Functional tests using [Cypress](https://docs.cypress.io/guides/overview/why-cypress)

## What can be found here

The important bits are as follows:

| Path                | Description                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `cypress.config.ts` | cypress configuration file, contains all the environment and plugin setup                           |
| `support`           | contains helper files for cypress, like hooks, custom commands, page objects, or plugin integration |
| `tests`             | the actual spec files reside here                                                                   |
| `test-docs`         | high-level, human-readable docs of what each spec/describe/it covers — see `test-docs/README.md`    |
| `utils`             | utilities for easier test development, from UI interaction tasks to network requests                |
| `cypress`           | test results, including screenshots, video recordings, HTML reports, xunit files, etc.              |

## Running the tests locally

Prerequisites:

- Node.js 24 or newer
- Locally installed Konflux or access to the staging Konflux

> [!NOTE]
> Currently, the tests run without any other tweaks just against the local installation of Konflux.

Certain environment variables will need to be set up. The most convenient way is to export them from the CLI, in which case they need to be prefixed with `CYPRESS_`, e.g. `USERNAME` is set as `export CYPRESS_USERNAME=username`. Alternatively, they can be passed to cypress via `-e` flag, e.g `yarn run cy:run -e USERNAME=username`.

Find the supported variables in the table below:

| Variable name        | Description                                                                                      | Required                          | Default Value                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------ |
| `KONFLUX_BASE_URL`   | The URL to the main page of Konflux                                                              | Yes                               | 'https://localhost:8080'                                                                   |
| `USERNAME`           | Signed-in account identity, also used for deployed login forms and the namespace fallback        | Yes                               | 'user2@konflux.dev'                                                                        |
| `HAC_NAMESPACE`      | An existing Kubernetes namespace accessible to the signed-in account; set explicitly for staging | Yes, unless the fallback is valid | `default-tenant` with `LOCAL_CLUSTER=true`; otherwise lowercased `USERNAME` plus `-tenant` |
| `PASSWORD`           | Password for deployed login forms                                                                | Only for automated form login     | 'password'                                                                                 |
| `LOCAL_CLUSTER`      | Use the local backend's namespace defaults; selects Dex form login unless LOGIN_PROVIDER is set  | No                                | false                                                                                      |
| `LOGIN_PROVIDER`     | Use `cli` for a signed-in local dev server, or `openshift` for a deployed OpenShift login form   | No                                | ''                                                                                         |
| `REMOVE_APP_ON_FAIL` | Clean up applications from the cluster even if tests fail                                        | No                                | false                                                                                      |
| `GH_TOKEN`           | GitHub token for network requests                                                                | Yes                               | ''                                                                                         |
| `GH_REPO_OWNER`      | GitHub username where testing repo will be pushed. GH_TOKEN must have rights there.              | Yes                               | `redhat-hac-qe`                                                                            |

With `LOGIN_PROVIDER=cli`, Cypress uses the authenticated session held by the local development server. Authentication, including any required 2FA, is completed in your browser before running the tests. Cypress does not read a login password or receive tokens. Set `USERNAME` to match the signed-in account and set `HAC_NAMESPACE` to a real namespace that account can access. The namespace fallback appends `-tenant` to the lowercased username; an email identity such as `user@example.com` would produce an invalid Kubernetes namespace. With `LOCAL_CLUSTER=true` and no `HAC_NAMESPACE` override, the default remains `default-tenant`.

### Running test from source against local Konflux UI and staging Konflux backend

This is the recommended way when either developing tests or a headed test runner is preferred.

Go to the parent directory and run `yarn install` and `yarn start` to start a local Konflux UI. The default `.env` targets staging, so you need access to staging Konflux. Follow the [local CLI authentication setup](../docs/local-cli-auth.md) for kubelogin and certificate prerequisites, then open `https://localhost:8080` in your browser and finish signing in. Keep that development server running while Cypress runs.

Once you are signed in, head to the e2e-tests folder. Run `yarn install`, set the required test variables above, and select the CLI session provider:

```bash
export CYPRESS_KONFLUX_BASE_URL=https://localhost:8080
export CYPRESS_LOGIN_PROVIDER=cli
export CYPRESS_USERNAME=your-signed-in-username
export CYPRESS_HAC_NAMESPACE=your-accessible-namespace
```

Use one of the following commands to run Cypress.

For the headed test runner:

```
$ yarn run cy:open
```

Select E2E testing and the browser of your choice (Chrome is recommended though), then launch any spec by clicking it in the list and watch as it runs.

For headless execution:

```
$ yarn run cy:run
```

Runs all available specs, by default in the Electron browser. Flags that might come in handy are `-b` to specify the browser, or `-s` to filter spec files based on a glob pattern. For example, running the default suite specs in Chrome:

```
$ yarn run cy:run -b chrome -s 'tests/component-lifecycle.spec.ts,tests/environment-config.spec.ts'
```

### Running test from source against local Konflux UI and local Konflux backend

It's possible to run the backend locally using the same scripts as are used for PR check automation. The process of Konflux backend installation and requirements is described here https://github.com/konflux-ci/konflux-ci?tab=readme-ov-file#trying-out-konflux.

First configure the local development server's upstream targets and certificate trust using [Running with Konflux-ci](../README.md#running-with-konflux-ci). Start it with `yarn start` and finish signing in at `https://localhost:8080` in your browser, as above.

Select the CLI session provider and set `LOCAL_CLUSTER=true` so the tests use the local backend's namespace defaults:

```
unset CYPRESS_HAC_NAMESPACE
export CYPRESS_LOCAL_CLUSTER=true
export CYPRESS_LOGIN_PROVIDER=cli
export CYPRESS_KONFLUX_BASE_URL=https://localhost:8080
```

Run tests with `yarn run cy:open` or another command described above. The CLI provider visits the application and waits for it to load using the existing server session; it takes precedence over the local Dex and periodic stage login flows.

When testing a deployed UI instead of `yarn start`, leave `LOGIN_PROVIDER` unset to keep the local Dex form login with `LOCAL_CLUSTER=true`, or select `LOGIN_PROVIDER=openshift` for an OpenShift login form.

### Testing login support without a cluster

The provider regression tests execute the real login hook and page helpers with isolated Cypress command doubles. They do not launch Cypress or run namespace cleanup. From the repository root, using the root development dependencies:

```bash
yarn test --roots e2e-tests --setupFilesAfterEnv --testEnvironment=node --runInBand --runTestsByPath e2e-tests/support/commands/__tests__/hooks.spec.ts
```

The unit-test CI workflow runs this command once on shard 1, without installing Cypress or connecting to a cluster.

### Running tests using the container image

The `e2e-tests` folder contains a Containerfile used for test automation.

**Containerfile** is based on the public `cypress/factory` image and installs additional dependencies required by the tests (e.g. skopeo, kubectl, cosign). It copies files from the `e2e-tests` folder so tests can be run directly from the image. Konflux builds the test image in parallel with the UI image via the `konflux-ui` component build pipeline (`.tekton/konflux-ui-*.yaml`), tagged `e2e-on-pr-<sha>` on pull requests and `e2e-<sha>` on push (same Quay repository as the UI image). Integration tests resolve the matching tag from the snapshot event type. On each push to `main`, the push pipeline also mirrors that image to the public QE tag [`quay.io/konflux_ui_qe/konflux-ui-tests:konflux`](https://quay.io/repository/konflux_ui_qe/konflux-ui-tests) via the `publish-e2e-qe-image` task (skopeo copy).

> [!NOTE]
> During a transition period, two public tags are published independently to [`quay.io/konflux_ui_qe/konflux-ui-tests`](https://quay.io/repository/konflux_ui_qe/konflux-ui-tests):
>
> - **`:latest`** — built with `podman build` and pushed by the [`.github/workflows/post-merge.yaml`](../.github/workflows/post-merge.yaml) GitHub Action on every merge to `main`. This is the current canonical tag for the manual `podman run` examples below.
> - **`:konflux`** — a mirror of the Konflux-pipeline-built image, copied by the Tekton `publish-e2e-qe-image` task (skopeo copy). Use this when you want the image that matches the Konflux build pipeline.
>
> The examples below use `:latest`. You can substitute `:konflux` if you prefer the Konflux-built mirror.

If there are no changes in your local test code, you can pull and run the image from quay, providing the required environment variables. Feel free to use docker or podman, we will be using podman in this example:

```
$ podman run -e CYPRESS_KONFLUX_BASE_URL=https://<HOSTNAME>/application-pipeline -e CYPRESS_USERNAME="username" -e CYPRESS_PASSWORD="password" quay.io/konflux_ui_qe/konflux-ui-tests:latest
```

Note that container-specific arguments like environment and mountpoints are defined before the image tag. Any arguments defined after the image tag will be interpreted as options and passed directly to Cypress.
In general, the command structure is as follows:

```
$ <container engine> run <mount points> <container environment variables> quay.io/konflux_ui_qe/konflux-ui-tests:latest <cypress arguments>
```

Since the image already contains all the test code, in case you'd like to run the tests with your local changes, you would need to mount the local code:

```
$ podman run -v <path to your e2e-tests>:/e2e:Z -e CYPRESS_KONFLUX_BASE_URL=https://<HOSTNAME>/hac/application-pipeline -e CYPRESS_USERNAME="user1" -e CYPRESS_PASSWORD="user1" quay.io/konflux_ui_qe/konflux-ui-tests:latest
```

The container entrypoint checks for a mounted `/e2e` directory and runs tests from there when present; otherwise it uses the image-baked sources at `/tmp/e2e`. This detection applies to manual container runs only — see [Tests on CI](#tests-on-ci) for how Konflux integration pipelines populate `/e2e` automatically.

#### Passing arguments to Cypress

The cypress run command can be customized using flags, as per the [documentation](https://docs.cypress.io/guides/guides/command-line#cypress-run). To pass these into the entrypoint, simply add them to the end of your container run command.

For example, we can limit what spec files will be run:

```
$ podman run -e CYPRESS_KONFLUX_BASE_URL=https://<HOSTNAME>/hac/application-pipeline quay.io/konflux_ui_qe/konflux-ui-tests:latest --spec tests/component-lifecycle.spec.ts,tests/environment-config.spec.ts
```

Or if instead of using container environment variables, you prefer to pass them directly to cypress:

```
$ podman run quay.io/konflux_ui_qe/konflux-ui-tests:latest -e KONFLUX_BASE_URL=https://<HOSTNAME>/application-pipeline
```

There is no need for the `CYPRESS` prefix this way. Passing `KONFLUX_BASE_URL` is equivalent to setting a variable in the container called `CYPRESS_KONFLUX_BASE_URL`.

Keep in mind that it is the image tag that divides the command between the container setup on its left, and the entrypoint arguments on the right (those will be passed to Cypress).

#### Accessing test results

Test artifacts (reports, screenshots, videos, etc.) are only accessible to the host system if the appropriate container folder is mounted.

When running with local test code mounted, with the `-v <path to your e2e-tests>:/e2e:Z` option, all the test artifacts are available to the host at `<path to your e2e-tests>/cypress`.

When running the container with the included test code, the test artifacts are available inside the container at `/tmp/artifacts`. Mounting the folder, the host can then access the artifacts at the `<chosen path>`:

```
$ podman run -v <chosen path>:/tmp/artifacts:Z <environment variables> quay.io/konflux_ui_qe/konflux-ui-tests:latest
```

#### Building the image

To build the image locally, navigate to this folder and run (using your favorite container runtime)

```
$ podman build -f Containerfile -t <awesome tag>
```

#### Publishing the image

The image is published automatically after a change to this folder is pushed to the main. If however, the need arises to publish it manually, you will first need access to the `quay.io/konflux_ui_qe/konflux-ui-tests` repository, ask `Katka92` (kfoniok) for rights.

Of course, we will now need to build the image with the appropriate tag and push it (after logging in):

```
$ podman build -f Containerfile -t quay.io/konflux_ui_qe/konflux-ui-tests:mytag
$ podman login -u="$USERNAME" -p="$TOKEN" quay.io
$ podman push quay.io/konflux_ui_qe/konflux-ui-tests:mytag
```

## Tests on CI

Test automation allows us to test early in the process and discover bugs before pushing code to the staging environment.

### PR checks

Cypress E2E tests run on pull requests using a [GitHub Action](https://github.com/konflux-ci/konflux-ui/blob/main/.github/workflows/pr-check.yaml). To be able to run the PR check job, you have to be a public member of `konflux-ci` organization.

The job installs Konflux from a main branch and Konflux UI from a PR. It runs tests, gathers logs, and allows users to download them directly from the GitHub Action Summary page. Retriggering the job is possible either by pushing a commit to the branch or trigger it directly in the GitHub Action Summary page by `Re-run jobs` button.

> [!IMPORTANT]
> The direct changes in the GitHub Action file `pr-check.yaml` won't be executed in a PR - that's intended due to security reasons. If you do change in this file, you should test it in your fork.
>
> This feature is caused by a trigger which is set as:
>
> ```
> on:
>   pull_request_target:
>     types: [opened, synchronize, reopened, labeled]
> ```

The workflow is separated into the actions files within `.github/actions` directory. Each action is a composite action, which makes it reusable across multiple workflows. This way it's also visible as separated steps and is easier for debugging.

The job installs Konflux from the konflux-ci main branch. Konflux UI with all the changes introduced in a PR is build into an image which is deployed on local a kind cluster (image is not pushed anywhere).

The test step executes `pr_check.sh` file which does the tests setup and runs tests. Changes made in this bash file are already propagated to the PR check run, so they can be tested directly by the PR check job. If the Containerfile is changed, the image is rebuilt (not pushed). Environment variables are set and tests are run with the test code mounted from the PR to ensure it contains a fresh code.

#### Konflux integration pipeline

Konflux also runs E2E tests via the integration pipeline (`.integration-tests/pipelines/e2e-main-pipeline.yaml`) using the `run-e2e-konflux-ui` Tekton task. `format-images` resolves the parallel build tags (`instrumented[-on-pr]-<sha>` for the UI under test, `e2e[-on-pr]-<sha>` for the Cypress runner) — SNAPSHOT's primary `containerImage` is the non-instrumented digest and is not used for deploy. `deploy-konflux` installs Konflux via the operator and injects that instrumented UI image into `deployment/proxy` (initContainer `copy-static-content`), with a pull secret so Kind can pull it. For `pr-check` jobs on **fork → upstream** PRs only, the task may overlay PR `e2e-tests/` sources:

1. **`prepare-e2e-sources` step** — Skipped for same-repo PRs (uses image-baked tests, like `pr_check.sh` on upstream). For fork → upstream PRs, fetches the PR commit from the fork and compares `e2e-tests/` against upstream `main`; stages changed files into `/e2e` when needed.
2. **`run-e2e-test` step** — If `/e2e` contains staged sources, installs dependencies and runs Cypress from `/e2e`. Otherwise uses image-baked sources at `/tmp/e2e`.

The container entrypoint performs a similar `/e2e` vs `/tmp/e2e` check for manual runs only.

### Periodic tests

Periodic tests are not in place yet.

## Reporting issues

If you find a problem with the tests, feel free to open an issue at the [Konflux-UI Jira project](https://issues.redhat.com/projects/KFLUXUI). You can set the label as `qa` to indicate it is a quality problem.
