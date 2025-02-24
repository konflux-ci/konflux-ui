#!/bin/bash

# -------------------------------------------
# ----------- RUN UI WITH CHANGES -----------
# -------------------------------------------
echo "Running UI from commit sha ${HEAD_SHA}"
cd konflux-ui
./connect_to_local_konflux.sh
yarn install

# start the UI from the PR check in background, save logs to file
yarn start > yarn_start_logfile 2>&1 &
YARN_PID=$!

set -x

# -------------------------------------
# ----------- RUN E2E TESTS -----------
# -------------------------------------

# default image used if test code is not changed ina PR
TEST_IMAGE="quay.io/konflux_ui_qe/konflux-ui-tests:latest"

# fetch also target branch
git fetch origin ${TARGET_BRANCH}

# Rebuild test image if Containerfile or entrypoint from e2e-tests was changed 
git diff --exit-code --quiet origin/${TARGET_BRANCH} HEAD -- e2e-tests/Containerfile || is_changed_cf=$?
git diff --exit-code --quiet origin/${TARGET_BRANCH} HEAD -- e2e-tests/entrypoint.sh || is_changed_ep=$?

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
    -e CYPRESS_PR_CHECK=true \
    -e CYPRESS_KONFLUX_BASE_URL=https://localhost:8080 \
    -e CYPRESS_USERNAME=${CYPRESS_USERNAME} \
    -e CYPRESS_PASSWORD=${CYPRESS_PASSWORD} \
    -e CYPRESS_GH_TOKEN=${CYPRESS_GH_TOKEN}"

TEST_RUN=0
set +e
podman run --network host ${COMMON_SETUP} ${TEST_IMAGE} || TEST_RUN=1

# kill the background process running the UI
kill $YARN_PID
cp yarn_start_logfile $PWD/artifacts

echo "Exiting pr_check.sh with code $TEST_RUN"

cd ..
exit $TEST_RUN

