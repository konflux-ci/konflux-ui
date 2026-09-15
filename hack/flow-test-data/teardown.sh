#!/usr/bin/env bash
# Remove flow visualization test resources from a namespace.
#
# Usage:
#   ./hack/flow-test-data/teardown.sh <namespace> [resource-types...]
#
# Examples:
#   ./hack/flow-test-data/teardown.sh my-ns                    # remove everything
#   ./hack/flow-test-data/teardown.sh my-ns components          # components only
#   ./hack/flow-test-data/teardown.sh my-ns nudgeconfig groups  # nudgeconfig + groups only

set -euo pipefail

NAMESPACE="${1:?Usage: $0 <namespace> [components|groups|nudgeconfig|its|all]}"
shift
RESOURCE_TYPES=("${@:-all}")

if [[ ${#RESOURCE_TYPES[@]} -eq 0 ]] || [[ "${RESOURCE_TYPES[0]}" == "all" ]]; then
  RESOURCE_TYPES=(its nudgeconfig groups components)
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config.env"

if [[ -f "${CONFIG_FILE}" ]]; then
  # shellcheck source=/dev/null
  source "${CONFIG_FILE}"
fi

echo "==> Checking oc connection..."
if ! oc whoami &>/dev/null; then
  echo "Error: Not logged in. Run 'oc login' first."
  exit 1
fi

delete_template() {
  local file="$1"
  envsubst < "${file}" | oc delete -n "${NAMESPACE}" --ignore-not-found -f -
}

should_delete() {
  local type="$1"
  for t in "${RESOURCE_TYPES[@]}"; do
    if [[ "$t" == "$type" ]]; then return 0; fi
  done
  return 1
}

# Delete in reverse dependency order
should_delete "its"         && echo "==> Removing IntegrationTestScenarios..." && delete_template "${SCRIPT_DIR}/integration-test-scenarios.yaml"
should_delete "nudgeconfig" && echo "==> Removing NudgeConfig..."             && delete_template "${SCRIPT_DIR}/nudge-config.yaml"
should_delete "groups"      && echo "==> Removing ComponentGroups..."         && delete_template "${SCRIPT_DIR}/component-groups.yaml"
should_delete "components"  && echo "==> Removing Components..."              && delete_template "${SCRIPT_DIR}/components.yaml"

echo ""
echo "==> Done! Removed from namespace '${NAMESPACE}': ${RESOURCE_TYPES[*]}"
