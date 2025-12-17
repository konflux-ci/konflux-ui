#!/bin/bash

script_path="$(dirname -- "${BASH_SOURCE[0]}")"


export TEST_IMAGE="quay.io/konflux_ui_qe/konflux-ui-tests:latest"

build_ui_image() {
    set -euo pipefail

    echo "Building UI from commit sha ${HEAD_SHA}"

    export IMAGE_NAME=localhost/test/test
    export IMAGE_TAG=konflux-ui
    export KONFLUX_UI_IMAGE_REF=${IMAGE_NAME}:${IMAGE_TAG}
    # if TARGET_BRANCH is not set (usually for periodic jobs), use REF_BRANCH
    if [ -z ${TARGET_BRANCH} ]; then
        TARGET_BRANCH=${REF_BRANCH}
    fi
    export TARGET_BRANCH=${TARGET_BRANCH##*/}

    # Update konflux-ui image name and tag in konflux-ci kustomize files
    local ui_kustomize_yaml_path="${script_path}/konflux-ci/konflux-ci/ui/core/kustomization.yaml"
    yq eval --inplace "del(.images[] | select(.name == \"*konflux-ui*\") | .digest)" "${ui_kustomize_yaml_path}"
    yq eval --inplace "(.images[] | select(.name == \"*konflux-ui*\")) |=.newTag=\"${IMAGE_TAG}\"" "${ui_kustomize_yaml_path}"
    yq eval --inplace "(.images[] | select(.name == \"*konflux-ui*\")) |=.newName=\"${IMAGE_NAME}\"" "${ui_kustomize_yaml_path}"

    export COMPONENT=konflux-ui

    # Build instrumented image for e2e coverage collection
    podman build -t ${KONFLUX_UI_IMAGE_REF} \
        -f Dockerfile.instrumented .

    podman image save -o konflux-ui.tar ${KONFLUX_UI_IMAGE_REF}
    kind load image-archive konflux-ui.tar -n konflux

    # increase memory on device to avoid OOM killed pods during EC check
    echo "Pruning images"
    set -x
    rm konflux-ui.tar
    podman system prune --all --force
    set +x

}

execute_test() {

    # monitor memory usage during a test
    while true; do date '+%F_%H:%M:%S' >> mem.log && free -m >> mem.log; sleep 1; done 2>&1 &
    MEM_PID=$!

    mkdir artifacts
    echo "running tests using image ${TEST_IMAGE}"
    COMMON_SETUP="-v $PWD/artifacts:/tmp/artifacts:Z,U \
        -v $PWD/e2e-tests:/e2e:Z,U \
        --timeout=3600 \
        -e CYPRESS_LOCAL_CLUSTER=${CYPRESS_LOCAL_CLUSTER} \
        -e CYPRESS_PERIODIC_RUN_STAGE=${CYPRESS_PERIODIC_RUN_STAGE} \
        -e CYPRESS_KONFLUX_BASE_URL=${CYPRESS_KONFLUX_BASE_URL} \
        -e CYPRESS_USERNAME=${CYPRESS_USERNAME} \
        -e CYPRESS_PASSWORD=${CYPRESS_PASSWORD} \
        -e CYPRESS_GH_TOKEN=${CYPRESS_GH_TOKEN} \
        -e CYPRESS_PROJECT_ID=${CYPRESS_PROJECT_ID} \
        -e CYPRESS_RECORD_KEY=${CYPRESS_RECORD_KEY}"

    RECORD_FLAG=""
    if [[ -n "${CYPRESS_PROJECT_ID}" && -n "${CYPRESS_RECORD_KEY}" ]]; then
        RECORD_FLAG="--record"
        echo "Cypress recording enabled"
    else
        echo "Cypress recording disabled (missing PROJECT_ID or RECORD_KEY)"
    fi

    case "${SUITE}" in
        "features")
            SPEC_FILE="/e2e/tests/features.spec.ts"
            ;;
        *)
            SPEC_FILE="/e2e/tests/basic-happy-path.spec.ts"
            ;;
    esac
    echo "Running tests from ${SPEC_FILE}"

    TEST_RUN=0
    set -e
    podman run --network host ${COMMON_SETUP} ${TEST_IMAGE} ${RECORD_FLAG} --spec ${SPEC_FILE}
    PODMAN_RETURN_CODE=$?
    if [[ $PODMAN_RETURN_CODE -ne 0 ]]; then
        case $PODMAN_RETURN_CODE in
            255)
                echo "Test took too long, podman exited due to timeout set to 1 hour."
                ;;
            130)
                echo "Podman run was interrupted."
                ;;
            *)
                echo "Podman exited with exit code: ${PODMAN_RETURN_CODE}"
                ;;
        esac
        TEST_RUN=1
    fi
    set +e

    kubectl logs "$(kubectl get pods -n konflux-ui -o name | grep proxy)" --all-containers=true -n konflux-ui > "$PWD/artifacts/konflux-ui.log"

    # kill the background process monitoring memory usage
    kill $MEM_PID
    cp mem.log "$PWD/artifacts"

    return $TEST_RUN
}

