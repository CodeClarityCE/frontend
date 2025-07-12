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
describe('ComponentName', () => {
  describe('rendering', () => {
    it('should render with default props', () => {})
  })
  
  describe('interactions', () => {
    it('should emit event when clicked', async () => {})
  })
  
  describe('edge cases', () => {
    it('should handle empty data gracefully', () => {})
  })
})
```

### Stores
```typescript
describe('useStoreName', () => {
  beforeEach(() => setActivePinia(createPinia()))
  
  it('should initialize with default state', () => {
    const store = useStoreName()
    expect(store.items).toEqual([])
  })
})
```

### Composables
```typescript
describe('useComposableName', () => {
  it('should return expected values', () => {
    const { result } = renderComposable(() => useComposableName())
    expect(result.value).toBe(expectedValue)
  })
})
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
  http.get('/api/users', () => HttpResponse.json({ users: [] })),
  http.get('/api/users', () => HttpResponse.json({ error: 'Server error' }, { status: 500 }))
]
```

### Components
```typescript
const mockChild = { template: '<div data-testid="mock-child">Mock</div>' }
const wrapper = renderWithProviders(Parent, {
  global: { stubs: { Child: mockChild } }
})
```

### Libraries
```typescript
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} })
}))
```

## Coverage

**Target:** 80% minimum (lines, functions, branches, statements)

**Excluded:** `*.d.ts`, test files, `*.stories.ts`, config files, third-party code

```bash
yarn test:coverage
open coverage/index.html
```

## Accessibility

### A11y Checks
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = renderWithProviders(Component)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Keyboard Navigation
```typescript
it('should be navigable with keyboard', async () => {
  const button = getByRole('button')
  await userEvent.tab()
  expect(button).toHaveFocus()
  await userEvent.keyboard('{Enter}')
})
```

## Utilities

### Async Operations
```typescript
await waitFor(() => expect(getByText('Loading complete')).toBeInTheDocument())
```

### User Interactions
```typescript
await userEvent.click(getByRole('button'))
await userEvent.type(getByLabelText('Email'), 'test@example.com')
await userEvent.keyboard('{Enter}')
```

### Performance
```typescript
it('should render large lists efficiently', () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
  const start = performance.now()
  renderWithProviders(ListComponent, { props: { items } })
  expect(performance.now() - start).toBeLessThan(100)
})
```

## Debugging

```typescript
import { screen, debug } from '@testing-library/vue'

debug() // Debug rendered DOM
debug(screen.getByRole('button')) // Debug specific element
console.log(wrapper.vm.$props) // Check component state
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