# Konflux UI Tests
Functional tests using [Cypress](https://docs.cypress.io/guides/overview/why-cypress)

## What can be found here
The important bits are as follows:

| Path | Description |
| -- | -- |
| `cypress.config.ts` | cypress configuration file, contains all the environment and plugin setup |
| `support` | contains helper files for cypress, like hooks, custom commands, page objects, or plugin integration |
| `tests` | the actual spec files reside here |
| `utils` | utilities for easier test development, from UI interaction tasks to network requests |
| `cypress` | test results, including screenshots, video recordings, HTML reports, xunit files, etc. |

## Running the tests locally
Prerequisites:
* Nodejs (20+ version)
* Locally installed Konflux or access to the staging Konflux

> [!NOTE]
> Currently, the tests run without any other tweaks just against the local installation of Konflux.

Certain environment variables will need to be set up. The most convenient way is to export them from the CLI, in which case they need to be prefixed with `CYPRESS_`, e.g. `USERNAME` is set as `export CYPRESS_USERNAME=username`. Alternatively, they can be passed to cypress via `-e` flag, e.g `npx cypress run -e USERNAME=username`.

Find the supported variables in the table below:
| Variable name | Description | Required | Default Value |
| -- | -- | -- | -- |
| `KONFLUX_BASE_URL` | The URL to the main page of Konflux | Yes | 'https://localhost:8080' |
| `USERNAME` | Username for local Konflux | Yes | 'user2@konflux.dev' |
| `PASSWORD` | Password for local Konflux | Yes | 'password' |
| `PR_CHECK` | Assume the test is a PR check, using flow for local login | For PR checks | '' |
| `REMOVE_APP_ON_FAIL` | Clean up applications from the cluster even if tests fail | No | false |
| `GH_TOKEN` | GitHub token for network requests | Yes | '' |
| `GH_REPO_OWNER` | GitHub username where testing repo will be pushed. GH_TOKEN must have rights there. | Yes | `redhat-hac-qe` |

### Running test from source against local Konflux UI and staging Konflux backend
This is the recommended way when either developing tests or a headed test runner is preferred. 

Go to the parent directory and run `yarn install` and `yarn start` to start a local Konflux UI. Please notice that the UI is connected to the backend running on a staging environment, so you would need access to the staging Konflux. You may check by logging in here https://konflux-ui.apps.stone-stg-rh01.l2vh.p1.openshiftapps.com. 

Once Konflux UI is running locally, head to the e2e-tests folder. After running `yarn install` and setting the appropriate environment variables, use one of the following commands to run Cypress.

For the headed test runner:
```
$ npx cypress open
```
Select E2E testing and the browser of your choice (Chrome is recommended though), then launch any spec by clicking it in the list and watch as it runs.

> [!IMPORTANT]
> Once the test runs, it will require you to login manually as it requires 2FA flow for your personal account.

For headless execution:
```
$ npx cypress run
```
Runs all available specs, by default in the Electron browser. Flags that might come in handy are `-b` to specify the browser, or `-s` to filter spec files based on a glob pattern. For example, running the basic happy path spec in Chrome:
```
$ npx cypress run -b chrome -s 'tests/basic-happy-path*'
```

### Running test from source against local Konflux UI and local Konflux backend
It's possible to run the backend locally using the same scripts as are used for PR check automation. The process of Konflux backend installation and requirements is described here https://github.com/konflux-ci/konflux-ci?tab=readme-ov-file#trying-out-konflux. 

For this setup, set also `PR_CHECK` variable to `true` to enable automated login.
```
export CYPRESS_PR_CHECK=true
```

Run tests by using the command `$ npx cypress open` or pick some other way described in a previous chapter. Once tests are run, no manual interaction is needed.

### Running tests using the container image
The `e2e-tests` folder contains two Containerfiles used mainly for the test automation. 

**BaseContainerfile** is based on a Cypress image `cypress/factory` as it contains all dependencies required for the Cypress tests to run. In the BaseContainerfile we install some additional dependencies due to additional logic that needs to be performed during the tests (e.g. skopeo to check deployed image). The base image serves as a base image for building test images used in the automation. The base image should be updated just occasionally.

Image is pushed to quay.io https://quay.io/repository/konflux_ui_qe/konflux-ui-tests-base by [GitHub Action](https://github.com/konflux-ci/konflux-ui/blob/main/.github/workflows/base-test-image.yaml).

**Containerfile** is based on BaseContainerfile and contains some additional dependencies such as kubectl or cosign. It contains files from the `e2e-tests` folder so tests can be run directly from the image. It is available on quay.io https://quay.io/repository/konflux_ui_qe/konflux-ui-tests and should be updated by [GitHub Action](https://github.com/konflux-ci/konflux-ui/blob/main/.github/workflows/post-merge.yaml#L47) once PR is merged to main.

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
The entrypoint searches for any code within `/e2e` path and runs it instead of any code that was already present inside the image.

#### Passing arguments to Cypress
The cypress run command can be customized using flags, as per the [documentation](https://docs.cypress.io/guides/guides/command-line#cypress-run). To pass these into the entrypoint, simply add them to the end of your container run command.

For example, we can limit what spec files will be run:
```
$ podman run -e CYPRESS_KONFLUX_BASE_URL=https://<HOSTNAME>/hac/application-pipeline quay.io/konflux_ui_qe/konflux-ui-tests:latest --spec tests/basic-happy-path.spec.ts
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
> ```
> on:
>   pull_request_target:
>     types: [opened, synchronize, reopened, labeled]
> ```

The workflow is separated into the actions files within `.github/actions` directory. Each action is a composite action, which makes it reusable across multiple workflows. This way it's also visible as separated steps and is easier for debugging.

The job installs Konflux from the konflux-ci main branch. Konflux UI with all the changes introduced in a PR is build into an image which is deployed on local a kind cluster (image is not pushed anywhere). 

The test step executes `pr_check.sh` file which does the tests setup and runs tests. Changes made in this bash file are already propagated to the PR check run, so they can be tested directly by the PR check job. If the Containerfile is changed, the image is rebuilt (not pushed). Environment variables are set and tests are run with the test code mounted from the PR to ensure it contains a fresh code. 

### Periodic tests
Periodic tests are not in place yet. 

## Reporting issues
If you find a problem with the tests, feel free to open an issue at the [Konflux-UI Jira project](https://issues.redhat.com/projects/KFLUXUI). You can set the label as `qa` to indicate it is a quality problem.
