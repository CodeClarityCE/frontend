import 'reflect-metadata'
import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'
import { config } from '@vue/test-utils'
import { getPiniaMock, resetPiniaMock } from './test-utils/setup.js'

// Mock Icon component globally for tests
config.global.stubs = {
  Icon: {
    name: 'Icon',
    props: ['icon', 'class', 'width', 'height', 'style'],
    template: '<span data-testid="icon" class="mock-icon" :class="$props.class" :data-icon="icon">{{ icon || "mock-icon" }}</span>'
  },
  tippy: {
    name: 'tippy',
    props: ['content', 'placement', 'trigger'],
    template: '<div class="mock-tippy"><slot /></div>'
  },
  RouterLink: {
    name: 'RouterLink',
    template: '<a v-bind="$attrs" :href="typeof to === \'string\' ? to : (to.name || to.path || \'#\')"><slot /></a>',
    props: ['to', 'replace', 'activeClass', 'exactActiveClass', 'custom', 'ariaCurrentValue', 'viewTransition']
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
      template: '<a v-bind="$attrs" :href="typeof to === \'string\' ? to : (to.name || to.path || \'#\')"><slot /></a>',
      props: ['to', 'replace', 'activeClass', 'exactActiveClass', 'custom', 'ariaCurrentValue', 'viewTransition']
    }
  }
})

// Mock Pinia with singleton instance
const mockPinia = getPiniaMock()

vi.mock('pinia', () => ({
  createPinia: vi.fn(() => mockPinia),
  defineStore: vi.fn(),
  setActivePinia: vi.fn(),
  storeToRefs: vi.fn((store) => store),
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
    constructor() {}
    buildUrl = vi.fn()
    getRequest = vi.fn()
    postRequest = vi.fn()
    putRequest = vi.fn()
    deleteRequest = vi.fn()
  }
}))

// Create comprehensive repository mocks
const createRepositoryMock = (methods: string[]) => {
  const mock: any = {}
  methods.forEach(method => {
    mock[method] = vi.fn().mockResolvedValue({ data: {} })
  })
  return mock
}

// Mock all main repositories
vi.mock('@/codeclarity_components/results/results.repository', () => ({
  ResultsRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'getSbomStat', 'getSbomWorkspaces', 'getSbom', 'getDependency', 'getVulnerabilities',
    'getVulnerability', 'getFinding', 'getLicenses', 'getPatches', 'getPatchedManifest',
    'getCodeQLResults', 'getResults'
  ]))
}))

vi.mock('@/codeclarity_components/analyses/analysis.repository', () => ({
  AnalysisRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'createAnalysis', 'getAnalyses', 'getAnalysisById', 'getProjectById', 'deleteAnalysis'
  ]))
}))

vi.mock('@/codeclarity_components/projects/project.repository', () => ({
  ProjectRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'createProject', 'getProjects', 'getProjectById', 'updateProject', 'deleteProject'
  ]))
}))

vi.mock('@/codeclarity_components/organizations/organization.repository', () => ({
  OrgRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'createOrganization', 'getOrganizations', 'getOrganizationById', 'updateOrganization', 'deleteOrganization'
  ]))
}))

vi.mock('@/codeclarity_components/authentication/auth.repository', () => ({
  AuthRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'login', 'logout', 'register', 'resetPassword', 'confirmEmail'
  ]))
}))

vi.mock('@/codeclarity_components/authentication/user.repository', () => ({
  UserRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'getCurrentUser', 'updateUser', 'deleteUser'
  ]))
}))

vi.mock('@/codeclarity_components/dashboard/dashboard.repository', () => ({
  DashboardRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'getDashboardStats', 'getChartData'
  ]))
}))

vi.mock('@/codeclarity_components/results/licenses/LicenseRepository', () => ({
  LicenseRepository: vi.fn().mockImplementation(() => createRepositoryMock([
    'getLicenses', 'getLicenseById'
  ]))
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