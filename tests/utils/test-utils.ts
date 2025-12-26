import { render } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { vi } from 'vitest'
import type { Component } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

// Basic router for testing
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/:pathMatch(.*)*', component: { template: '<div>Not Found</div>' } }
  ]
})

interface CustomRenderOptions {
  global?: {
    plugins?: unknown[]
    mocks?: Record<string, unknown>
    stubs?: Record<string, boolean | Component>
  }
}

export function renderWithProviders(
  component: Component,
  options: CustomRenderOptions = {}
): ReturnType<typeof render> {
  const pinia = createPinia()

  const defaultGlobal = {
    plugins: [pinia, router],
    mocks: {
      $t: (key: string): string => key, // Mock i18n
    },
    stubs: {
      'router-link': true,
      'router-view': true,
    },
  }

  const optionsPlugins = (options.global?.plugins ?? []);

  return render(component, {
    ...options,
    global: {
      plugins: [
        ...defaultGlobal.plugins,
        ...(optionsPlugins)
      ],
      mocks: {
        ...defaultGlobal.mocks,
        ...options.global?.mocks,
      },
      stubs: {
        ...defaultGlobal.stubs,
        ...options.global?.stubs,
      },
    },
  } as Parameters<typeof render>[1])
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
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setTokenExpiry: vi.fn(),
    setRefreshTokenExpiry: vi.fn(),
    setSocialAuthState: vi.fn(),
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
export const createTestWrapper = (component: Component, options: CustomRenderOptions = {}): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(component, {
    ...options,
    global: {
      ...options.global,
      mocks: {
        ...mockStores as Record<string, unknown>,
        ...options.global?.mocks
      }
    }
  })
}

// Helper to mock repositories
export const createRepositoryMock = <T extends Record<string, unknown>>(methods: Partial<T> = {}): T => {
  const mockRepo: Record<string, unknown> = {}

  // Create vi.fn() mocks for all methods
  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      // Type assertion for function values
      mockRepo[key] = vi.fn().mockImplementation(value as (...args: unknown[]) => unknown)
    } else {
      mockRepo[key] = vi.fn().mockResolvedValue(value)
    }
  }

  return mockRepo as T
}

export * from '@testing-library/vue'
export { userEvent } from '@testing-library/user-event'
// Test utilities ready for use