#!/bin/bash
args="-b chrome";
for var in "$@"
do
  args="$args $var"
done

if [ -d "/e2e" ]; then
  cd /e2e
  yarn install --frozen-lockfile
  yarn run cypress install
  chmod -R a+rwx ../e2e
else
  cd /tmp/e2e || exit 1
fi

npx cypress run --runner-ui $args
# yarn run cypress run $args
EXIT_CODE=$?
echo "Tests exited with code $EXIT_CODE. Archiving artifacts."

ls -la

if [ -d "/e2e/cypress" ]; then
  cp -a /e2e/cypress/* /tmp/artifacts
  chmod -R a+rwx /tmp/artifacts
  chmod -R a+rwx /e2e/cypress
  # Copy coverage data if it exists
  if [ -d "/e2e/.nyc_output" ]; then
    cp -a /e2e/.nyc_output /tmp/artifacts/
    chmod -R a+rwx /tmp/artifacts/.nyc_output
  fi
else
  cp -a /tmp/e2e/cypress/* /tmp/artifacts
fi
exit $EXIT_CODE
