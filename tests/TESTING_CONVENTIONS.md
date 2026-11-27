# Frontend Testing Conventions

What a user sees on a page is tested in Playwright against API mocks whose shapes
are checked against real API responses. Vitest is kept for logic: utils, stores,
composables and repositories. See ADR 0017 in the umbrella repo
(`docs/adr/0017-ui-behaviour-is-tested-in-playwright-against-checked-mocks.md`).

## Where tests live

```
src/**/*.test.ts, src/**/*.spec.ts   # Vitest, next to the code they test
tests/
├── setup.ts                         # Global Vitest setup (browser APIs jsdom lacks)
├── real-app.ts                      # createTestApp: real app, faked HTTP
├── fixtures/*.ts                    # Unit test data
└── unit/                            # Vitest tests that are not about one source file
e2e/
├── *.spec.mts                       # Playwright specs, one or more per page
├── pages/*.page.mts                 # Page objects and the API fixtures they serve
├── helpers/*.mts                    # Sweep, axe, aria snapshot, screenshots, phone
├── route-registry.mts               # The spec that covers each page
├── contracts/*.json                 # Captured API responses the fixtures are checked against
└── real-stack/*.journey.mts         # Journeys against a real stack, nothing mocked
```

Running the suites, the screenshot baselines and the fixture contracts are in
the README.

## Selectors

Find elements the way a user or a screen reader does: by role and accessible
name (`getByRole("button", { name: "Save" })`), then by label (`getByLabel`), then
by visible text. Scope with a named landmark, region, table or dialog rather than
a CSS path. Do not add `data-testid`, `data-cy` or ids for tests. If a control or
region has no accessible name, give it one in the app markup; that fixes it for
users too.

## Playwright specs

Each page state a spec loads gets, in this order:

1. `await expectNoAxeViolations(page)` (`e2e/helpers/a11y.mts`).
2. `await expectPageSweep(page)` (`e2e/helpers/page-sweep.mts`). It fails on a
   visible enabled control without a pointer (or resize) cursor, a disabled one
   with a pointer cursor, and sideways scroll at the current viewport. It never
   resizes, since that would close dialogs and change the state under test.
3. `await expectMainSnapshot(page, "<state>")` (`e2e/helpers/aria-snapshot.mts`):
   compares the `main` landmark's accessibility tree with
   `e2e/<spec>.mts-snapshots/<state>.aria.yml`. Every node and name in the file
   must be on the page, in order; nodes the file leaves out are allowed, since
   Playwright's generated files leave out text that repeats an element's name.
   For another region use `expectAriaSnapshot(locator, name)`. Write a new file
   by running the test once (it fails with "writing actual"), read it, then
   rerun. Chromium and Pixel 5 share the file, so a phone-only layout needs its
   own name, such as `<state>-phone`.
4. `await expectScreenshots(page, "<state>")` (`e2e/helpers/screenshots.mts`):
   `<state>-1280.png` in `chromium`, `<state>-390.png` in `pixel-5`, with
   animations frozen. Other projects take none.

### Phones

Every spec in `e2e/route-registry.mts` has a `describeOnAPhone("On a phone", ...)`
block (`e2e/helpers/phone.mts`) that loads the pages it covers, sweeps each and
takes its 390px screenshot. The block is tagged `@phone`, so it runs only in the
`pixel-5` project (Pixel 5 emulation at 390x844), and every untagged test runs
only in the desktop projects. The block sets the phone viewport again after the
spec's desktop `beforeEach`.

### Route coverage

`e2e/route-coverage.spec.mts` reads `src/router.ts` and lists each named route,
each `:page` value its view compares with (`page === "x"` or `view === "x"`),
the keys of a view's `const tab = ref({ ... })`, and the `tab === "x"` values
of the component a view renders for a subpage. It fails when one of them has no
entry in `e2e/route-registry.mts`, when an entry names a missing spec or route,
and when a registered spec has no `describeOnAPhone` block.

### Real-stack journeys

`e2e/real-stack/*.journey.mts` run only in the `real-stack` project, which
exists only when `E2E_BASE_URL` is set. They are the golden journeys 1 to 6 and
mock nothing: each drives the app as a user does and asserts only on what the
user sees (pages, downloaded files, emails), never on API responses or the
database. `stack.mts` holds the shared steps (log in, upload a project, run the
Default Analyzer) and `mailbox.mts` reads emails from the stack's mail catcher.

- `account.journey.mts`: sign up, confirm the email, log in, create an
  organisation, invite the dev account, who joins from the email.
