#!/bin/sh
# Runs the real-stack journey (e2e/real-stack) in the pinned Playwright image against a
# running CodeClarity stack. Nothing is mocked; the stack must have the dev account and
# the knowledge dump fixture (umbrella CI's `e2e (real stack)` job brings one up).
#
#   .cloud/scripts/e2e-real-stack.sh [base URL] [output dir]
#
# Base URL defaults to https://localhost, reached through the host network. The HTML
# report, test results (traces) and the journey's snapshot folder land in the output
# directory (default: playwright-real-stack in this checkout). Needs Docker.
set -eu

# Keep in sync with @playwright/test in package.json.
IMAGE="mcr.microsoft.com/playwright:v1.65.1-noble@sha256:1507cbfc550a63a6b7396791ca4f00df17beb56342d2447b3f106c306f525579"

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
BASE_URL=${1:-https://localhost}
OUT=${2:-$ROOT/playwright-real-stack}
mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd)

# The checkout is copied into the container, so the host's node_modules and lockfile are never touched.
docker run --rm --network host --ipc=host \
  -v "$ROOT:/src:ro" -v "$OUT:/out" \
  -e CI=1 -e E2E_BASE_URL="$BASE_URL" -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -w /work "$IMAGE" sh -euc '
    tar -C /src --exclude=./node_modules --exclude=./dist --exclude=./.git \
      --exclude=./playwright-report --exclude=./test-results --exclude=./playwright-real-stack -cf - . | tar -xf -
    cp .cloud/docker/pnpm-workspace.yaml pnpm-workspace.yaml
    npm install -g corepack@0.36.0 --force >/dev/null
    corepack enable
    pnpm install --frozen-lockfile
    status=0
    node_modules/.bin/playwright test --project=real-stack || status=$?
    cp -r playwright-report test-results e2e/real-stack /out/ 2>/dev/null || true
    chown -R "$HOST_UID:$HOST_GID" /out
    exit "$status"
  '
