import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'
import { vi } from 'vitest'

// Basic router for testing
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/:pathMatch(.*)*', component: { template: '<div>Not Found</div>' } }
  ]
})

interface CustomRenderOptions extends Omit<RenderOptions, 'global'> {
  global?: RenderOptions['global'] & {
    plugins?: any[]
    mocks?: Record<string, any>
  }
}

export function renderWithProviders(
  component: Component,
  options: CustomRenderOptions = {}
) {
  const pinia = createPinia()
  
  const defaultGlobal = {
    plugins: [pinia, router],
    mocks: {
      $t: (key: string) => key, // Mock i18n
    },
    stubs: {
      'router-link': true,
      'router-view': true,
    },
  }

  return render(component, {
    ...options,
    global: {
      ...defaultGlobal,
      ...options.global,
      plugins: [
        ...defaultGlobal.plugins,
        ...(options.global?.plugins || [])
      ],
      mocks: {
        ...defaultGlobal.mocks,
        ...options.global?.mocks,
      },
    },
  })
}

/**
 * Enhanced testing utilities with common mocks and helpers
 */

// Global mocks that can be used across tests
export const mockStores = {
  user: {
    getUser: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
    getDefaultOrg: { id: 'test-org', name: 'Test Org' },
    setUser: vi.fn(),
    setDefaultOrg: vi.fn(),
    $reset: vi.fn()
  },
  auth: {
    getToken: 'mock-token',
    initialized: true,
    authenticated: true,
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
    $reset: vi.fn()
  },
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: {
      value: {
        path: '/',
        params: {},
        query: {},
        name: 'home'
      }
    }
  },
  state: {
    page: 'projects',
    $reset: vi.fn()
  }
}

// Helper to create component wrapper with common mocks
export const createTestWrapper = (component: Component, options: CustomRenderOptions = {}) => {
  return renderWithProviders(component, {
    ...options,
    global: {
      ...options.global,
      mocks: {
        ...mockStores,
        ...options.global?.mocks
      }
    }
  })
}

// Helper to mock repositories
export const createRepositoryMock = <T extends Record<string, any>>(methods: Partial<T> = {}) => {
  const mockRepo: Record<string, any> = {}
  
  // Create vi.fn() mocks for all methods
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      mockRepo[key] = vi.fn().mockImplementation(value)
    } else {
      mockRepo[key] = vi.fn().mockResolvedValue(value)
    }
  }
  
  return mockRepo as any
}

export * from '@testing-library/vue'
export { userEvent } from '@testing-library/user-event'
// Test utilities ready for use