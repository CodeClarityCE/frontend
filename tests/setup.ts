import 'reflect-metadata'
import '@testing-library/jest-dom'
import { config } from '@vue/test-utils'
import { vi, beforeEach } from 'vitest'
import { getPiniaMock, resetPiniaMock } from './test-utils/setup.js'

// Mock Icon component globally for tests
config.global.stubs = {
  Icon: {
    name: 'Icon',
    props: ['icon', 'class', 'width', 'height', 'style'],
    template: '<span data-testid="icon" class="mock-icon" :class="$props.class" :data-icon="icon">{{ icon ?? "mock-icon" }}</span>'
  },
  tippy: {
    name: 'tippy',
    props: ['content', 'placement', 'trigger'],
    template: '<div class="mock-tippy"><slot /></div>'
  },
  RouterLink: {
    name: 'RouterLink',
    template: '<a v-bind="$attrs" :href="typeof to === \'string\' ? to : (to.name ?? to.path ?? \'#\')"><slot /></a>',
    props: ['to', 'replace', 'activeClass', 'exactActiveClass', 'custom', 'ariaCurrentValue', 'viewTransition']
  }
}

// Mock global objects
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_callback: ResizeObserverCallback) {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock process.env for reka-ui
process.env.NODE_ENV = 'test'

// Mock import.meta.env for Vite compatibility
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: { MODE: 'test', DEV: false, PROD: false }
    }
  },
  configurable: true
})


class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
  takeRecords = vi.fn().mockReturnValue([]);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList)),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock requestAnimationFrame for auto-animate library
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback): number => {
  cb(0)
  return 0
})

global.cancelAnimationFrame = vi.fn()

// Mock scrollIntoView on Element prototype
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn()
}

// Mock Web Animations API for auto-animate
if (typeof Element !== 'undefined') {
  Element.prototype.animate = vi.fn().mockReturnValue({
    cancel: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    playState: 'finished',
    playbackRate: 1,
    currentTime: 0,
    startTime: 0,
    timeline: null,
    effect: null,
    id: '',
    pending: false,
    replaceState: 'active'
  })
}

// Mock router
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()
  return Object.assign({}, actual, {
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
      template: '<a v-bind="$attrs" :href="typeof to === \'string\' ? to : (to.name ?? to.path ?? \'#\')"><slot /></a>',
      props: ['to', 'replace', 'activeClass', 'exactActiveClass', 'custom', 'ariaCurrentValue', 'viewTransition']
    }
  })
})

// Mock Pinia with singleton instance
const mockPinia = getPiniaMock()

vi.mock('pinia', () => ({
  createPinia: vi.fn(() => mockPinia),
  defineStore: vi.fn(),
  setActivePinia: vi.fn(),
  storeToRefs: vi.fn(<T>(store: T): T => store),
}))

// Mock VueCookies plugin with proper install function
const mockVueCookies = {
  install: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  isKey: vi.fn(),
  keys: vi.fn(),
}

vi.mock('vue-cookies', () => ({
  default: mockVueCookies
}))

// Configure global plugins - clear first to prevent duplicates
config.global.plugins = []
config.global.plugins.push(mockPinia)

// Reset pinia between tests
beforeEach(() => {
  resetPiniaMock()
})

// Mock all repository classes to prevent "is not a function" errors
vi.mock('@/utils/api/BaseRepository', () => ({
  BaseRepository: class MockBaseRepository {
    buildUrl = vi.fn()
    getRequest = vi.fn()
    postRequest = vi.fn()
    putRequest = vi.fn()
    deleteRequest = vi.fn()
  }
}))

// Create mock repository class factory
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createMockRepositoryClass(methods: string[]) {
  return class MockRepository {
    constructor() {
      methods.forEach(method => {
        (this as Record<string, unknown>)[method] = vi.fn().mockResolvedValue({ data: {} });
      });
    }
  };
}

// Mock all main repositories
vi.mock('@/codeclarity_components/results/results.repository', () => ({
  ResultsRepository: createMockRepositoryClass([
    'getSbomStat', 'getSbomWorkspaces', 'getSbom', 'getDependency', 'getVulnerabilities',
    'getVulnerability', 'getFinding', 'getLicenses', 'getPatches', 'getPatchedManifest',
    'getCodeQLResults', 'getResults'
  ])
}))

vi.mock('@/codeclarity_components/analyses/analysis.repository', () => ({
  AnalysisRepository: createMockRepositoryClass([
    'createAnalysis', 'getAnalyses', 'getAnalysisById', 'getProjectById', 'deleteAnalysis'
  ])
}))

vi.mock('@/codeclarity_components/projects/project.repository', () => ({
  ProjectRepository: createMockRepositoryClass([
    'createProject', 'getProjects', 'getProjectById', 'updateProject', 'deleteProject'
  ])
}))

vi.mock('@/codeclarity_components/organizations/organization.repository', () => ({
  OrgRepository: createMockRepositoryClass([
    'createOrganization', 'getOrganizations', 'getOrganizationById', 'updateOrganization', 'deleteOrganization'
  ])
}))

vi.mock('@/codeclarity_components/authentication/auth.repository', () => ({
  AuthRepository: createMockRepositoryClass([
    'login', 'logout', 'register', 'resetPassword', 'confirmEmail'
  ])
}))

