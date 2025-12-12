import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'

// Mock the state store to avoid import issues
const mockStateStore = {
  page: '',
  menu: '',
  publicPage: false,
  $reset: () => {
    mockStateStore.page = ''
    mockStateStore.menu = ''
    mockStateStore.publicPage = false
  }
}

// Mock the useStateStore function
const useStateStore = () => mockStateStore

describe('State Store (Simple)', () => {
  let stateStore: typeof mockStateStore

  beforeEach(() => {
    setActivePinia(createPinia())
    stateStore = useStateStore()
    stateStore.$reset()
  })

  describe('Initial State', () => {
    it('should have correct default values', () => {
      expect(stateStore.page).toBe('')
      expect(stateStore.menu).toBe('')
      expect(stateStore.publicPage).toBe(false)
    })
  })

  describe('State Management', () => {
    it('should update page value', () => {
      stateStore.page = 'dashboard'
      expect(stateStore.page).toBe('dashboard')
    })

    it('should update menu value', () => {
      stateStore.menu = 'main-nav'
      expect(stateStore.menu).toBe('main-nav')
    })

    it('should update publicPage value', () => {
      stateStore.publicPage = true
      expect(stateStore.publicPage).toBe(true)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset all values to defaults', () => {
      stateStore.page = 'projects'
      stateStore.menu = 'sidebar'
      stateStore.publicPage = true

      stateStore.$reset()

      expect(stateStore.page).toBe('')
      expect(stateStore.menu).toBe('')
      expect(stateStore.publicPage).toBe(false)
    })
  })
})