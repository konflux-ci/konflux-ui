#!/bin/bash
args="-b chrome";
for var in "$@"
do
  args="$args $var"
done

if [ -d "/e2e" ]; then
  cd /e2e
  npm i
  npx cypress install
  chmod -R a+rwx ../e2e 
else
  cd /tmp/e2e
fi

npx cypress run $args
echo "Test run finished, dealing with artifacts..."

if [ -d "/e2e/cypress" ]; then
  echo "Cypress folder found, copying artifacts"
  cp -a /e2e/cypress/* /tmp/artifacts
  chmod -R a+rwx /tmp/artifacts
  chmod -R a+rwx /e2e/cypress
else
  echo "Copying artifacts"
  cp -a /tmp/e2e/cypress/* /tmp/artifacts
fi
