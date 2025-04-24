#!/bin/bash

export NODEJS_AGENT_IMAGE=quay.io/konflux-ci/tekton-integration-catalog/sealights-nodejs:latest
script_path="$(dirname -- "${BASH_SOURCE[0]}")"

build_ui_image() {
    set -euo pipefail

    echo "Building UI from commit sha ${HEAD_SHA}"

    export IMAGE_NAME=localhost/test/test
    export IMAGE_TAG=konflux-ui
    export KONFLUX_UI_IMAGE_REF=${IMAGE_NAME}:${IMAGE_TAG}
    export TARGET_BRANCH=${TARGET_BRANCH##*/}

    # Update konflux-ui image name and tag in konflux-ci kustomize files
    local ui_kustomize_yaml_path="${script_path}/konflux-ci/konflux-ci/ui/core/kustomization.yaml"
    yq eval --inplace "del(.images[] | select(.name == \"*konflux-ui*\") | .digest)" "${ui_kustomize_yaml_path}"
    yq eval --inplace "(.images[] | select(.name == \"*konflux-ui*\")) |=.newTag=\"${IMAGE_TAG}\"" "${ui_kustomize_yaml_path}"
    yq eval --inplace "(.images[] | select(.name == \"*konflux-ui*\")) |=.newName=\"${IMAGE_NAME}\"" "${ui_kustomize_yaml_path}"

    export COMPONENT=konflux-ui
    export AGENT_VERSION
    export BSID

    AGENT_VERSION=$(podman run $NODEJS_AGENT_IMAGE /bin/sh -c 'echo ${AGENT_VERSION}')

    # Setting up Sealight builds for PRs and branches require a slighly different approaches
    # The main difference is between the config commands
    # - slnodejs config - used for reporting branch builds
    # - slnodejs prConfig - used for reporting PR builds
    # See the docs for more details https://sealights.atlassian.net/wiki/spaces/SUP/pages/1376262/SeaLights+Node.js+agent+-+Command+Reference
    if [ "${JOB_TYPE}" == "on-pr" ]; then
        podman run --network host --userns=keep-id --group-add keep-groups -v "$PWD:/konflux-ui" --workdir /konflux-ui -e NODE_DEBUG=sl \
            $NODEJS_AGENT_IMAGE \
            /bin/bash -cx "slnodejs prConfig --appName ${COMPONENT} --targetBranch ${TARGET_BRANCH} --repositoryUrl ${FORKED_REPO_URL} --latestCommit ${HEAD_SHA} --pullRequestNumber ${PR_NUMBER} --token ${SEALIGHTS_TOKEN}"
    elif [ "${JOB_TYPE}" == "periodic" ]; then
        BUILD_NAME="${HEAD_SHA}_$(date +'%y%m%d.%H%M')"
        podman run --network host --userns=keep-id --group-add keep-groups -v "$PWD:/konflux-ui" --workdir /konflux-ui -e NODE_DEBUG=sl \
            $NODEJS_AGENT_IMAGE \
            /bin/bash -cx "slnodejs config --appName ${COMPONENT} --branch ${TARGET_BRANCH} --build ${BUILD_NAME} --token ${SEALIGHTS_TOKEN}"
    else
        echo "ERROR: invalid job type '${JOB_TYPE}' specified"
    fi

    echo "$SEALIGHTS_TOKEN" > /tmp/sl-token

    BSID=$(< buildSessionId)

    podman build --build-arg BSID="${BSID}" \
        --build-arg AGENT_VERSION="${AGENT_VERSION}" \
        --secret id=sealights-credentials/token,src=/tmp/sl-token \
        -t ${KONFLUX_UI_IMAGE_REF} \
        -f Dockerfile.sealights .

    podman image save -o konflux-ui.tar ${KONFLUX_UI_IMAGE_REF}
    kind load image-archive konflux-ui.tar -n konflux
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

    TEST_STAGE_NAME=konflux-ui-e2e
    podman run --network host --userns=keep-id --group-add keep-groups -v "$PWD:/konflux-ui" --workdir /konflux-ui -e NODE_DEBUG=sl \
        $NODEJS_AGENT_IMAGE \
        /bin/bash -cx "slnodejs start --teststage ${TEST_STAGE_NAME} --buildsessionidfile buildSessionId --token ${SEALIGHTS_TOKEN}"

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

    podman run --network host --userns=keep-id --group-add keep-groups -v "$PWD/artifacts:/artifacts" --workdir /artifacts -e NODE_DEBUG=sl \
        $NODEJS_AGENT_IMAGE \
        /bin/bash -cx "slnodejs uploadReports --teststage ${TEST_STAGE_NAME} --buildsessionidfile buildSessionId --reportfile \$(ls *.xml) --token ${SEALIGHTS_TOKEN}"

    podman run --network host --userns=keep-id --group-add keep-groups -v "$PWD:/konflux-ui" --workdir /konflux-ui -e NODE_DEBUG=sl \
        $NODEJS_AGENT_IMAGE \
        /bin/bash -cx "slnodejs end --buildsessionidfile buildSessionId --token ${SEALIGHTS_TOKEN}"

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

