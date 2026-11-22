<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/CodeClarityCE/identity/blob/main/logo/vectorized/logo_name_white.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/CodeClarityCE/identity/blob/main/logo/vectorized/logo_name_black.svg">
  <img alt="codeclarity-logo" src="https://github.com/CodeClarityCE/identity/blob/main/logo/vectorized/logo_name_black.svg">
</picture>
<br>
<br>

Secure your software empower your team.

[![License](https://img.shields.io/github/license/codeclarityce/codeclarity-dev)](LICENSE.txt)

<details open="open">
<summary>Table of Contents</summary>

- [CodeClarity Frontend](#codeclarity-frontend)
  - [Contributing](#contributing)
  - [Reporting Issues](#reporting-issues)
  - [Purpose](#purpose)
  - [Recommended IDE Setup](#recommended-ide-setup)
  - [Type Support for `.vue` Imports in TS](#type-support-for-vue-imports-in-ts)
  - [Customize configuration](#customize-configuration)
  - [Project Setup](#project-setup)
    - [Compile and Hot-Reload for Development](#compile-and-hot-reload-for-development)
    - [Type-Check, Compile and Minify for Production](#type-check-compile-and-minify-for-production)
    - [Run Unit Tests with Vitest](#run-unit-tests-with-vitest)
    - [Run End-to-End Tests with Cypress](#run-end-to-end-tests-with-cypress)
    - [Lint with ESLint](#lint-with-eslint)

</details>

---

# CodeClarity Frontend

## Contributing

If you'd like to contribute code or documentation, please see [CONTRIBUTING.md](https://github.com/CodeClarityCE/codeclarity-dev/blob/main/CONTRIBUTING.md) for guidelines on how to do so.

## Reporting Issues

Please report any issues with the setup process or other problems encountered while using this repository by opening a new issue in this project's GitHub page.

## Purpose

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev/)

```sh
node_modules/.bin/playwright test
```

Playwright builds the app, serves it with `vite preview` on `127.0.0.1:4173` and stops
the server when the run ends. Set `E2E_PORT` to use another port, for example to run
two worktrees at once. A server already listening on that port fails the run instead of
being tested. `E2E_BASE_URL` (for example `https://localhost`) targets a running stack
instead, skips the build and ignores HTTPS errors, since the dev stack's certificate is
self-signed. `E2E_HOST_RESOLVER_RULES` (for example `MAP localhost 172.17.0.1`) maps hosts in
Chromium, for a sandbox where the stack is published on the Docker gateway but Caddy only
answers for `localhost`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` uses a system Chromium.

A plain run uses two projects: `chromium` (desktop) and `pixel-5`. Phone tests are the
blocks written with `describeOnAPhone` (`e2e/helpers/phone.mts`), tagged `@phone`: they run
on `pixel-5` at 390 px, and every other test runs on `chromium`. Set `E2E_ALL_BROWSERS=1`
(or `true`) to add desktop `firefox` and `webkit`, for nightly or manual runs.

The real-stack journeys (`e2e/real-stack/*.journey.mts`) mock nothing. Their `real-stack`
project exists only when `E2E_BASE_URL` is set; run them with `--project=real-stack`, or in
the pinned image with `.cloud/scripts/e2e-real-stack.sh [url] [outdir] [options]`.

`e2e/real-stack/monkey.journey.mts` (tagged `@monkey`) runs seeded random interactions on each
golden-journey page and fails on an uncaught error, an error report or a 5xx. Each test prints
its seed; `MONKEY_SEED` replays it and `MONKEY_STEPS` sets the run length. The umbrella's
nightly `monkey.yml` runs it; fixed runs go in `MONKEY_REGRESSIONS`.

How to write specs (sweep, aria snapshots, phone blocks, route coverage) is in
`tests/TESTING_CONVENTIONS.md`.

Every PR runs the default projects in CI, in the same pinned Playwright image as the
baseline script (`e2e-image` in `.github/workflows/ci.yml`), and a failure fails `ci`. A failed
run attaches the HTML report, screenshots and traces as the `e2e-report` artifact.

### Screenshot baselines

`expectScreenshots` (`e2e/helpers/screenshots.mts`) captures at 1280 px in `chromium` and
at 390 px in `pixel-5`; firefox and webkit take no screenshots. The baselines in `e2e/*-snapshots/` are
generated in the digest-pinned Playwright image, so every machine renders the same pixels.
A run on your machine may show small pixel diffs; the run in the image is the one that counts.

With Docker, regenerate the baselines that changed, or check the suite as CI would:

```sh
.cloud/scripts/e2e-baselines.sh          # update changed baselines and aria snapshots
.cloud/scripts/e2e-baselines.sh --check  # default projects, fail on any diff
```

Pass Playwright arguments after `--`, for example
`.cloud/scripts/e2e-baselines.sh -- e2e/tickets.spec.mts`. The script copies the checkout
into the container and copies only `e2e/*-snapshots/` back. Delete a baseline file by hand
when its screenshot is removed; Playwright never deletes them.

Without Docker, let GitHub Actions do it: push your commit to a branch named
`baselines/<anything>` in `CodeClarityCE/frontend`. The `E2E baselines` workflow runs the same
script, uploads the updated folders as the `e2e-baselines` artifact, then runs `--check`.
Fetch the artifact into the checkout and commit it:

```sh
gh run download <run-id> -R CodeClarityCE/frontend -n e2e-baselines -D e2e
```

### Fixture contracts

The e2e specs mock the API with fixtures in `e2e/pages/*.page.mts`.
`e2e/fixture-contracts.spec.mts` checks that each covered fixture has the same JSON shape
(keys and types, not values) as a real API response committed in `e2e/contracts/*.json`.
It needs no running stack.

To refresh the captured responses, start the dev stack with a seeded user and an
organisation that has a license policy and a project with an analysis (a failed
one is preferred), then run from this directory:

```sh
node e2e/contracts/capture.mts
```

`CONTRACT_API` (default `http://localhost:3000`), `CONTRACT_EMAIL`, `CONTRACT_PASSWORD` and
`CONTRACT_ORG` override the defaults. Review the diff, then align the fixtures until the check
passes. A fixture with known drift is marked `drift` in the spec and expected to fail; remove
the marker when its ticket fixes the drift, or the check fails because it passed.

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
