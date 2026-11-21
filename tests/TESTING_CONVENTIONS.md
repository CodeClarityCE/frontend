# Frontend Testing Conventions

Vue 3, Vitest, and Cypress testing standards for CodeClarity.

## File Organization

```
tests/
├── setup.ts                 # Global test setup
├── utils/test-utils.ts      # Testing utilities
├── mocks/
│   ├── handlers.ts          # MSW handlers
│   └── server.ts            # MSW server
├── fixtures/*.ts            # Test data
└── components/              # Component tests (mirrors src)
```

### Test File Naming

- Unit: `ComponentName.spec.ts`
- Integration: `ComponentName.integration.spec.ts`
- E2E: `feature-name.cy.ts`
- Store: `storeName.store.spec.ts`
- Composable: `useComposableName.composable.spec.ts`

## Selectors

**Priority:** `data-cy` → `data-testid` → semantic queries → text content → CSS selectors

```html
<!-- Good -->
<button data-cy="submit-button" data-testid="submit-btn">Submit</button>
<button type="submit" aria-label="Submit form">Submit</button>

<!-- Avoid -->
<div class="btn-wrapper"><button>Submit</button></div>
```

**Naming:** Use kebab-case, be descriptive, include context:

- `data-cy="project-create-form"`
- `data-testid="vulnerability-table-row"`

## Test Patterns

### Components

```typescript
describe("ComponentName", () => {
  describe("rendering", () => {
    it("should render with default props", () => {});
  });

  describe("interactions", () => {
    it("should emit event when clicked", async () => {});
  });

  describe("edge cases", () => {
    it("should handle empty data gracefully", () => {});
  });
});
```

### Stores

Store tests use the real-app setup below, so they run the real actions and the
real navigation guard.

### Real stores, router and HTTP only (`tests/real-app.ts`)

`tests/setup.ts` still mocks Pinia, the stores, the router, the repositories and
`@vueuse/core` for every file. A file opts out of all of them with this block
right after its imports:

```typescript
vi.hoisted(() => {
  globalThis.optOutOfGlobalMocks = true;
});
```

The file then gets the real modules, a fresh in-memory `localStorage` per test,
no mock Pinia or `RouterLink` stub, and every mounted component is unmounted
after each test. Build the app with `createTestApp` from `tests/real-app.ts`:

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

### Composables

```typescript
describe("useComposableName", () => {
  it("should return expected values", () => {
    const { result } = renderComposable(() => useComposableName());
    expect(result.value).toBe(expectedValue);
  });
});
```

## Best Practices

### Do ✅

- Test user behavior, not implementation
- Use semantic queries (`getByRole`, `getByLabelText`)
- Mock external dependencies
- Test error states and edge cases
- Keep tests focused and isolated
- Use descriptive test names
- Clean up after tests

### Don't ❌

- Test implementation details
- Test third-party libraries
- Use generic selectors (`.btn`, `div`)
- Test multiple behaviors in one test
- Hardcode test data
- Test CSS unless functional

### Naming

**Pattern:** `should [behavior] when [condition]`

Examples:

- `should display error message when login fails`
- `should emit submit event when form is valid`
- `should disable button when loading`

## Mocking

### API (MSW)

```typescript
// tests/mocks/handlers.ts
export const handlers = [
  http.get("/api/users", () => HttpResponse.json({ users: [] })),
  http.get("/api/users", () =>
    HttpResponse.json({ error: "Server error" }, { status: 500 }),
  ),
];
```

### Components

```typescript
const mockChild = { template: '<div data-testid="mock-child">Mock</div>' };
const wrapper = renderWithProviders(Parent, {
  global: { stubs: { Child: mockChild } },
});
```

### Libraries

```typescript
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} }),
}));
```

## Coverage

There is no coverage percentage target. Run `vitest run --coverage` and open
`coverage/index.html` to see which lines a change leaves untested.

## Accessibility

Accessibility is checked in the Playwright specs (`e2e/helpers/a11y.mts`), where
the real markup renders. Unit tests do not run axe.

## Utilities

### Async Operations

```typescript
await waitFor(() => expect(getByText("Loading complete")).toBeInTheDocument());
```

### User Interactions

```typescript
await userEvent.click(getByRole("button"));
await userEvent.type(getByLabelText("Email"), "test@example.com");
await userEvent.keyboard("{Enter}");
```

## Debugging

```typescript
import { screen, debug } from "@testing-library/vue";

debug(); // Debug rendered DOM
debug(screen.getByRole("button")); // Debug specific element
console.log(wrapper.vm.$props); // Check component state
```

**Tips:**

- Use `--reporter=verbose` for detailed output
- Add strategic `console.log` statements
- Use browser dev tools with `--open` flag

## Migration

**From Vue Test Utils to Testing Library:**

- Replace `mount()` with `renderWithProviders()`
- Use semantic queries instead of `find()`
- Focus on user interactions over implementation
- Test behavior, not internals
