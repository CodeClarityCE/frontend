# Frontend Testing Conventions

## Overview
This document establishes testing standards and conventions for the CodeClarity frontend application using Vue 3, Vitest, and Cypress.

## File Organization

### Test File Structure
```
tests/
├── setup.ts                 # Global test setup
├── utils/
│   └── test-utils.ts        # Testing utilities and helpers
├── mocks/
│   ├── handlers.ts          # MSW request handlers
│   └── server.ts            # MSW server setup
├── fixtures/
│   ├── user.ts              # Mock user data
│   └── *.ts                 # Other test data
└── components/              # Component tests mirror src structure
    ├── base_components/
    ├── codeclarity_components/
    └── enterprise_components/
```

### Test File Naming
- Unit tests: `ComponentName.spec.ts`
- Integration tests: `ComponentName.integration.spec.ts` 
- E2E tests: `feature-name.cy.ts`
- Store tests: `storeName.store.spec.ts`
- Composable tests: `useComposableName.composable.spec.ts`

## Selector Strategy

### Test Selectors (Priority Order)
1. **`data-cy`** attributes for Cypress tests
2. **`data-testid`** attributes for unit/integration tests
3. **Semantic queries** (getByRole, getByLabelText, etc.)
4. **Text content** for user-visible elements
5. **CSS selectors** as last resort

### Selector Examples
```html
<!-- Good: Use data-cy for E2E tests -->
<button data-cy="submit-button" data-testid="submit-btn">Submit</button>

<!-- Good: Semantic HTML with accessibility -->
<button type="submit" aria-label="Submit form">Submit</button>

<!-- Avoid: Generic selectors -->
<div class="btn-wrapper">
  <button>Submit</button>
</div>
```

### Selector Naming Convention
- Use kebab-case for attribute values
- Be specific and descriptive
- Include component context when needed
- Examples:
  - `data-cy="project-create-form"`
  - `data-testid="vulnerability-table-row"`
  - `data-cy="header-user-nav-dropdown"`

## Testing Patterns

### Component Testing Structure
```typescript
// ComponentName.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderWithProviders } from '@/tests/utils/test-utils'
import ComponentName from '@/components/ComponentName.vue'

describe('ComponentName', () => {
  // Test props, events, rendering, user interactions
  
  describe('rendering', () => {
    it('should render with default props', () => {
      // Test basic rendering
    })
    
    it('should render with custom props', () => {
      // Test prop variations
    })
  })
  
  describe('interactions', () => {
    it('should emit event when clicked', async () => {
      // Test user interactions
    })
  })
  
  describe('edge cases', () => {
    it('should handle empty data gracefully', () => {
      // Test error states and edge cases
    })
  })
})
```

### Store Testing Pattern
```typescript
// storeName.store.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStoreName } from '@/stores/storeName'

describe('useStoreName', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should initialize with default state', () => {
    const store = useStoreName()
    expect(store.items).toEqual([])
  })
  
  it('should update state when action is called', async () => {
    const store = useStoreName()
    await store.fetchItems()
    expect(store.items).toHaveLength(0)
  })
})
```

### Composable Testing Pattern
```typescript
// useComposableName.composable.spec.ts
import { describe, it, expect } from 'vitest'
import { renderComposable } from '@/tests/utils/test-utils'
import { useComposableName } from '@/composables/useComposableName'

describe('useComposableName', () => {
  it('should return expected values', () => {
    const { result } = renderComposable(() => useComposableName())
    expect(result.value).toBe(expectedValue)
  })
})
```

## Testing Best Practices

### Do's ✅
- **Test user behavior, not implementation details**
- **Use semantic queries when possible** (`getByRole`, `getByLabelText`)
- **Mock external dependencies** (APIs, third-party libraries)
- **Test error states and edge cases**
- **Keep tests focused and isolated**
- **Use descriptive test names** that explain the behavior
- **Group related tests** using `describe` blocks
- **Clean up after tests** (reset stores, clear mocks)

### Don'ts ❌
- **Don't test internal implementation details**
- **Don't test third-party library functionality**
- **Don't use generic selectors** like `.btn` or `div`
- **Don't test multiple behaviors in one test**
- **Don't hardcode test data** - use fixtures
- **Don't rely on specific DOM structure**
- **Don't test styles/CSS** unless critical for functionality

