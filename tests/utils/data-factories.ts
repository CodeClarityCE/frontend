import { vi } from 'vitest'
import type { DependencyDetails, SeverityDist } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails'
import type { Analysis } from '@/codeclarity_components/analyses/analysis.entity'
import type { Project } from '@/codeclarity_components/projects/project.entity'
import type { Organization } from '@/codeclarity_components/organizations/organization.entity'
import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity'

/**
 * Factory functions to create consistent test data
 * These provide properly typed objects that satisfy all interface requirements
 */

export const createMockSeverityDist = (overrides: Partial<SeverityDist> = {}): SeverityDist => ({
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  none: 0,
  ...overrides
})

export const createMockDependency = (overrides: Partial<DependencyDetails> = {}): DependencyDetails => ({
  name: 'test-package',
  version: '1.2.3',
  latest_version: '1.3.0',
  dependencies: {},
  dev_dependencies: {},
  package_manager: 'npm',
  license: 'MIT',
  release_date: new Date('2023-01-01'),
  lastest_release_date: new Date('2023-06-01'),
  vulnerabilities: [],
  severity_dist: createMockSeverityDist(),
  transitive: false,
  ...overrides
} as DependencyDetails)

export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  description: 'A test organization',
  created_on: new Date(),
  updated_on: new Date(),
  members_count: 1,
  projects_count: 1,
  ...overrides
} as Organization)

export const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  email_verified: true,
  created_on: new Date(),
  updated_on: new Date(),
  default_org: createMockOrganization(),
  organizations: [createMockOrganization()],
  ...overrides
} as AuthenticatedUser)

export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'test-project-id',
  name: 'Test Project',
  description: 'A test project',
  organization_id: 'test-org-id',
  integration_id: 'test-integration-id',
  type: 'git' as any,
  url: 'https://github.com/test/project',
  upload_id: null,
  added_on: new Date(),
  updated_on: new Date(),
  ...overrides
} as Project)

export const createMockAnalysis = (overrides: Partial<Analysis> = {}): Analysis => ({
  id: 'test-analysis-id',
  name: 'Test Analysis',
  status: 'COMPLETED' as any,
  created_on: new Date(),
  updated_on: new Date(),
  project_id: 'test-project-id',
  organization_id: 'test-org-id',
  analyzer: {
    id: 'test-analyzer',
    name: 'Test Analyzer',
    plugins: []
  },
  steps: [],
  branch: 'main',
  commit: 'abc123',
  ...overrides
} as Analysis)

/**
 * Mock store factories
 */
export const createMockUserStore = (overrides = {}) => ({
  getUser: createMockUser(),
  getDefaultOrg: createMockOrganization(),
  setUser: vi.fn(),
  setDefaultOrg: vi.fn(),
  ...overrides
})

export const createMockAuthStore = (overrides = {}) => ({
  getToken: 'mock-token',
  initialized: true,
  authenticated: true,
  token: 'mock-token',
  refreshToken: 'mock-refresh-token',
  ...overrides
})

/**
 * Vue Router mock factory
 */
export const createMockRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(() => vi.fn().mockImplementation(() => ({ go: vi.fn() }))),
  forward: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      params: {},
      query: {},
      name: 'home'
    }
  }
})

/**
 * Common API response factories
 */
export const createMockApiResponse = <T>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK'
})

export const createMockPaginatedResponse = <T>(data: T[], total = data.length) => ({
  data,
  meta: {
    total,
    page: 1,
    limit: 10,
    totalPages: Math.ceil(total / 10)
  }
})