- `analysis.journey.mts`: upload and analyse a project; browse and export its
  vulnerabilities, SBOM and licences; create a ticket from its remediation and
  resolve it.
- `knowledge.journey.mts`: a project's advisories before and after a knowledge
  update. The test tagged `@after-knowledge-update` runs only after the stack's
  knowledge is updated.
- `upgrade.journey.mts` (`@upgrade`): after an upgrade, the data seeded on the
  previous release is still shown; it needs `E2E_LOGIN_EMAIL` and
  `E2E_LOGIN_PASSWORD`.
- `monkey.journey.mts` is not a golden journey and is the one exception to the
  rule above: its seeded random-interaction runs (nightly, `scripts/monkey/`)
  fail on what a user would not see too, an uncaught error, an error report sent
  to `POST /logs` or a 5xx response.

The umbrella repo's `e2e (real stack)` job runs them against a trimmed stack
with the knowledge dump fixture, and its upgrade job runs `@upgrade`
(`.cloud/scripts/e2e-real-stack.sh` runs them in the pinned Playwright image).
Against the dev stack, add `--ignore-snapshots`: the aria snapshots expect the
fixture's knowledge.

## Vitest

### Real stores, router and HTTP (`tests/real-app.ts`)

`tests/setup.ts` mocks no app code and no library: every test runs the real
stores, router, repositories and components. It only adds the browser APIs jsdom
lacks (`ResizeObserver`, `IntersectionObserver`, `matchMedia`, `scrollTo`,
`scrollIntoView`, `animate` and an immediate `requestAnimationFrame`), registers
the logo icons the app ships (as `main.ts` does), gives each test a fresh
in-memory `localStorage` and `sessionStorage`, and unmounts every mounted
component after each test. Build the app with `createTestApp`:

```typescript
const app = createTestApp({ signedIn: true }); // fresh Pinia; fetch is faked
app.http.on("GET", "/org/org-123/projects", { data: [] }); // API path, no /api
await app.visit("/projects"); // a page load: the real guard runs
render(ProjectsView, { global: app.global }); // real Pinia + memory router
expect(app.http.requests.at(-1)?.body).toEqual({ name: "x" });
```

- `signedIn: true` signs in as `e2e/fixtures/user.json` through the auth store
  and answers `GET /auth/user` and `GET /org/org-123`; leave it out to start
  signed out.
- A request with no answer gets a 404, and is still recorded in `app.http.requests`
  (each with `method`, `path`, `query`, `headers` and the parsed `body`). Answers
  match on method and path only, and a logged warning sends its own `POST /logs`,
  so find the request you want rather than taking the last one.
- A string answer is sent as raw text, for file exports; anything else is sent
  as JSON.
- `render(withToaster(Component, props), { global: app.global })` renders the
  app's toaster next to the component, so a toast is asserted as text.
- Answer a request with the shape the API sends: responses are validated, so an
  empty `{}` for a `NoDataResponse` fails just as it would in the app.
- The router is the app's own (memory history in tests), so navigation goes
  through `app.router` or `app.visit`.
- To simulate a reload, unmount the page and call `createTestApp()` again: it
  keeps `localStorage` and starts a new Pinia. The router runs its guards with
  the first mounted app's Pinia, so a page left mounted keeps the old one.

`src/stores/*.test.ts` are the reference examples.

### What may be faked

HTTP, through `app.http`. A test may wrap `fetch` around it only for what
`app.http` cannot answer: a held-back answer, a different answer per request,
or a network failure.

Besides HTTP, only four browser boundaries jsdom cannot run are faked: the file
download (`@/utils/download`), PDF font loading (`@/utils/svg-pdf/load-fonts`),
Web Locks (`navigator.locks`), which the session tests stand in for to
refresh across tabs, and the clipboard (`navigator.clipboard`, stubbed with
`vi.stubGlobal`), so a test can make the browser refuse a copy. jsdom has no
Web Locks, so every other test runs the single-tab fallback.
Never mock the router, Pinia, a store, a repository, a component or a library.

```typescript
const { saveBlob } = vi.hoisted(() => ({ saveBlob: vi.fn() }));
vi.mock("@/utils/download", () => ({ saveBlob }));
```

### Accessibility and coverage

Accessibility is checked in the Playwright specs, where the real markup renders;
unit tests do not run axe. There is no coverage percentage target: run
`vitest run --coverage` and open `coverage/index.html` to see which lines a change
leaves untested.
