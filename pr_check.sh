#!/bin/bash

script_path="$(dirname -- "${BASH_SOURCE[0]}")"

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

    podman build -t ${KONFLUX_UI_IMAGE_REF} \
        -f Dockerfile .

    podman image save -o konflux-ui.tar ${KONFLUX_UI_IMAGE_REF}
    kind load image-archive konflux-ui.tar -n konflux

    # increase memory on device to avoid OOM killed pods during EC check
    echo "Pruning images"
    set -x
    rm konflux-ui.tar
    podman system prune --all --force
    set +x

}


run_test() {
    # default image used if test code is not changed in a PR
    TEST_IMAGE="quay.io/konflux_ui_qe/konflux-ui-tests:latest"

    # monitor memory usage during a test
    while true; do date '+%F_%H:%M:%S' >> mem.log && free -m >> mem.log; sleep 1; done 2>&1 &
    MEM_PID=$!

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
    mkdir artifacts
    echo "running tests using image ${TEST_IMAGE}"
    COMMON_SETUP="-v $PWD/artifacts:/tmp/artifacts:Z,U \
        -v $PWD/e2e-tests:/e2e:Z,U \
        --timeout=3600 \
        -e CYPRESS_PR_CHECK=true \
        -e CYPRESS_KONFLUX_BASE_URL=https://localhost:9443 \
        -e CYPRESS_USERNAME=${CYPRESS_USERNAME} \
        -e CYPRESS_PASSWORD=${CYPRESS_PASSWORD} \
        -e CYPRESS_GH_TOKEN=${CYPRESS_GH_TOKEN}"

    TEST_RUN=0
    set +e
    podman run --network host ${COMMON_SETUP} ${TEST_IMAGE}
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

    kubectl logs "$(kubectl get pods -n konflux-ui -o name | grep proxy)" --all-containers=true -n konflux-ui > "$PWD/artifacts/konflux-ui.log"

    # kill the background process monitoring memory usage
    kill $MEM_PID
    cp mem.log "$PWD/artifacts"

    echo "Exiting pr_check.sh with code $TEST_RUN"

    exit $TEST_RUN
}

if [ $# -eq 0 ]; then
    echo "Usage: $0 [build|test]"
    exit 1
fi

case "$1" in
    build)
        echo "Running build process..."
        build_ui_image
        ;;
    test)
        echo "Running test suite..."
        run_test
        ;;
    *)
        echo "Invalid argument: $1"
        echo "Usage: $0 [build|test]"
        exit 1
        ;;
esac

