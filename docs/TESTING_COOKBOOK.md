# Frontend Testing Cookbook

Practical recipes for common testing scenarios in the CodeClarity frontend.

## Table of Contents

1. [Component Testing Recipes](#component-testing-recipes)
2. [Store Testing Recipes](#store-testing-recipes)
3. [API Testing Recipes](#api-testing-recipes)
4. [Form Testing Recipes](#form-testing-recipes)
5. [Navigation Testing Recipes](#navigation-testing-recipes)
6. [Performance Testing Recipes](#performance-testing-recipes)
7. [Accessibility Testing Recipes](#accessibility-testing-recipes)
8. [E2E Testing Recipes](#e2e-testing-recipes)

## Component Testing Recipes

### Recipe 1: Testing a Search Component

```typescript
// tests/unit/components/SearchBar.test.ts
import { mount } from '@vue/test-utils';
import SearchBar from '@/base_components/filters/SearchBar.vue';

describe('SearchBar', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(SearchBar, {
      props: {
        placeholder: 'Search packages...'
      },
      global: {
        stubs: {
          Icon: true
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('should emit search event on input change', async () => {
    const input = wrapper.find('input');
    await input.setValue('react');
    
    expect(wrapper.emitted('update:searchKey')).toEqual([['react']]);
  });

  it('should handle rapid typing without performance issues', async () => {
    const input = wrapper.find('input');
    const searchTerms = ['r', 're', 'rea', 'reac', 'react'];
    
    for (const term of searchTerms) {
      await input.setValue(term);
    }
    
    const events = wrapper.emitted('update:searchKey');
    expect(events).toHaveLength(searchTerms.length);
    expect(events[events.length - 1]).toEqual(['react']);
  });

  it('should support keyboard shortcuts', async () => {
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'Escape' });
    
    // Verify escape clears the input (if implemented)
    expect(wrapper.vm.searchKey).toBe('');
  });
});
```

### Recipe 2: Testing a Data Table Component

```typescript
// tests/unit/components/DataTable.test.ts
import { mount } from '@vue/test-utils';
import DataTable from '@/codeclarity_components/results/sbom/table/DataTable.vue';

describe('DataTable', () => {
  const mockData = [
    { id: '1', name: 'react', version: '18.2.0', license: 'MIT' },
    { id: '2', name: 'vue', version: '3.4.0', license: 'MIT' },
  ];

  const mockColumns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'version', header: 'Version' },
    { accessorKey: 'license', header: 'License' }
  ];

  it('should render table with data', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData
      },
      global: {
        stubs: {
          Icon: true,
          FlexRender: { template: '<div><slot /></div>' }
        }
      }
    });

    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.text()).toContain('react');
    expect(wrapper.text()).toContain('vue');
  });

  it('should handle sorting', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: mockData
      },
      global: {
        stubs: {
          Icon: true,
          FlexRender: { template: '<div><slot /></div>' }
        }
      }
    });

    // Trigger sorting
    await wrapper.setData({ sorting: [{ id: 'name', desc: false }] });
    
    expect(wrapper.vm.sorting).toEqual([{ id: 'name', desc: false }]);
  });

  it('should handle empty data gracefully', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: mockColumns,
        data: []
      },
      global: {
        stubs: {
          Icon: true,
          FlexRender: { template: '<div><slot /></div>' }
        }
      }
    });

    expect(wrapper.find('table').exists()).toBe(true);
    // Should show empty state message
  });
});
```

### Recipe 3: Testing Modal Components

```typescript
// tests/unit/components/Modal.test.ts
import { mount } from '@vue/test-utils';
import Modal from '@/base_components/ui/modals/CenteredModal.vue';

describe('Modal', () => {
  it('should render when open', () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true,
        title: 'Test Modal'
      },
      slots: {
        default: '<p>Modal content</p>'
      }
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Modal');
    expect(wrapper.text()).toContain('Modal content');
  });

  it('should not render when closed', () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: false,
        title: 'Test Modal'
      }
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('should emit close event when escape is pressed', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true,
        title: 'Test Modal'
      }
    });

    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should trap focus within modal', async () => {
    const wrapper = mount(Modal, {
      props: {
        isOpen: true,
        title: 'Test Modal'
      },
      slots: {
        default: `
          <input data-testid="first-input" />
          <button data-testid="button">Click me</button>
          <input data-testid="last-input" />
        `
      }
    });

    // Test focus trapping implementation
    const firstInput = wrapper.find('[data-testid="first-input"]');
    const lastInput = wrapper.find('[data-testid="last-input"]');
    
    // Focus should cycle within modal
    await lastInput.trigger('keydown', { key: 'Tab' });
    // Should focus first element (implementation dependent)
  });
});
```

## Store Testing Recipes

### Recipe 4: Testing Pinia Store

```typescript
// tests/unit/stores/auth.test.ts
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const store = useAuthStore();
    
    expect(store.getAuthenticated).toBe(false);
    expect(store.getUser).toBeNull();
    expect(store.getToken).toBeNull();
  });

  it('should handle login', () => {
    const store = useAuthStore();
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockToken = 'mock-token';

    store.setUser(mockUser);
    store.setRefreshToken(mockToken);

    expect(store.getAuthenticated).toBe(true);
    expect(store.getUser).toEqual(mockUser);
    expect(store.getToken).toBe(mockToken);
  });

  it('should handle logout', () => {
    const store = useAuthStore();
    
    // Set initial state
    store.setUser({ id: '1', email: 'test@example.com' });
    store.setRefreshToken('token');

    // Logout
    store.$reset();

    expect(store.getAuthenticated).toBe(false);
    expect(store.getUser).toBeNull();
    expect(store.getToken).toBeNull();
  });

  it('should persist state to localStorage', () => {
    const store = useAuthStore();
    const mockUser = { id: '1', email: 'test@example.com' };

    store.setUser(mockUser);
    store.saveAuthStoreToLocalStorage();

    // Check localStorage
    const stored = localStorage.getItem('auth_store');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.user).toEqual(mockUser);
  });
});
```

### Recipe 5: Testing Store with Async Actions

```typescript
// tests/unit/stores/projects.test.ts
import { setActivePinia, createPinia } from 'pinia';
import { useProjectsStore } from '@/stores/projects';
import { vi } from 'vitest';

// Mock the API
vi.mock('@/api/projects', () => ({
  fetchProjects: vi.fn(),
  createProject: vi.fn()
}));

describe('Projects Store', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useProjectsStore();
    vi.clearAllMocks();
  });

  it('should load projects successfully', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' }
    ];

    const { fetchProjects } = await import('@/api/projects');
    vi.mocked(fetchProjects).mockResolvedValue(mockProjects);

    await store.loadProjects();

    expect(store.projects).toEqual(mockProjects);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('should handle API errors', async () => {
    const { fetchProjects } = await import('@/api/projects');
    const error = new Error('API Error');
    vi.mocked(fetchProjects).mockRejectedValue(error);

    await store.loadProjects();

    expect(store.projects).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe(error.message);
  });
});
```

## API Testing Recipes

### Recipe 6: Testing API Repository

```typescript
// tests/unit/api/projects.repository.test.ts
import { ProjectsRepository } from '@/api/projects.repository';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

describe('ProjectsRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new ProjectsRepository();
    vi.clearAllMocks();
  });

  it('should fetch projects successfully', async () => {
    const mockProjects = [{ id: '1', name: 'Test Project' }];
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProjects)
    } as Response);

    const result = await repository.getProjects();
    
    expect(fetch).toHaveBeenCalledWith('/api/projects', {
      method: 'GET',
      headers: expect.objectContaining({
        'Content-Type': 'application/json'
      })
    });
    expect(result).toEqual(mockProjects);
  });

  it('should handle HTTP errors', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as Response);

    await expect(repository.getProjects()).rejects.toThrow('HTTP 404: Not Found');
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network Error'));

    await expect(repository.getProjects()).rejects.toThrow('Network Error');
  });
});
```

### Recipe 7: Testing with MSW (Mock Service Worker)

```typescript
// tests/utils/msw-handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/projects', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'Project 1', language: 'TypeScript' },
        { id: '2', name: 'Project 2', language: 'JavaScript' }
      ])
    );
  }),

  rest.post('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: '3', name: 'New Project' })
    );
  }),

  rest.get('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({ id, name: `Project ${id}`, language: 'TypeScript' })
    );
  })
];

// tests/unit/components/ProjectList.test.ts
import { setupServer } from 'msw/node';
import { handlers } from '../utils/msw-handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProjectList with API', () => {
  it('should load and display projects', async () => {
    const wrapper = mount(ProjectList);
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(wrapper.text()).toContain('Project 1');
      expect(wrapper.text()).toContain('Project 2');
    });
  });

  it('should handle API errors', async () => {
    server.use(
      rest.get('/api/projects', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
      })
    );

    const wrapper = mount(ProjectList);
    
    await waitFor(() => {
      expect(wrapper.text()).toContain('Error loading projects');
    });
  });
});
```

## Form Testing Recipes

### Recipe 8: Testing Form Validation

```typescript
// tests/unit/components/LoginForm.test.ts
import { mount } from '@vue/test-utils';
import LoginForm from '@/codeclarity_components/authentication/signin/UserAuthForm.vue';

describe('LoginForm Validation', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(LoginForm, {
      global: {
        stubs: {
          Icon: true,
          Alert: { template: '<div class="alert"><slot /></div>' },
          AlertDescription: { template: '<div><slot /></div>' }
        }
      }
    });
  });

  it('should show error for invalid email', async () => {
    const emailInput = wrapper.find('input[type="email"]');
    
    await emailInput.setValue('invalid-email');
    await emailInput.trigger('blur');
    
    expect(wrapper.text()).toContain('Invalid email');
  });

  it('should show error for short password', async () => {
    const passwordInput = wrapper.find('input[type="password"]');
    
    await passwordInput.setValue('123');
    await passwordInput.trigger('blur');
    
    expect(wrapper.text()).toContain('at least 10 character');
  });

  it('should prevent submission with invalid data', async () => {
    const form = wrapper.find('form');
    
    await form.trigger('submit');
    
    expect(wrapper.emitted('submit')).toBeFalsy();
    expect(wrapper.find('.alert').exists()).toBe(true);
  });

  it('should submit with valid data', async () => {
    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    
    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('validpassword123');
    
    const form = wrapper.find('form');
    await form.trigger('submit');
    
    // Should trigger login process
    expect(wrapper.vm.loading).toBe(true);
  });
});
```

### Recipe 9: Testing Form with File Upload

```typescript
// tests/unit/components/FileUpload.test.ts
import { mount } from '@vue/test-utils';
import FileUpload from '@/components/FileUpload.vue';

describe('FileUpload', () => {
  it('should handle file selection', async () => {
    const wrapper = mount(FileUpload);
    const fileInput = wrapper.find('input[type="file"]');
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false
    });
    
    await fileInput.trigger('change');
    
    expect(wrapper.emitted('file-selected')).toBeTruthy();
    expect(wrapper.emitted('file-selected')[0]).toEqual([file]);
  });

  it('should validate file type', async () => {
    const wrapper = mount(FileUpload, {
      props: {
        acceptedTypes: ['.txt', '.csv']
      }
    });
    
    const fileInput = wrapper.find('input[type="file"]');
    const invalidFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput.element, 'files', {
      value: [invalidFile],
      writable: false
    });
    
    await fileInput.trigger('change');
    
    expect(wrapper.text()).toContain('Invalid file type');
    expect(wrapper.emitted('file-selected')).toBeFalsy();
  });

  it('should validate file size', async () => {
    const wrapper = mount(FileUpload, {
      props: {
        maxSize: 1024 // 1KB
      }
    });
    
    const fileInput = wrapper.find('input[type="file"]');
    const largeFile = new File(['x'.repeat(2048)], 'large.txt');
    
    Object.defineProperty(fileInput.element, 'files', {
      value: [largeFile],
      writable: false
    });
    
    await fileInput.trigger('change');
    
    expect(wrapper.text()).toContain('File too large');
  });
});
```

## Navigation Testing Recipes

### Recipe 10: Testing Vue Router Integration

```typescript
// tests/unit/components/Navigation.test.ts
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import Navigation from '@/components/Navigation.vue';

const routes = [
  { path: '/', component: { template: '<div>Home</div>' } },
  { path: '/projects', component: { template: '<div>Projects</div>' } },
  { path: '/settings', component: { template: '<div>Settings</div>' } }
];

describe('Navigation', () => {
  let router;

  beforeEach(async () => {
    router = createRouter({
      history: createWebHistory(),
      routes
    });
    
    router.push('/');
    await router.isReady();
  });

  it('should navigate to projects page', async () => {
    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    });

    await wrapper.find('[data-testid="projects-link"]').trigger('click');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/projects');
  });

  it('should highlight active route', async () => {
    router.push('/projects');
    await router.isReady();

    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    });

    const projectsLink = wrapper.find('[data-testid="projects-link"]');
    expect(projectsLink.classes()).toContain('active');
  });

  it('should handle route guards', async () => {
    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    });

    // Mock unauthorized user
    const mockAuthStore = { isAuthenticated: false };
    
    await wrapper.find('[data-testid="settings-link"]').trigger('click');
    
    // Should redirect to login if not authenticated
    expect(router.currentRoute.value.path).toBe('/login');
  });
});
```

## Performance Testing Recipes

### Recipe 11: Testing Component Render Performance

```typescript
// tests/performance/ComponentPerformance.test.ts
import { mount } from '@vue/test-utils';
import { measureComponentPerformance } from '@/tests/utils/performance-utils';
import LargeDataTable from '@/components/LargeDataTable.vue';

describe('Component Performance', () => {
  it('should render large dataset within time budget', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }));

    const metrics = await measureComponentPerformance(() => {
      return mount(LargeDataTable, {
        props: { data: largeDataset }
      });
    });

    expect(metrics.renderTime).toBeLessThan(100); // 100ms budget
    expect(metrics.mountTime).toBeLessThan(50);   // 50ms budget
  });

  it('should not leak memory during re-renders', async () => {
    const wrapper = mount(LargeDataTable, {
      props: { data: [] }
    });

    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    // Trigger multiple re-renders
    for (let i = 0; i < 10; i++) {
      await wrapper.setProps({ 
        data: Array.from({ length: 100 }, (_, j) => ({ id: j, name: `Item ${j}` }))
      });
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryGrowth = finalMemory - initialMemory;

    expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // 5MB threshold
  });
});
```

### Recipe 12: Testing Bundle Size

```typescript
// tests/performance/BundleSize.test.ts
import { analyzeBundle } from '@/tests/utils/bundle-analyzer';

describe('Bundle Size', () => {
  it('should meet size budgets', async () => {
    const analysis = await analyzeBundle();

    expect(analysis.totalSize).toBeLessThan(500 * 1024); // 500KB
    expect(analysis.vendor.size).toBeLessThan(300 * 1024); // 300KB
    expect(analysis.app.size).toBeLessThan(200 * 1024); // 200KB
  });

  it('should not include development dependencies', async () => {
    const analysis = await analyzeBundle();
    
    const devDeps = ['@vitejs', 'cypress', 'vitest'];
    const bundleModules = analysis.modules.map(m => m.name);
    
    devDeps.forEach(dep => {
      expect(bundleModules).not.toContain(dep);
    });
  });
});
```

## Accessibility Testing Recipes

### Recipe 13: Testing Screen Reader Support

```typescript
// tests/accessibility/ScreenReader.test.ts
import { mount } from '@vue/test-utils';
import { expectNoAccessibilityViolations } from '@/tests/utils/accessibility-utils';
import DataTable from '@/components/DataTable.vue';

describe('Screen Reader Support', () => {
  it('should have proper table headers', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns
      }
    });

    const headers = wrapper.findAll('th');
    headers.forEach(header => {
      expect(header.attributes('scope')).toBe('col');
    });

    await expectNoAccessibilityViolations(wrapper);
  });

  it('should announce table changes to screen readers', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns
      }
    });

    // Add aria-live region for announcements
    const liveRegion = wrapper.find('[aria-live]');
    expect(liveRegion.exists()).toBe(true);

    // Trigger sorting
    await wrapper.find('[data-testid="sort-name"]').trigger('click');

    expect(liveRegion.text()).toContain('sorted by name');
  });

  it('should support keyboard navigation', async () => {
    const wrapper = mount(DataTable, {
      props: {
        data: mockData,
        columns: mockColumns
      }
    });

    const firstCell = wrapper.find('td');
    firstCell.element.focus();

    // Test arrow key navigation
    await firstCell.trigger('keydown', { key: 'ArrowRight' });
    
    // Should move focus to next cell
    const nextCell = wrapper.findAll('td')[1];
    expect(document.activeElement).toBe(nextCell.element);
  });
});
```

## E2E Testing Recipes

### Recipe 14: Testing Complete User Flows

```typescript
// cypress/e2e/user-workflow.cy.ts
describe('Complete Project Analysis Workflow', () => {
  beforeEach(() => {
    cy.login();
  });

  it('should complete project creation and analysis', () => {
    // Navigate to project creation
    cy.visit('/projects');
    cy.getByCy('create-project-button').click();

    // Select GitHub integration
    cy.getByCy('github-integration').click();
    cy.getByCy('repo-item').first().click();

    // Configure project
    cy.getByCy('project-name-input').type('E2E Test Project');
    cy.getByCy('project-description').type('Created via E2E test');

    // Create project
    cy.getByCy('create-project-submit').click();
    cy.getByCy('project-created-success').should('be.visible');

    // Start analysis
    cy.getByCy('run-analysis-button').click();
    cy.getByCy('start-analysis').click();

    // Wait for analysis to complete
    cy.getByCy('analysis-progress', { timeout: 30000 }).should('not.exist');
    cy.getByCy('analysis-complete').should('be.visible');

    // Verify results
    cy.getByCy('vulnerability-count').should('contain.text', /\d+/);
    cy.getByCy('dependency-count').should('contain.text', /\d+/);

    // View detailed results
    cy.getByCy('view-vulnerabilities').click();
    cy.url().should('include', '/vulnerabilities');
    cy.getByCy('vulnerability-table').should('be.visible');
  });

  it('should handle analysis failures gracefully', () => {
    // Mock analysis failure
    cy.intercept('POST', '/api/analyses', {
      statusCode: 500,
      body: { error: 'Analysis failed' }
    }).as('failedAnalysis');

    cy.visit('/projects/test-project');
    cy.getByCy('run-analysis-button').click();
    cy.getByCy('start-analysis').click();

    cy.wait('@failedAnalysis');

    // Should show error message
    cy.getByCy('analysis-error').should('be.visible');
    cy.getByCy('analysis-error').should('contain', 'Analysis failed');

    // Should offer retry
    cy.getByCy('retry-analysis').should('be.visible');
  });
});
```

### Recipe 15: Testing Cross-Browser Compatibility

```typescript
// cypress/e2e/cross-browser.cy.ts
describe('Cross-Browser Compatibility', () => {
  const browsers = ['chrome', 'firefox', 'edge'];

  browsers.forEach(browser => {
    it(`should work correctly in ${browser}`, () => {
      cy.visit('/');
      
      // Test basic functionality
      cy.getByCy('login-form').should('be.visible');
      cy.getByCy('email-input').type('test@example.com');
      cy.getByCy('password-input').type('password123');
      
      // Test specific browser features
      if (browser === 'chrome') {
        // Chrome-specific tests
        cy.window().should('have.property', 'chrome');
      }
      
      if (browser === 'firefox') {
        // Firefox-specific tests
        cy.window().should('have.property', 'navigator');
      }
      
      // Common functionality
      cy.getByCy('login-submit').click();
      cy.url().should('not.include', '/login');
    });
  });

  it('should handle mobile browsers', () => {
    cy.viewport('iphone-x');
    cy.visit('/');
    
    // Mobile-specific interactions
    cy.getByCy('mobile-menu-toggle').click();
    cy.getByCy('mobile-nav').should('be.visible');
    
    // Touch events
    cy.getByCy('project-card').first().trigger('touchstart');
    cy.getByCy('project-card').first().trigger('touchend');
  });
});
```

### Recipe 16: Testing with Real-Time Updates

```typescript
// cypress/e2e/real-time.cy.ts
describe('Real-Time Updates', () => {
  it('should update UI when analysis completes', () => {
    cy.login();
    cy.visit('/dashboard');

    // Initial state
    cy.getByCy('analysis-count').invoke('text').then(initialCount => {
      
      // Simulate real-time update via WebSocket
      cy.window().then(win => {
        win.postMessage({
          type: 'ANALYSIS_COMPLETE',
          data: { id: 'new-analysis', projectId: 'test-project' }
        });
      });

      // Verify UI updates
      cy.getByCy('notification').should('be.visible');
      cy.getByCy('notification').should('contain', 'Analysis completed');
      
      cy.getByCy('analysis-count').should('not.contain', initialCount);
    });
  });

  it('should handle connection loss gracefully', () => {
    cy.login();
    cy.visit('/dashboard');

    // Simulate network disconnection
    cy.intercept('GET', '/api/**', { forceNetworkError: true });

    // Trigger action that requires network
    cy.getByCy('refresh-data').click();

    // Should show offline indicator
    cy.getByCy('offline-indicator').should('be.visible');
    cy.getByCy('offline-message').should('contain', 'connection lost');

    // Should retry when connection restored
    cy.intercept('GET', '/api/**').as('reconnect');
    cy.getByCy('retry-connection').click();
    cy.wait('@reconnect');

    cy.getByCy('offline-indicator').should('not.exist');
  });
});
```

## Tips and Best Practices

### Testing Async Components
```typescript
// Always wait for async operations
await wrapper.vm.$nextTick();
await flushPromises();

// Use waitFor for conditions
await waitFor(() => {
  expect(wrapper.text()).toContain('Expected text');
});
```

### Debugging Tests
```typescript
// Log component HTML for debugging
console.log(wrapper.html());

// Inspect component state
console.log(wrapper.vm.$data);

// Check emitted events
console.log(wrapper.emitted());
```

### Performance Tips
```typescript
// Reuse expensive setups
const sharedSetup = {
  global: {
    plugins: [router, pinia],
    stubs: commonStubs
  }
};

// Clean up properly
afterEach(() => {
  wrapper?.unmount();
  vi.clearAllMocks();
});
```

Remember: These recipes are starting points. Adapt them to your specific component needs and testing requirements!