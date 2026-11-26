#!/bin/sh
# Runs the mocked Playwright suite in the pinned Playwright image and, by
# default, rewrites the screenshot baselines that changed.
#
#   .cloud/scripts/e2e-baselines.sh            update changed baselines and
#                                              aria snapshots
#   .cloud/scripts/e2e-baselines.sh --check    compare only, fail on any
#                                              failure or diff
#   .cloud/scripts/e2e-baselines.sh -- <args>  extra Playwright arguments
#
# E2E_ALL_BROWSERS=1 adds the firefox and webkit projects, e.g.
#   E2E_ALL_BROWSERS=1 .cloud/scripts/e2e-baselines.sh --check -- --project=firefox --project=webkit
#
# Needs Docker. Run from anywhere; it works on the frontend checkout that
# holds this script. The checkout is copied into the container, so the host's
# node_modules and lockfile are never touched; only e2e/*-snapshots come back.
set -eu

# Keep in sync with @playwright/test in package.json and e2e-image in .github/workflows/ci.yml
# (tests/unit/e2e/playwright-version.test.ts fails when they differ).
IMAGE="mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579"

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
MODE=update
if [ "${1:-}" = "--check" ]; then
  MODE=check
  shift
fi
if [ "${1:-}" = "--" ]; then shift; fi

if [ "$MODE" = update ]; then
  # The default projects, chromium and pixel-5, are the ones with baselines.
  set -- --update-snapshots=changed "$@"
fi

# amd64 always, so a run on an arm64 machine renders the same pixels as CI.
docker run --rm --platform linux/amd64 --ipc=host \
  -v "$ROOT:/src" \
  -e CI=1 -e MODE="$MODE" -e E2E_WORKERS="${E2E_WORKERS:-4}" -e E2E_ALL_BROWSERS="${E2E_ALL_BROWSERS:-}" -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -w /work "$IMAGE" sh -euc '
    tar -C /src --exclude=./node_modules --exclude=./dist --exclude=./.git \
      --exclude=./playwright-report --exclude=./test-results -cf - . | tar -xf -
    cp .cloud/docker/pnpm-workspace.yaml pnpm-workspace.yaml
    # corepack at the version and hash in .cloud/corepack/package-lock.json.
    npm ci --prefix .cloud/corepack --ignore-scripts --no-audit --no-fund >/dev/null
    .cloud/corepack/node_modules/.bin/corepack enable --install-directory /usr/local/bin
    pnpm install --frozen-lockfile
    status=0
    # CI=1 means one worker in the config; a runner has room for more.
    node_modules/.bin/playwright test --workers="${E2E_WORKERS:-4}" "$@" || status=$?
    if [ "$MODE" = update ]; then
      # Copy the snapshot folders back, owned by the calling user.
      tar -cf - e2e/*-snapshots | tar -C /src -xf -
      chown -R "$HOST_UID:$HOST_GID" /src/e2e
    fi
    # The report helps when a check fails.
    rm -rf /src/playwright-report && cp -r playwright-report /src/
    chown -R "$HOST_UID:$HOST_GID" /src/playwright-report
    exit "$status"
  ' sh "$@"
