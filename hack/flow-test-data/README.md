# Flow Visualization Test Data

Dev-only scripts to create K8s resources for testing the flow visualization UI.
Creates the full fan-in topology: 20 components, 2 groups, nudge edges, and integration test scenarios.

## Prerequisites

- `oc` CLI authenticated to a Konflux cluster (`oc login ...`)
- CRDs installed: Component, ComponentGroup, NudgeConfig, IntegrationTestScenario
- A namespace you have write access to
- `envsubst` (comes with `gettext`, usually pre-installed on macOS/Linux)

## Configuration

Edit `config.env` to set your git repos, branches, and image registry:

```bash
# Point to your real repos for end-to-end testing
BACKEND_API_REPO="https://github.com/yourorg/backend-api"
BACKEND_API_REVISION="main"
IMAGE_REGISTRY="quay.io/yourorg"
```

Leave as `example` URLs for static resource testing (no real builds triggered).

## Usage

```bash
# Create everything
./hack/flow-test-data/setup.sh <namespace>

# Create only specific resource types
./hack/flow-test-data/setup.sh <namespace> components
./hack/flow-test-data/setup.sh <namespace> groups nudgeconfig
./hack/flow-test-data/setup.sh <namespace> its

# Tear down everything
./hack/flow-test-data/teardown.sh <namespace>

# Tear down specific types
./hack/flow-test-data/teardown.sh <namespace> nudgeconfig
```

Resource types: `components`, `groups`, `nudgeconfig`, `its`, `all` (default)

## What Gets Created

### Components (20)

| Group              | Components                                                                                                                         | Branch                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| product-grp1 (6)   | backend-api, frontend-app, worker-svc, scheduler, migration-job, cron-runner                                                       | main (cron-runner: release-v2)   |
| platform-infra (5) | auth-proxy, rate-limiter, tls-manager, cert-rotator, dns-resolver                                                                  | main                             |
| Ungrouped (9)      | operator-bundle, fbc-catalog, shared-config, logging-svc, auth-service, user-service, notification-svc, cache-proxy, data-pipeline | main (data-pipeline: release-v3) |

### ComponentGroups (2)

- **product-grp1** — 6 components, testGraph with 4 ITS in DAG order
- **platform-infra** — 5 components, no testGraph

### NudgeConfig (1 singleton)

| From                                                     | To              | Type                         |
| -------------------------------------------------------- | --------------- | ---------------------------- |
| product-grp1 (6 components)                              | operator-bundle | batched (cross-group target) |
| platform-infra (auth-proxy, rate-limiter)                | operator-bundle | batched (cross-group)        |
| logging-svc (ungrouped)                                  | operator-bundle | batched (cross-boundary)     |
| operator-bundle                                          | fbc-catalog     | immediate                    |
| platform-infra (tls-manager, cert-rotator, dns-resolver) | shared-config   | batched                      |
| auth-service                                             | user-service    | immediate (simple)           |

### IntegrationTestScenarios (4, bound to product-grp1)

| Name                | Dependencies                   | failFast |
| ------------------- | ------------------------------ | -------- |
| enterprise-contract | none (runs first)              | —        |
| integration-tests   | none (runs first)              | —        |
| e2e-tests           | integration-tests              | no       |
| release-gate        | enterprise-contract, e2e-tests | EC: yes  |

## Files

```
hack/flow-test-data/
├── config.env                       # Git repos, branches, registry (edit this)
├── setup.sh                         # Create resources
├── teardown.sh                      # Delete resources
├── components.yaml                  # 20 Component templates
├── component-groups.yaml            # 2 ComponentGroup definitions
├── nudge-config.yaml                # NudgeConfig singleton (13 edges)
├── integration-test-scenarios.yaml  # 4 ITS bound to product-grp1
└── README.md                        # This file
```
