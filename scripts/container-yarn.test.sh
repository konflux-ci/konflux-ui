#!/bin/sh
# Behavioral checks for scripts/container-yarn. Not part of `yarn test` (Jest roots are src/).
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
wrapper="${repo_root}/scripts/container-yarn"
e2e_wrapper="${repo_root}/e2e-tests/container-yarn"
fail=0

assert_eq() {
  actual=$1
  expected=$2
  msg=$3
  if [ "${actual}" != "${expected}" ]; then
    echo "FAIL: ${msg}" >&2
    echo "  expected: ${expected}" >&2
    echo "  actual:   ${actual}" >&2
    fail=1
  else
    echo "ok: ${msg}"
  fi
}

assert_contains() {
  haystack=$1
  needle=$2
  msg=$3
  case "${haystack}" in
    *"${needle}"*) echo "ok: ${msg}" ;;
    *)
      echo "FAIL: ${msg}" >&2
      echo "  missing: ${needle}" >&2
      echo "  in: ${haystack}" >&2
      fail=1
      ;;
  esac
}

if [ ! -x "${wrapper}" ]; then
  echo "FAIL: ${wrapper} is not executable" >&2
  exit 1
fi

if ! cmp -s "${wrapper}" "${e2e_wrapper}"; then
  echo "FAIL: e2e-tests/container-yarn must match scripts/container-yarn (dual Docker build contexts)" >&2
  fail=1
else
  echo "ok: e2e wrapper matches scripts/container-yarn"
fi

tmpdir=$(mktemp -d)
trap 'rm -rf "${tmpdir}"' EXIT

write_stub() {
  path=$1
  cat > "${path}" <<'EOF'
const args = process.argv.slice(2);
process.stdout.write(`stub:${args.map((a) => JSON.stringify(a)).join(',')}\n`);
EOF
}

# 1. Current-style release filename resolves
rel1="${tmpdir}/one"
mkdir -p "${rel1}"
write_stub "${rel1}/yarn-4.12.0.cjs"
out=$(KONFLUX_YARN_RELEASES_DIR="${rel1}" "${wrapper}" --version)
assert_eq "${out}" 'stub:"--version"' "current Yarn release filename resolves"

# 2. Version bump without changing the wrapper
mv "${rel1}/yarn-4.12.0.cjs" "${rel1}/yarn-9.9.9.cjs"
out=$(KONFLUX_YARN_RELEASES_DIR="${rel1}" "${wrapper}" --version)
assert_eq "${out}" 'stub:"--version"' "simulated Yarn bump resolves without wrapper changes"

# 3. Argument boundaries
out=$(KONFLUX_YARN_RELEASES_DIR="${rel1}" "${wrapper}" install --immutable "space arg")
assert_eq "${out}" 'stub:"install","--immutable","space arg"' "arguments are forwarded with boundaries preserved"

# 4. Missing release
rel_empty="${tmpdir}/empty"
mkdir -p "${rel_empty}"
set +e
err=$(KONFLUX_YARN_RELEASES_DIR="${rel_empty}" "${wrapper}" --version 2>&1)
status=$?
set -e
assert_eq "${status}" "1" "missing Yarn release exits 1"
assert_contains "${err}" "no Yarn release found" "missing Yarn release error is explicit"

# 5. Ambiguous releases
rel_many="${tmpdir}/many"
mkdir -p "${rel_many}"
write_stub "${rel_many}/yarn-4.12.0.cjs"
write_stub "${rel_many}/yarn-4.17.0.cjs"
set +e
err=$(KONFLUX_YARN_RELEASES_DIR="${rel_many}" "${wrapper}" --version 2>&1)
status=$?
set -e
assert_eq "${status}" "1" "ambiguous Yarn releases exit 1"
assert_contains "${err}" "found more than one" "ambiguous Yarn release error is explicit"

# 6. Unset directory
set +e
err=$(KONFLUX_YARN_RELEASES_DIR= "${wrapper}" --version 2>&1)
status=$?
set -e
assert_eq "${status}" "1" "unset KONFLUX_YARN_RELEASES_DIR exits 1"
assert_contains "${err}" "KONFLUX_YARN_RELEASES_DIR is not set" "unset KONFLUX_YARN_RELEASES_DIR error is explicit"

# 7. Container files must not pin yarn-<version>.cjs (the original Renovate failure)
for f in Dockerfile Dockerfile.instrumented e2e-tests/Containerfile; do
  path="${repo_root}/${f}"
  if grep -E 'yarn-[0-9]+\.[0-9]+\.[0-9]+\.cjs' "${path}" >/dev/null; then
    echo "FAIL: ${f} still hardcodes a Yarn release filename" >&2
    fail=1
  else
    echo "ok: ${f} has no versioned yarn-*.cjs path"
  fi
  if ! grep -q 'KONFLUX_YARN_RELEASES_DIR=' "${path}"; then
    echo "FAIL: ${f} does not set KONFLUX_YARN_RELEASES_DIR" >&2
    fail=1
  else
    echo "ok: ${f} sets KONFLUX_YARN_RELEASES_DIR"
  fi
done

if [ "${fail}" -ne 0 ]; then
  echo "container-yarn tests failed" >&2
  exit 1
fi

echo "all container-yarn checks passed"
