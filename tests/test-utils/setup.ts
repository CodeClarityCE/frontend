import { config, type VueWrapper } from '@vue/test-utils'
import { vi } from 'vitest'
import type { ComponentPublicInstance, Plugin } from 'vue'

// Create a singleton pinia mock instance
let piniaInstance: Plugin | null = null

export function getPiniaMock(): Plugin {
  piniaInstance ??= {
    install: vi.fn(),
    state: vi.fn(),
    _p: [],
    _a: null,
    _e: null,
    _s: new Map(),
    use: vi.fn(),
  }
  return piniaInstance
}

// Reset pinia instance between tests
export function resetPiniaMock(): void {
  if (piniaInstance && '_s' in piniaInstance && piniaInstance._s instanceof Map) {
    piniaInstance._s.clear()
    piniaInstance._p = []
    piniaInstance._a = null
    piniaInstance._e = null
  }
}

// Setup global test configuration
export function setupGlobalTestConfig(): { pinia: Plugin } {
  // Clear any existing plugins to prevent duplicates
  config.global.plugins = []

  // Add pinia mock
  const pinia = getPiniaMock()
  config.global.plugins.push(pinia)

  // Return the pinia instance for use in tests
  return { pinia }
}

// Helper to mount components with proper setup
export function mountWithSetup<T extends ComponentPublicInstance>(
  component: Parameters<typeof import('@vue/test-utils').mount>[0],
  options: Record<string, unknown> = {}
): {
  wrapper: VueWrapper<T> | null;
  pinia: Plugin;
  mount(mountOptions?: Record<string, unknown>): Promise<VueWrapper<T>>;
} {
  const { pinia } = setupGlobalTestConfig()

  return {
    wrapper: null,
    pinia,
    async mount(mountOptions: Record<string, unknown> = {}): Promise<VueWrapper<T>> {
      // Merge options
      const globalOptions = options.global as Record<string, unknown> | undefined
      const mountGlobalOptions = mountOptions.global as Record<string, unknown> | undefined
      const finalOptions = {
        ...options,
        ...mountOptions,
        global: {
          ...globalOptions,
          ...mountGlobalOptions,
          plugins: [pinia, ...((mountGlobalOptions?.plugins as Plugin[]) ?? [])]
        }
      }

      // Import mount function
      const { mount } = await import('@vue/test-utils')
      this.wrapper = mount(component, finalOptions) as VueWrapper<T>
      return this.wrapper
    }
  }
}

// Common store mocks
export const mockStores = {
  user: {
    getDefaultOrg: { id: 'test-org-id', name: 'Test Org' },
    getUser: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
    getOrganizations: [{ id: 'test-org-id', name: 'Test Org' }],
    setUser: vi.fn(),
    setDefaultOrg: vi.fn(),
    setOrganizations: vi.fn(),
    $reset: vi.fn(),
    $patch: vi.fn()
  },
  auth: {
    initialized: true,
    token: 'test-token',
    tokenExpiry: new Date(Date.now() + 3600000),
    refreshToken: 'test-refresh-token',
    refreshTokenExpiry: new Date(Date.now() + 7200000),
    authenticated: true,
    socialAuthState: 'test-social-state',
    getToken: 'test-token',
    getRefreshToken: 'test-refresh-token',
    getTokenExpiry: new Date(Date.now() + 3600000),
    getRefreshTokenExpiry: new Date(Date.now() + 7200000),
    getAuthenticated: true,
    getInitialized: true,
    getSocialAuthState: 'test-social-state',
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setTokenExpiry: vi.fn(),
    setRefreshTokenExpiry: vi.fn(),
    setAuthenticated: vi.fn(),
    setInitialized: vi.fn(),
    setSocialAuthState: vi.fn(),
    $reset: vi.fn(),
    $patch: vi.fn()
  },
  state: {
    $reset: vi.fn(),
    page: 'test-page',
    loading: false,
    error: null
  }
}

// Mock store factory
export function createStoreMock(storeName: keyof typeof mockStores): ReturnType<typeof vi.fn> {
  return vi.fn(() => mockStores[storeName]) as ReturnType<typeof vi.fn>
}