vi.mock('@/codeclarity_components/authentication/user.repository', () => ({
  UserRepository: createMockRepositoryClass([
    'getCurrentUser', 'updateUser', 'deleteUser', 'confirmRegistration'
  ])
}))

vi.mock('@/codeclarity_components/dashboard/dashboard.repository', () => ({
  DashboardRepository: createMockRepositoryClass([
    'getDashboardStats', 'getChartData', 'getVulnerabilityImpact'
  ])
}))

vi.mock('@/codeclarity_components/results/licenses/LicenseRepository', () => ({
  LicenseRepository: createMockRepositoryClass([
    'getLicenses', 'getLicenseById'
  ])
}))

// Mock common stores with better defaults
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    // State
    user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
    organizations: [{ id: 'test-org-id', name: 'Test Org' }],
    defaultOrg: { id: 'test-org-id', name: 'Test Org' },
    
    // Getters
    getUser: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
    getDefaultOrg: { id: 'test-org-id', name: 'Test Org' },
    getOrganizations: [{ id: 'test-org-id', name: 'Test Org' }],
    
    // Actions
    setUser: vi.fn(),
    setDefaultOrg: vi.fn(),
    setOrganizations: vi.fn(),
    $reset: vi.fn(),
    $patch: vi.fn()
  }))
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    // State
    initialized: true,
    token: 'test-token',
    tokenExpiry: new Date(Date.now() + 3600000),
    refreshToken: 'test-refresh-token',
    refreshTokenExpiry: new Date(Date.now() + 7200000),
    authenticated: true,
    socialAuthState: 'test-social-state',
    
    // Getters
    getToken: 'test-token',
    getRefreshToken: 'test-refresh-token',
    getTokenExpiry: new Date(Date.now() + 3600000),
    getRefreshTokenExpiry: new Date(Date.now() + 7200000),
    getAuthenticated: true,
    getInitialized: true,
    getSocialAuthState: 'test-social-state',
    
    // Actions
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setTokenExpiry: vi.fn(),
    setRefreshTokenExpiry: vi.fn(),
    setAuthenticated: vi.fn(),
    setInitialized: vi.fn(),
    setSocialAuthState: vi.fn(),
    $reset: vi.fn(),
    $patch: vi.fn()
  })),
  loadAuthStoreFromLocalStorage: vi.fn()
}))

vi.mock('@/stores/state', () => ({
  useStateStore: vi.fn(() => ({
    $reset: vi.fn(),
    page: 'test-page',
    loading: false,
    error: null
  }))
}))

vi.mock('@/stores/StateStore', () => ({
  useProjectsMainStore: vi.fn(() => ({
    projectsResponse: {
      entries_per_page: 10,
      total_entries: 100,
      data: []
    },
    $reset: vi.fn(),
    $patch: vi.fn()
  }))
}))

// Mock router instance
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    go: vi.fn(),
    currentRoute: { value: { params: {}, query: {} } }
  }
}))

// Mock @vueuse/core
vi.mock('@vueuse/core', () => ({
  useCurrentElement: () => ({ value: null }),
  useElementSize: () => ({ width: 0, height: 0 }),
  useResizeObserver: vi.fn(),
  useIntersectionObserver: vi.fn(),
  useEventListener: vi.fn(),
  useDebounceFn: vi.fn(),
  useThrottleFn: vi.fn(),
  useLocalStorage: vi.fn(() => ({ value: null })),
  useSessionStorage: vi.fn(() => ({ value: null })),
  useToggle: vi.fn(() => [false, vi.fn()]),
  useVModel: vi.fn(),
  watchEffect: vi.fn(),
  watch: vi.fn(),
  computed: vi.fn(),
  ref: vi.fn(),
  reactive: vi.fn()
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  Search: { name: 'Search', template: '<svg data-testid="search-icon"><path/></svg>' },
  User: { name: 'User', template: '<svg data-testid="user-icon"><path/></svg>' },
  Settings: { name: 'Settings', template: '<svg data-testid="settings-icon"><path/></svg>' },
  ChevronDown: { name: 'ChevronDown', template: '<svg data-testid="chevron-down-icon"><path/></svg>' },
  Plus: { name: 'Plus', template: '<svg data-testid="plus-icon"><path/></svg>' },
  X: { name: 'X', template: '<svg data-testid="x-icon"><path/></svg>' },
  Menu: { name: 'Menu', template: '<svg data-testid="menu-icon"><path/></svg>' },
  Home: { name: 'Home', template: '<svg data-testid="home-icon"><path/></svg>' },
  LogOut: { name: 'LogOut', template: '<svg data-testid="logout-icon"><path/></svg>' },
  Bell: { name: 'Bell', template: '<svg data-testid="bell-icon"><path/></svg>' },
  Check: { name: 'Check', template: '<svg data-testid="check-icon"><path/></svg>' },
  AlertTriangle: { name: 'AlertTriangle', template: '<svg data-testid="alert-triangle-icon"><path/></svg>' },
  Info: { name: 'Info', template: '<svg data-testid="info-icon"><path/></svg>' },
  ExternalLink: { name: 'ExternalLink', template: '<svg data-testid="external-link-icon"><path/></svg>' }
}))