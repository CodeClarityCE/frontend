import 'reflect-metadata'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock Icon component globally for tests
config.global.stubs = {
  Icon: {
    name: 'Icon',
    props: ['icon', 'class', 'width', 'height', 'style'],
    template: '<span class="mock-icon" :class="$props.class">{{ icon }}</span>'
  },
  tippy: {
    name: 'tippy',
    props: ['content', 'placement', 'trigger'],
    template: '<div class="mock-tippy"><slot /></div>'
  }
}

// Mock global objects
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock router
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    }),
    useRoute: () => ({
      params: {},
      query: {},
      path: '/',
      name: '',
      meta: {},
    }),
    RouterLink: {
      name: 'RouterLink',
      template: '<a v-bind="$attrs"><slot /></a>',
      props: ['to']
    }
  }
})

// Mock Pinia
vi.mock('pinia', () => ({
  createPinia: vi.fn(),
  defineStore: vi.fn(),
  setActivePinia: vi.fn(),
}))

// Mock VueCookies plugin
vi.mock('vue-cookies', () => ({
  default: {
    install: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    isKey: vi.fn(),
    keys: vi.fn(),
  }
}))

// Configure global plugins to avoid "plugin must be a function" warnings
config.global.plugins = []