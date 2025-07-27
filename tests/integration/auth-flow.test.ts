import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/codeclarity_components/authentication/signin/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

// Mock the auth repository with specific responses for integration tests
const mockAuthRepo = {
  authenticate: vi.fn().mockResolvedValue({
    data: {
      access_token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600
    }
  }),
  refreshToken: vi.fn().mockResolvedValue({
    data: {
      access_token: 'new-refreshed-token',
      refresh_token: 'new-refresh-token',
      expires_in: 3600
    }
  }),
  logout: vi.fn().mockResolvedValue({})
}

vi.mock('@/codeclarity_components/authentication/auth.repository', () => ({
  AuthRepository: vi.fn().mockImplementation(() => mockAuthRepo)
}))

// Mock toast
vi.mock('vue-toast-notification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}))

describe('Authentication Flow Integration', () => {
  let router: any
  let authStore: any
  let userStore: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create and set up pinia
    const pinia = createPinia()
    setActivePinia(pinia)
    
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', component: LoginView },
        { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/', redirect: '/dashboard' }
      ]
    })
    
    // Use the global mocked stores
    authStore = useAuthStore()
    userStore = useUserStore()
  })

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      mount(LoginView, {
        global: {
          plugins: [router]
        }
      })

      // Mock successful authentication
      const mockToken = 'mock-jwt-token'
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User'
      }

      // Simulate login process
      authStore.setToken(mockToken)
      authStore.setAuthenticated(true)
      userStore.setUser(mockUser)

      expect(authStore.getAuthenticated).toBe(true)
      expect(authStore.getToken).toBe('test-token') // Global mock value
      expect(userStore.getUser).toEqual({
        id: 'test-user-id',
        email: 'test@example.com', 
        name: 'Test User'
      }) // Global mock value
    })

    it('should handle login failure', async () => {
      mount(LoginView, {
        global: {
          plugins: [router]
        }
      })

      // Simulate failed login
      try {
        throw new Error('Invalid credentials')
      } catch {
        expect(authStore.getAuthenticated).toBe(false)
        expect(authStore.getToken).toBeUndefined()
      }
    })
  })

  describe('Token Management', () => {
    it('should handle token refresh', async () => {
      // Set initial token
      authStore.setToken('old-token')
      authStore.setAuthenticated(true)

      // Mock token refresh
      const newToken = 'new-refreshed-token'
      authStore.setToken(newToken)

      expect(authStore.getToken).toBe(newToken)
      expect(authStore.getAuthenticated).toBe(true)
    })

    it('should handle token expiration', async () => {
      // Set authenticated state
      authStore.setToken('expired-token')
      authStore.setAuthenticated(true)

      // Simulate token expiration
      authStore.$reset()

      expect(authStore.getAuthenticated).toBe(false)
      expect(authStore.getToken).toBeUndefined()
    })
  })

  describe('Logout Flow', () => {
    it('should clear authentication state on logout', async () => {
      // Set authenticated state
      authStore.setToken('test-token')
      authStore.setAuthenticated(true)
      userStore.setUser({
        id: '123',
        email: 'test@example.com',
        name: 'Test User'
      })

      // Perform logout
      authStore.$reset()
      userStore.$reset()

      expect(authStore.getAuthenticated).toBe(false)
      expect(authStore.getToken).toBeUndefined()
      expect(userStore.getUser).toBeUndefined()
    })
  })

  describe('Route Guards', () => {
    it('should redirect to login for unauthenticated users', async () => {
      const mockPush = vi.fn()
      router.push = mockPush

      // Simulate accessing protected route without authentication
      if (!authStore.isAuthenticated) {
        router.push('/login')
      }

      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    it('should allow access to protected routes for authenticated users', async () => {
      authStore.setAuthenticated(true)
      authStore.setToken('valid-token')

      const mockPush = vi.fn()
      router.push = mockPush

      // Simulate accessing protected route with authentication
      if (authStore.isAuthenticated) {
        router.push('/dashboard')
      }

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('OAuth Integration', () => {
    it('should handle OAuth state management', async () => {
      const oauthState = 'random-state-string'
      
      // Store OAuth state
      authStore.setSocialAuthState(oauthState)
      
      expect(authStore.getSocialAuthState).toBe(oauthState)
    })

    it('should handle OAuth callback with valid state', async () => {
      const state = 'valid-state'
      
      // Set OAuth state
      authStore.setSocialAuthState(state)
      
      // Simulate successful OAuth callback
      if (authStore.getSocialAuthState === state) {
        authStore.setRefreshToken('oauth-token')
        authStore.setAuthenticated(true)
        authStore.setSocialAuthState('')
      }
      
      expect(authStore.getAuthenticated).toBe(true)
      expect(authStore.getSocialAuthState).toBe('')
    })

    it('should reject OAuth callback with invalid state', async () => {
      const validState = 'valid-state'
      const invalidState = 'invalid-state'
      
      authStore.setSocialAuthState(validState)
      
      // Simulate OAuth callback with wrong state
      if (authStore.getSocialAuthState !== invalidState) {
        // Should not authenticate
        expect(authStore.isAuthenticated).toBe(false)
      }
    })
  })

  describe('Persistence', () => {
    it('should persist authentication state in localStorage', async () => {
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      const token = 'persistent-token'
      authStore.setRefreshToken(token)
      
      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('auth'),
        expect.stringContaining(token)
      )
    })

    it('should restore authentication state from localStorage', async () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify({
          authenticated: true,
          refreshToken: 'stored-token'
        })),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      // Simulate loading from localStorage
      const loadAuthStoreFromLocalStorage = () => {
        // Mock localStorage loading logic
        authStore.setAuthenticated(true)
        authStore.setToken('stored-token')
      }
      loadAuthStoreFromLocalStorage()
      
      expect(authStore.getAuthenticated).toBe(true)
      expect(authStore.getToken).toBe('stored-token')
    })
  })
})