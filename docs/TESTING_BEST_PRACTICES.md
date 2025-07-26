# Frontend Testing Best Practices Guide

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types and Strategy](#test-types-and-strategy)
3. [Unit Testing Guidelines](#unit-testing-guidelines)
4. [Integration Testing](#integration-testing)
5. [E2E Testing Best Practices](#e2e-testing-best-practices)
6. [Performance Testing](#performance-testing)
7. [Accessibility Testing](#accessibility-testing)
8. [Visual Regression Testing](#visual-regression-testing)
9. [Test Organization](#test-organization)
10. [Common Patterns](#common-patterns)
11. [Troubleshooting](#troubleshooting)

## Testing Philosophy

### The Testing Pyramid

```
    E2E Tests (Few)
   /              \
  Integration Tests (Some)
 /                        \
Unit Tests (Many)
```

- **Unit Tests (70%)**: Fast, isolated, test individual components/functions
- **Integration Tests (20%)**: Test component interactions and workflows
- **E2E Tests (10%)**: Test complete user journeys

### Core Principles

1. **Arrange, Act, Assert (AAA)**
   ```typescript
   // Arrange - Set up test data and mocks
   const wrapper = mount(Component, { props: { value: 'test' } });
   
   // Act - Perform the action being tested
   await wrapper.find('button').trigger('click');
   
   // Assert - Verify the expected outcome
   expect(wrapper.emitted('change')).toBeTruthy();
   ```

2. **Test Behavior, Not Implementation**
   ```typescript
   // ❌ Bad - Testing implementation details
   expect(wrapper.vm.internalCounter).toBe(1);
   
   // ✅ Good - Testing behavior
   expect(wrapper.text()).toContain('Items: 1');
   ```

3. **Fail Fast, Fail Clear**
   ```typescript
   // ✅ Clear, descriptive test names
   it('should show error message when email is invalid', () => {
     // Test implementation
   });
   ```

## Test Types and Strategy

### Unit Tests
**Purpose**: Test individual components in isolation
**Tools**: Vitest + Vue Test Utils
**Coverage**: 90% target

```typescript
import { mount } from '@vue/test-utils';
import SearchBar from '@/components/SearchBar.vue';

describe('SearchBar', () => {
  it('should emit search event when Enter is pressed', async () => {
    const wrapper = mount(SearchBar);
    const input = wrapper.find('input');
    
    await input.setValue('test query');
    await input.trigger('keydown.enter');
    
    expect(wrapper.emitted('search')).toEqual([['test query']]);
  });
});
```

### Integration Tests
**Purpose**: Test component interactions and data flow
**Tools**: Vitest + MSW for API mocking
**Coverage**: 80% target

```typescript
import { mount } from '@vue/test-utils';
import ProjectDashboard from '@/views/ProjectDashboard.vue';

describe('ProjectDashboard Integration', () => {
  it('should load and display project data', async () => {
    // Mock API response
    mockApi('GET', '/api/projects/123', mockProjectData);
    
    const wrapper = mount(ProjectDashboard, {
      props: { projectId: '123' }
    });
    
    await waitForApiCall();
    
    expect(wrapper.text()).toContain(mockProjectData.name);
    expect(wrapper.find('[data-testid="vulnerability-count"]').text()).toBe('5');
  });
});
```

### E2E Tests
**Purpose**: Test complete user workflows
**Tools**: Cypress
**Coverage**: Critical paths 100%

```typescript
describe('Project Creation Flow', () => {
  it('should create a new project from GitHub', () => {
    cy.login();
    cy.visit('/projects/create');
    
    cy.getByCy('github-integration').click();
    cy.getByCy('repo-item').first().click();
    cy.getByCy('project-name-input').type('Test Project');
    cy.getByCy('create-project-submit').click();
    
    cy.url().should('include', '/projects/');
    cy.getByCy('project-title').should('contain', 'Test Project');
  });
});
```

## Unit Testing Guidelines

### Component Testing Structure

```typescript
describe('ComponentName', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    wrapper = mount(ComponentName, {
      props: { /* default props */ },
      global: {
        stubs: { /* component stubs */ }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });
  });

  describe('Prop Validation', () => {
    it('should display error for invalid prop', async () => {
      await wrapper.setProps({ invalidProp: 'invalid' });
      expect(wrapper.find('.error').exists()).toBe(true);
    });
  });
});
```

### Mocking Guidelines

#### Mocking External Dependencies
```typescript
// Mock external libraries
vi.mock('@iconify/vue', () => ({
  Icon: { template: '<span data-testid="icon" />' }
}));

// Mock API calls
vi.mock('@/api/repository', () => ({
  fetchProjects: vi.fn().mockResolvedValue(mockProjects)
}));
```

#### Mocking Stores (Pinia)
```typescript
import { createTestingPinia } from '@pinia/testing';

const wrapper = mount(Component, {
  global: {
    plugins: [createTestingPinia({
      createSpy: vi.fn
    })]
  }
});
```

#### Mocking Router
```typescript
const mockRouter = {
  push: vi.fn(),
  currentRoute: { value: { params: { id: '123' } } }
};

const wrapper = mount(Component, {
  global: {
    mocks: {
      $router: mockRouter
    }
  }
});
```

### Testing Async Components

```typescript
describe('AsyncComponent', () => {
  it('should handle loading states', async () => {
    const wrapper = mount(AsyncComponent);
    
    // Check loading state
    expect(wrapper.find('.loading').exists()).toBe(true);
    
    // Wait for async operation
    await wrapper.vm.$nextTick();
    await flushPromises();
    
    // Check loaded state
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.find('.content').exists()).toBe(true);
  });
});
```

## Integration Testing

### Testing Component Composition

```typescript
describe('UserProfile Integration', () => {
  it('should update profile when form is submitted', async () => {
    const mockUpdateUser = vi.fn().mockResolvedValue({ success: true });
    
    const wrapper = mount(UserProfile, {
      global: {
        provide: {
          userService: { updateUser: mockUpdateUser }
        }
      }
    });
    
    // Fill form
    await wrapper.find('[data-testid="name-input"]').setValue('John Doe');
    await wrapper.find('[data-testid="email-input"]').setValue('john@example.com');
    
    // Submit form
    await wrapper.find('form').trigger('submit');
    
    // Verify API call
    expect(mockUpdateUser).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    });
    
    // Verify UI update
    expect(wrapper.find('.success-message').exists()).toBe(true);
  });
});
```

### Testing Error Boundaries

```typescript
describe('Error Handling', () => {
  it('should display error message when API fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('API Error'));
    
    const wrapper = mount(DataList, {
      global: {
        provide: { apiService: { fetchData: mockFetch } }
      }
    });
    
    await flushPromises();
    
    expect(wrapper.find('.error-message').text()).toContain('API Error');
    expect(wrapper.find('.retry-button').exists()).toBe(true);
  });
});
```

## E2E Testing Best Practices

### Page Object Pattern

```typescript
// cypress/support/pages/LoginPage.ts
export class LoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  fillEmail(email: string) {
    cy.getByCy('email-input').type(email);
    return this;
  }

  fillPassword(password: string) {
    cy.getByCy('password-input').type(password);
    return this;
  }

  submit() {
    cy.getByCy('login-submit').click();
    return this;
  }

  shouldRedirectToDashboard() {
    cy.url().should('include', '/dashboard');
    return this;
  }
}

// Usage in tests
describe('Authentication', () => {
  it('should log in successfully', () => {
    new LoginPage()
      .visit()
      .fillEmail('user@example.com')
      .fillPassword('password123')
      .submit()
      .shouldRedirectToDashboard();
  });
});
```

### Custom Commands

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('loginAs', (userType: 'admin' | 'user') => {
  const credentials = {
    admin: { email: 'admin@test.com', password: 'admin123' },
    user: { email: 'user@test.com', password: 'user123' }
  };

  const { email, password } = credentials[userType];
  
  cy.visit('/login');
  cy.getByCy('email-input').type(email);
  cy.getByCy('password-input').type(password);
  cy.getByCy('login-submit').click();
  cy.url().should('not.include', '/login');
});
```

### Data Attributes for Testing

```vue
<!-- ✅ Good - Use data-cy attributes for test selectors -->
<template>
  <div>
    <input data-cy="search-input" v-model="searchTerm" />
    <button data-cy="search-submit" @click="search">Search</button>
    <div data-cy="results-list">
      <div 
        v-for="item in results" 
        :key="item.id"
        data-cy="result-item"
      >
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
```

## Performance Testing

### Component Performance

```typescript
import { measureComponentPerformance } from '@/tests/utils/performance-utils';

describe('DataTable Performance', () => {
  it('should render large datasets efficiently', async () => {
    const largeDataset = generateMockData(1000);
    
    const metrics = await measureComponentPerformance(() => {
      return mount(DataTable, {
        props: { data: largeDataset }
      });
    });
    
    expect(metrics.renderTime).toBeLessThan(100); // 100ms threshold
    expect(metrics.memoryUsage.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

### Memory Leak Detection

```typescript
import { detectMemoryLeaks } from '@/tests/utils/performance-utils';

describe('Memory Management', () => {
  it('should not leak memory during component lifecycle', async () => {
    const leakTest = await detectMemoryLeaks(() => {
      return mount(ComplexComponent, { props: mockProps });
    });
    
    expect(leakTest.hasLeak).toBe(false);
    expect(leakTest.memoryGrowth).toBeLessThan(1024 * 1024); // 1MB threshold
  });
});
```

## Accessibility Testing

### Automated A11y Testing

```typescript
import { expectNoAccessibilityViolations } from '@/tests/utils/accessibility-utils';

describe('LoginForm Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const wrapper = mount(LoginForm);
    await expectNoAccessibilityViolations(wrapper);
  });
  
  it('should support keyboard navigation', async () => {
    const wrapper = mount(LoginForm);
    
    const emailInput = wrapper.find('[data-cy="email-input"]');
    const passwordInput = wrapper.find('[data-cy="password-input"]');
    const submitButton = wrapper.find('[data-cy="submit-button"]');
    
    // Test tab order
    emailInput.element.focus();
    expect(document.activeElement).toBe(emailInput.element);
    
    // Simulate Tab key
    await emailInput.trigger('keydown', { key: 'Tab' });
    expect(document.activeElement).toBe(passwordInput.element);
  });
});
```

### Screen Reader Testing

```typescript
describe('Screen Reader Support', () => {
  it('should have proper ARIA labels', () => {
    const wrapper = mount(FormComponent);
    
    const input = wrapper.find('input');
    expect(input.attributes('aria-label')).toBeDefined();
    expect(input.attributes('aria-required')).toBe('true');
  });
  
  it('should announce errors to screen readers', async () => {
    const wrapper = mount(FormComponent);
    
    await wrapper.find('form').trigger('submit');
    
    const errorMessage = wrapper.find('[role="alert"]');
    expect(errorMessage.exists()).toBe(true);
  });
});
```

## Visual Regression Testing

### Component Screenshots

```typescript
// cypress/e2e/visual-regression.cy.ts
describe('Visual Regression', () => {
  it('should capture component states', () => {
    cy.visit('/storybook/Button');
    
    // Default state
    cy.percySnapshot('Button - Default');
    
    // Hover state
    cy.get('[data-cy="button"]').trigger('mouseover');
    cy.percySnapshot('Button - Hover');
    
    // Disabled state
    cy.get('[data-cy="toggle-disabled"]').click();
    cy.percySnapshot('Button - Disabled');
  });
});
```

### Responsive Testing

```typescript
describe('Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];
  
  viewports.forEach(viewport => {
    it(`should render correctly on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/dashboard');
      cy.percySnapshot(`Dashboard - ${viewport.name}`);
    });
  });
});
```

## Test Organization

### File Structure

```
tests/
├── unit/                 # Unit tests
│   ├── components/       # Component tests
│   ├── stores/          # Store tests
│   └── utils/           # Utility tests
├── integration/         # Integration tests
│   ├── components/      # Component integration
│   ├── workflows/       # User workflow tests
│   └── accessibility/   # A11y tests
├── performance/         # Performance tests
├── utils/              # Test utilities
│   ├── test-utils.ts   # Test helpers
│   ├── data-factories.ts # Mock data
│   └── accessibility-utils.ts
└── fixtures/           # Test data files
```

### Naming Conventions

```typescript
// File naming: ComponentName.test.ts
// Describe blocks: describe('ComponentName', () => {})
// Test cases: it('should [expected behavior] when [condition]', () => {})

describe('SearchBar', () => {
  describe('when user types in search input', () => {
    it('should emit search event with query text', () => {
      // Test implementation
    });
    
    it('should debounce rapid typing', () => {
      // Test implementation
    });
  });
  
  describe('when search is cleared', () => {
    it('should emit empty search event', () => {
      // Test implementation
    });
  });
});
```

## Common Patterns

### Test Data Factories

```typescript
// tests/utils/data-factories.ts
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  active: true,
  ...overrides
});

export const createMockProject = (overrides = {}) => ({
  id: 'project-456',
  name: 'Test Project',
  language: 'TypeScript',
  vulnerabilities: 5,
  ...overrides
});
```

### Async Testing Helpers

```typescript
export const waitForApiCall = () => new Promise(resolve => setTimeout(resolve, 0));

export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForElement = async (wrapper: VueWrapper, selector: string) => {
  let element;
  let attempts = 0;
  
  while (!element && attempts < 10) {
    await wrapper.vm.$nextTick();
    element = wrapper.find(selector);
    if (!element.exists()) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }
  
  return element;
};
```

### Component Test Wrapper

```typescript
export const createTestWrapper = (component: any, options = {}) => {
  return mount(component, {
    global: {
      plugins: [
        createTestingPinia(),
        router
      ],
      stubs: {
        Icon: true,
        Teleport: true
      },
      ...options.global
    },
    ...options
  });
};
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out
```typescript
// ❌ Problem: Test hangs waiting for async operation
it('should load data', async () => {
  const wrapper = mount(Component);
  // Missing await or flushPromises
  expect(wrapper.text()).toContain('data');
});

// ✅ Solution: Properly handle async operations
it('should load data', async () => {
  const wrapper = mount(Component);
  await flushPromises();
  expect(wrapper.text()).toContain('data');
});
```

#### 2. Flaky Tests
```typescript
// ❌ Problem: Race conditions in async tests
it('should update counter', async () => {
  const wrapper = mount(Counter);
  wrapper.find('button').trigger('click');
  expect(wrapper.text()).toContain('1'); // May fail if not immediate
});

// ✅ Solution: Wait for DOM updates
it('should update counter', async () => {
  const wrapper = mount(Counter);
  await wrapper.find('button').trigger('click');
  await wrapper.vm.$nextTick();
  expect(wrapper.text()).toContain('1');
});
```

#### 3. Mock Not Working
```typescript
// ❌ Problem: Mock applied after component mount
const wrapper = mount(Component);
vi.mocked(apiCall).mockResolvedValue(data);

// ✅ Solution: Apply mocks before mounting
vi.mocked(apiCall).mockResolvedValue(data);
const wrapper = mount(Component);
```

### Debugging Tips

1. **Use `console.log` in tests** for debugging state
2. **Check `wrapper.html()`** to see rendered output
3. **Use `findAll()` instead of `find()`** to see all matching elements
4. **Add `await wrapper.vm.$nextTick()`** after state changes
5. **Use `cy.debug()`** in Cypress for interactive debugging

### Performance Debugging

```typescript
// Measure test execution time
const start = performance.now();
// ... test code ...
const end = performance.now();
console.log(`Test took ${end - start}ms`);

// Check memory usage
if (window.performance.memory) {
  console.log('Memory:', window.performance.memory);
}
```

## Testing Checklist

### Before Writing Tests
- [ ] Understand the component's purpose and behavior
- [ ] Identify all user interactions and edge cases
- [ ] Plan test data and mocking strategy
- [ ] Choose appropriate test type (unit/integration/e2e)

### During Test Development
- [ ] Write descriptive test names
- [ ] Test behavior, not implementation
- [ ] Cover happy path and error cases
- [ ] Handle async operations properly
- [ ] Clean up after each test

### Before Committing
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Tests run in reasonable time (<5s for unit tests)
- [ ] Code coverage meets targets
- [ ] Tests are readable and maintainable

Remember: **Good tests are your safety net**. Invest time in writing comprehensive, maintainable tests that give you confidence to refactor and add features.