### Test Naming Convention
Use descriptive test names that follow this pattern:
```
should [expected behavior] when [condition/scenario]
```

Examples:
- `should display error message when login fails`
- `should emit submit event when form is valid`
- `should disable button when loading`
- `should filter results when search term is entered`

## Mocking Guidelines

### API Mocking with MSW
```typescript
// In tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json({ users: [] })
  }),
  
  // Override for specific tests
  http.get('/api/users', () => {
    return HttpResponse.json({ error: 'Server error' }, { status: 500 })
  })
]
```

### Component Dependencies
```typescript
// Mock child components when testing parent
const mockChildComponent = {
  template: '<div data-testid="mock-child">Mock Child</div>'
}

const wrapper = renderWithProviders(ParentComponent, {
  global: {
    stubs: {
      ChildComponent: mockChildComponent
    }
  }
})
```

### External Libraries
```typescript
// Mock external libraries in setup.ts or individual tests
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: {} })
}))
```

## Code Coverage Guidelines

### Coverage Targets
- **Lines**: 80% minimum
- **Functions**: 80% minimum  
- **Branches**: 80% minimum
- **Statements**: 80% minimum

### Coverage Exclusions
- Type definition files (`*.d.ts`)
- Test files themselves
- Story files (`*.stories.ts`)
- Build configuration files
- Third-party code

### Running Coverage
```bash
# Generate coverage report
yarn test:coverage

# View coverage in browser
open coverage/index.html
```

## Accessibility Testing

### Basic A11y Checks
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = renderWithProviders(Component)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Keyboard Navigation Testing
```typescript
it('should be navigable with keyboard', async () => {
  const { getByRole } = renderWithProviders(Component)
  const button = getByRole('button')
  
  await userEvent.tab()
  expect(button).toHaveFocus()
  
  await userEvent.keyboard('{Enter}')
  // Assert expected behavior
})
```

## Performance Testing

### Component Rendering Performance
```typescript
it('should render large lists efficiently', () => {
  const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({ id: i }))
  
  const start = performance.now()
  renderWithProviders(ListComponent, { props: { items: largeDataSet } })
  const end = performance.now()
  
  expect(end - start).toBeLessThan(100) // 100ms threshold
})
```

## Common Testing Utilities

### Wait for Async Operations
```typescript
import { waitFor } from '@testing-library/vue'

await waitFor(() => {
  expect(getByText('Loading complete')).toBeInTheDocument()
})
```

### User Interactions
```typescript
import { userEvent } from '@testing-library/user-event'

// Click interactions
await userEvent.click(getByRole('button'))

// Form interactions
await userEvent.type(getByLabelText('Email'), 'test@example.com')
await userEvent.selectOptions(getByLabelText('Country'), 'US')

// Keyboard interactions
await userEvent.keyboard('{Enter}')
await userEvent.tab()
```

### Custom Matchers
```typescript
// Extend expect with custom matchers
expect.extend({
  toBeVisible(received) {
    const pass = received.style.display !== 'none'
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be visible`,
      pass
    }
  }
})
```

## ESLint Configuration for Tests

### Recommended Rules
```javascript
// .eslintrc.js test overrides
overrides: [
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/one-component-per-file': 'off'
    }
  }
]
```

## Debugging Tests

### Debug Component State
```typescript
import { screen, debug } from '@testing-library/vue'

// Debug rendered DOM
debug()

// Debug specific element
debug(screen.getByRole('button'))

// Check component props/state
console.log(wrapper.vm.$props)
```

### Debugging Failed Tests
- Use `--reporter=verbose` for detailed output
- Add `console.log` statements strategically  
- Use browser dev tools with `--open` flag
- Check component props and emitted events

## Migration Guidelines

### From Vue Test Utils to Testing Library
- Replace `mount()` with `renderWithProviders()`
- Use semantic queries instead of `find()` 
- Focus on user interactions over implementation
- Test behavior, not component internals

### Legacy Test Updates
1. Update import statements
2. Replace mounting utilities
3. Update selectors to use data attributes
4. Add accessibility considerations
5. Improve test descriptions and structure

---

**Last Updated**: 2025-07-12  
**Review Frequency**: Monthly or when major testing patterns change