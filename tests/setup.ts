import 'reflect-metadata'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

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

// Mock Pinia - create a proper mock that works as a plugin
const mockPinia = {
  install: vi.fn(),
  state: vi.fn(),
  _p: [],
  _a: null,
  _e: null,
  _s: new Map(),
  use: vi.fn(),
}

vi.mock('pinia', () => ({
  createPinia: vi.fn(() => mockPinia),
  defineStore: vi.fn(),
  setActivePinia: vi.fn(),
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

// Configure global plugins with proper mock plugins - only set if not already set
if (!config.global.plugins) {
  config.global.plugins = []
}
// Only add pinia if not already present
if (!config.global.plugins.some(p => p === mockPinia)) {
  config.global.plugins.push(mockPinia)
}

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
    getDefaultOrg: { id: 'test-org-id', name: 'Test Org' },
    user: { id: 'test-user-id', email: 'test@example.com' },
    organizations: []
  }))
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    getToken: 'test-token',
    isAuthenticated: true,
    user: { id: 'test-user-id' }
  }))
}))

vi.mock('@/stores/state', () => ({
  useStateStore: vi.fn(() => ({
    $reset: vi.fn(),
    page: 'test-page',
    loading: false,
    error: null
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