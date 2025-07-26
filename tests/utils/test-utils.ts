import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'
import { vi } from 'vitest'
import { createMockUserStore, createMockAuthStore, createMockRouter } from './data-factories'

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
  user: createMockUserStore(),
  auth: createMockAuthStore(),
  router: createMockRouter()
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
  
  return mockRepo as jest.Mocked<T>
}

export * from '@testing-library/vue'
export { userEvent } from '@testing-library/user-event'
export * from './data-factories'