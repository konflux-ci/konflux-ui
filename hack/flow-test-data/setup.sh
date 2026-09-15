#!/usr/bin/env bash
# Create flow visualization test resources in a namespace.
#
# Usage:
#   ./hack/flow-test-data/setup.sh <namespace> [resource-types...]
#
# Examples:
#   ./hack/flow-test-data/setup.sh my-ns                    # create everything
#   ./hack/flow-test-data/setup.sh my-ns components          # components only
#   ./hack/flow-test-data/setup.sh my-ns groups nudgeconfig  # groups + nudgeconfig only
#   ./hack/flow-test-data/setup.sh my-ns its                 # integration test scenarios only
#
# Resource types: components, groups, nudgeconfig, its, all (default)
#
# Configuration:
#   Edit hack/flow-test-data/config.env to set git repos, branches, and image registry.
#
# Prerequisites:
#   - oc login to a Konflux cluster
#   - CRDs installed for the resource types you're creating

set -euo pipefail

NAMESPACE="${1:?Usage: $0 <namespace> [components|groups|nudgeconfig|its|all]}"
shift
RESOURCE_TYPES=("${@:-all}")

# If no types specified, default to all
if [[ ${#RESOURCE_TYPES[@]} -eq 0 ]] || [[ "${RESOURCE_TYPES[0]}" == "all" ]]; then
  RESOURCE_TYPES=(components groups nudgeconfig its)
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.env"

# Load config
if [[ -f "${CONFIG_FILE}" ]]; then
  echo "==> Loading config from ${CONFIG_FILE}"
  # shellcheck source=/dev/null
  source "${CONFIG_FILE}"
else
  echo "Warning: ${CONFIG_FILE} not found, using defaults from YAML files."
fi

# Check oc connection
echo "==> Checking oc connection..."
if ! oc whoami &>/dev/null; then
  echo "Error: Not logged in. Run 'oc login' first."
  exit 1
fi

echo "==> Checking namespace '${NAMESPACE}' exists..."
if ! oc get namespace "${NAMESPACE}" &>/dev/null; then
  echo "Error: Namespace '${NAMESPACE}' does not exist."
  exit 1
fi

# Helper: apply with variable substitution
apply_template() {
  local file="$1"
  envsubst < "${file}" | oc apply -n "${NAMESPACE}" -f -
}

should_create() {
  local type="$1"
  for t in "${RESOURCE_TYPES[@]}"; do
    if [[ "$t" == "$type" ]]; then
      return 0
    fi
  done
  return 1
}

# Create resources based on selected types
if should_create "components"; then
  echo "==> Creating Components (20)..."
  apply_template "${SCRIPT_DIR}/components.yaml"
fi

if should_create "groups"; then
  echo "==> Creating ComponentGroups (2)..."
  apply_template "${SCRIPT_DIR}/component-groups.yaml"
fi

if should_create "nudgeconfig"; then
  echo "==> Creating NudgeConfig (singleton)..."
  apply_template "${SCRIPT_DIR}/nudge-config.yaml"
fi

if should_create "its"; then
  echo "==> Creating IntegrationTestScenarios (4)..."
  apply_template "${SCRIPT_DIR}/integration-test-scenarios.yaml"
fi

echo ""
echo "==> Done! Created in namespace '${NAMESPACE}': ${RESOURCE_TYPES[*]}"
echo ""
echo "==> Verify:"
should_create "components"  && echo "    oc get components -n ${NAMESPACE}"
should_create "groups"      && echo "    oc get componentgroups -n ${NAMESPACE}"
should_create "nudgeconfig" && echo "    oc get nudgeconfigs -n ${NAMESPACE}"
should_create "its"         && echo "    oc get integrationtestscenarios -n ${NAMESPACE}"
