#!/bin/sh
# Runs the real-stack golden journeys (e2e/real-stack) in the pinned Playwright image against
# a running CodeClarity stack. Nothing is mocked; the stack must have the dev account, the
# knowledge dump fixture and a mail catcher (umbrella CI's `e2e (real stack)` job brings one up).
#
#   .cloud/scripts/e2e-real-stack.sh [base URL] [output dir] [playwright test options...]
#
# Base URL defaults to https://localhost, reached through the host network. The HTML
# report, test results (traces) and the journeys' snapshot folder land in the output
# directory (default: playwright-real-stack in this checkout). Options such as
# --grep @after-knowledge-update pick journeys. E2E_RUN, E2E_MAILBOX_URL, E2E_LOGIN_EMAIL,
# E2E_LOGIN_PASSWORD, MONKEY_SEED and MONKEY_STEPS are passed on to the journeys. Needs Docker.
set -eu

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
# The pinned Playwright image of the mocked suite, so both run the same browser.
IMAGE=$(sed -n 's/^IMAGE="\(.*\)"$/\1/p' "$ROOT/.cloud/scripts/e2e-baselines.sh")
[ -n "$IMAGE" ] || {
  echo "e2e-real-stack: no IMAGE= line in .cloud/scripts/e2e-baselines.sh" >&2
  exit 1
}
BASE_URL=${1:-https://localhost}
OUT=${2:-$ROOT/playwright-real-stack}
mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd)
shift $(($# < 2 ? $# : 2))

# The checkout is copied into the container, so the host's node_modules and lockfile are never touched.
docker run --rm --network host --ipc=host \
  -v "$ROOT:/src:ro" -v "$OUT:/out" \
  -e CI=1 -e E2E_BASE_URL="$BASE_URL" -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e E2E_RUN -e E2E_MAILBOX_URL -e E2E_LOGIN_EMAIL -e E2E_LOGIN_PASSWORD -e MONKEY_SEED -e MONKEY_STEPS \
  -w /work "$IMAGE" sh -euc '
    tar -C /src --exclude=./node_modules --exclude=./dist --exclude=./.git \
      --exclude=./playwright-report --exclude=./test-results --exclude=./playwright-real-stack -cf - . | tar -xf -
    cp .cloud/docker/pnpm-workspace.yaml pnpm-workspace.yaml
    npm install -g corepack@0.36.0 --force >/dev/null
    corepack enable
    pnpm install --frozen-lockfile
    status=0
    node_modules/.bin/playwright test --project=real-stack "$@" || status=$?
    cp -r playwright-report test-results e2e/real-stack /out/ 2>/dev/null || true
    chown -R "$HOST_UID:$HOST_GID" /out
    exit "$status"
  ' e2e-real-stack "$@"