run_test_pr() {
    # fetch also target branch
    git fetch origin "${TARGET_BRANCH}"

    # Rebuild test image if Containerfile or entrypoint from e2e-tests was changed
    git diff --exit-code --quiet "origin/${TARGET_BRANCH}" HEAD -- e2e-tests/Containerfile || is_changed_cf=$?
    git diff --exit-code --quiet "origin/${TARGET_BRANCH}" HEAD -- e2e-tests/entrypoint.sh || is_changed_ep=$?

    if [[ ($is_changed_cf -eq 1) || ($is_changed_ep -eq 1) ]]; then
        echo "Containerfile changes detected, rebuilding test image"
        TEST_IMAGE="konflux-ui-tests:pr-$PR_NUMBER"

        cd e2e-tests
        podman build -t "$TEST_IMAGE" . -f Containerfile
        cd ..
    else
        echo "Using latest image from quay."
    fi

    export CYPRESS_LOCAL_CLUSTER=true
    export CYPRESS_PERIODIC_RUN_STAGE=false

    execute_test
    TEST_RUN=$?

    echo "Exiting pr_check.sh with code $TEST_RUN"

    exit $TEST_RUN
}

run_test_stage() {
    echo "Running test suite against stage UI and backend..."
    export CYPRESS_LOCAL_CLUSTER=false
    export CYPRESS_PERIODIC_RUN_STAGE=true

    execute_test
    TEST_RUN=$?

    exit $TEST_RUN
}

upload_coverage() {
    echo "Uploading e2e coverage to Codecov..."

    # Free up disk space before pulling coverport image
    echo "Disk space before cleanup:"
    df -h /
    echo "Pruning container images and build cache..."
    podman system prune --all --force || true
    echo "Disk space after cleanup:"
    df -h /

    # Coverage data is copied to artifacts/.nyc_output by entrypoint.sh
    local COVERAGE_DIR="artifacts/.nyc_output"

    # Check if coverage data exists
    if [ ! -d "${COVERAGE_DIR}" ]; then
        echo "No coverage data found at ${COVERAGE_DIR} - skipping upload"
        return 0
    fi

    if [ ! -f "${COVERAGE_DIR}/out.json" ]; then
        echo "No coverage file found at ${COVERAGE_DIR}/out.json - skipping upload"
        return 0
    fi

    # Check if CODECOV_TOKEN is set
    if [ -z "${CODECOV_TOKEN:-}" ]; then
        echo "CODECOV_TOKEN not set - skipping coverage upload"
        return 0
    fi

    # Get repository URL and commit SHA
    local REPO_URL="${BASE_REPO_URL:-https://github.com/konflux-ci/konflux-ui}"
    local COMMIT_SHA="${HEAD_SHA:-$(git rev-parse HEAD)}"

    echo "Repository: ${REPO_URL}"
    echo "Commit SHA: ${COMMIT_SHA}"
    echo "Coverage directory: ${COVERAGE_DIR}"

    # Create output directory for coverport with write permissions
    mkdir -p artifacts/coverport-output
    chmod 777 artifacts/coverport-output

    # Run coverport to process coverage and upload to Codecov
    # Use --user to run as current user to avoid permission issues
    podman run --rm \
        --user "$(id -u):$(id -g)" \
        -v "$PWD/${COVERAGE_DIR}:/workspace/coverage:ro,Z" \
        -v "$PWD/artifacts/coverport-output:/workspace/output:rw,Z" \
        -e CODECOV_TOKEN="${CODECOV_TOKEN}" \
        quay.io/konflux-ci/konflux-devprod/coverport-cli@sha256:bd8dc5b1048d3385d77a17954638e1b8ae1ac2236a65560612e535e5d0888e27 \
        process \
            --coverage-dir=/workspace/coverage \
            --format=nyc \
            --repo-url="${REPO_URL}" \
            --commit-sha="${COMMIT_SHA}" \
            --workspace=/workspace/output \
            --codecov-flags=e2e \
            --keep-workspace

    UPLOAD_RESULT=$?
    if [ $UPLOAD_RESULT -eq 0 ]; then
        echo "✅ Coverage uploaded to Codecov successfully"
    else
        echo "⚠️ Coverage upload failed with exit code: $UPLOAD_RESULT"
    fi

    return $UPLOAD_RESULT
}

if [ $# -eq 0 ]; then
    echo "Usage: $0 [build|test|upload-coverage]"
    exit 1
fi

case "$1" in
    build)
        echo "Running build process..."
        build_ui_image
        ;;
    test)
        echo "Running test suite..."
        run_test_pr
        ;;
    test-stage)
        run_test_stage
        ;;
    upload-coverage)
        echo "Uploading coverage..."
        upload_coverage
        ;;
    *)
        echo "Invalid argument: $1"
        echo "Usage: $0 [build|test|upload-coverage]"
        exit 1
        ;;
esac

