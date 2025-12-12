import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
// import { createTestWrapper } from '../../utils/test-utils';
import { mockStores } from '../../utils/test-utils';
import CreateProject from '@/codeclarity_components/projects/create/CreateProject.vue';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { VCS, IntegrationProvider, IntegrationType } from '@/codeclarity_components/organizations/integrations/Integrations';
import { BusinessLogicError } from '@/utils/api/BaseRepository';

// Mock BaseRepository with error classes
vi.mock('@/utils/api/BaseRepository', () => ({
  BaseRepository: class MockBaseRepository {
    constructor() {}
  },
  BusinessLogicError: class MockBusinessLogicError extends Error {
    constructor(message: string, public error_code: string) {
      super(message);
    }
  },
  ValidationError: class MockValidationError extends Error {
    constructor(public error_code: string, public details?: any) {
      super();
    }
  }
}));

// Mock repositories
vi.mock('@/codeclarity_components/organizations/integrations/IntegrationsRepository');
const mockIntegrationsRepository = vi.mocked(IntegrationsRepository);

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

import router from '@/router';
const mockPush = vi.mocked(router.push);

// Mock child components
vi.mock('@/codeclarity_components/projects/create/import/GithubImportComponent.vue', () => ({
  default: {
    name: 'GithubImportComponent',
    template: '<div data-testid="github-import">GitHub Import Component</div>',
    emits: ['project-created', 'error']
  }
}));

vi.mock('@/codeclarity_components/projects/create/import/GitlabImportComponent.vue', () => ({
  default: {
    name: 'GitlabImportComponent', 
    template: '<div data-testid="gitlab-import">GitLab Import Component</div>',
    emits: ['project-created', 'error']
  }
}));

describe.skip('CreateProject Integration Tests', () => {
  let integrationsRepositoryInstance: any;
  let wrapper: any;

  const mockVcsIntegrations: VCS[] = [
    {
      id: '1',
      added_on: new Date(),
      added_by: 'user-1',
      service_domain: 'github.com',
      integration_type: IntegrationType.VCS,
      integration_provider: IntegrationProvider.GITHUB,
      invalid: false
    },
    {
      id: '2',
      added_on: new Date(),
      added_by: 'user-1',
      service_domain: 'gitlab.com',
      integration_type: IntegrationType.VCS,
      integration_provider: IntegrationProvider.GITLAB,
      invalid: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores
    mockStores.state.$reset();
    mockStores.user.$reset();
    mockStores.auth.$reset();

    // Setup default organization
    mockStores.user.getDefaultOrg = {
      id: 'org-1',
      name: 'Test Organization',
      created_on: new Date()
    } as any;

    // Setup IntegrationsRepository mock instance
    integrationsRepositoryInstance = {
      getVCSIntegrations: vi.fn()
    };
    mockIntegrationsRepository.mockImplementation(() => integrationsRepositoryInstance);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const mountComponent = () => {
    wrapper = mount(CreateProject, {
      global: {
        stubs: {
          Icon: true,
          PageHeader: { template: '<div data-testid="page-header"><slot /></div>' },
          InfoCard: { template: '<div data-testid="info-card"><slot /></div>' },
          BoxLoader: { template: '<div data-testid="box-loader">Loading...</div>' },
          NoIntegration: { template: '<div data-testid="no-integration">No Integration</div>' },
          Integrations: { template: '<div data-testid="integrations">Integrations</div>' },
          Button: { 
            template: '<button data-testid="button" @click="$emit(\'click\')"><slot /></button>',
            emits: ['click']
          }
        }
      }
    });
    return wrapper;
  };

  describe('Component Initialization', () => {
    it('should initialize with correct store state', async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
      
      mountComponent();
      await nextTick();

      // Verify state store is properly initialized
      expect(mockStores.state.$reset).toHaveBeenCalled();
      expect(mockStores.state.page).toBe('projects');
    });

    it('should fetch VCS integrations on mount', async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
      
      mountComponent();
      await nextTick();

      expect(integrationsRepositoryInstance.getVCSIntegrations).toHaveBeenCalledWith(
        mockStores.user.getDefaultOrg.id,
        mockStores.auth.getToken ?? ''
      );
    });

    it('should show loading state initially', () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockImplementation(() => 
        new Promise(() => {}) // Never resolving promise
      );
      
      mountComponent();
      
      expect(wrapper.find('[data-testid="box-loader"]').exists()).toBe(true);
    });
  });

  describe('Integration Loading and Display', () => {
    it('should display available VCS integrations after loading', async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
      
      mountComponent();
      await nextTick();

      // Wait for integrations to load
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="box-loader"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="integrations"]').exists()).toBe(true);
    });

    it('should show no integration message when no integrations available', async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue([]);
      
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="no-integration"]').exists()).toBe(true);
    });

    it('should handle integration loading errors gracefully', async () => {
      const error = new BusinessLogicError('Failed to load integrations', 'INTEGRATION_ERROR');
      integrationsRepositoryInstance.getVCSIntegrations.mockRejectedValue(error);
      
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      // Verify error state
      expect(wrapper.vm.error).toBe(true);
      expect(wrapper.vm.errorCode).toBe('INTEGRATION_ERROR');
    });
  });

  describe('VCS Selection and Import Workflow', () => {
    beforeEach(async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
    });

    it('should show GitHub import component when GitHub integration is selected', async () => {
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      // Select GitHub VCS
      await wrapper.vm.onSelectedVCS( mockVcsIntegrations[0]);
      await nextTick();

      expect(wrapper.find('[data-testid="github-import"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="gitlab-import"]').exists()).toBe(false);
    });

    it('should show GitLab import component when GitLab integration is selected', async () => {
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      // Select GitLab VCS
      await wrapper.vm.onSelectedVCS( mockVcsIntegrations[1]);
      await nextTick();

      expect(wrapper.find('[data-testid="gitlab-import"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="github-import"]').exists()).toBe(false);
    });

    it('should handle project creation success from GitHub import', async () => {
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      // Select GitHub VCS
      await wrapper.vm.onSelectedVCS( mockVcsIntegrations[0]);
      await nextTick();

      const githubComponent = wrapper.findComponent('[data-testid="github-import"]');
      
      // Simulate project creation event
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        repository_url: 'https://github.com/test/repo'
      };

      await githubComponent.vm.$emit('project-created', mockProject);
      await nextTick();

      // Verify navigation to project
      expect(mockPush).toHaveBeenCalledWith(`/projects/${mockProject.id}`);
    });

    it('should handle project creation errors from import components', async () => {
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      // Select GitHub VCS
      await wrapper.vm.onSelectedVCS( mockVcsIntegrations[0]);
      await nextTick();

      const githubComponent = wrapper.findComponent('[data-testid="github-import"]');
      
      // Simulate project creation error
      const error = new BusinessLogicError('Repository not found', 'REPO_NOT_FOUND');
      await githubComponent.vm.$emit('error', error);
      await nextTick();

      // Verify error state
      expect(wrapper.vm.error).toBe(true);
      expect(wrapper.vm.errorCode).toBe('REPO_NOT_FOUND');
    });
  });

  describe('Organization Change Handling', () => {
    it('should refetch integrations when default organization changes', async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
      
      mountComponent();
      await nextTick();

      // Clear the mock to verify new calls
      integrationsRepositoryInstance.getVCSIntegrations.mockClear();

      // Change default organization
      const newOrg = {
        id: 'org-2',
        name: 'New Organization',
        created_on: new Date()
      } as any;

      mockStores.user.getDefaultOrg = newOrg;
      
      // Trigger the organization change (simulating reactive watch)
      await wrapper.vm.fetchVcsIntegrations(true);
      await nextTick();

      // Verify integrations are refetched with new organization
      expect(integrationsRepositoryInstance.getVCSIntegrations).toHaveBeenCalledWith(
        newOrg.id,
        mockStores.auth.getToken ?? ''
      );
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after error state', async () => {
      // First call fails
      integrationsRepositoryInstance.getVCSIntegrations
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockVcsIntegrations);
      
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      // Verify error state
      expect(wrapper.vm.error).toBe(true);

      // Retry the operation
      await wrapper.vm.fetchVcsIntegrations(true);
      await nextTick();

      // Verify success state
      expect(wrapper.vm.error).toBe(false);
      expect(wrapper.vm.vcsIntegrations).toEqual(mockVcsIntegrations);
    });

    it('should clear error state when starting new operation', async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockRejectedValue(new Error('Error'));
      
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.error).toBe(true);

      // Start new fetch operation
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
      await wrapper.vm.fetchVcsIntegrations(true);

      // Error should be cleared at start of operation
      expect(wrapper.vm.error).toBe(false);
    });
  });

  describe('Accessibility and User Experience', () => {
    beforeEach(async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
    });

    it('should have proper loading indicators', async () => {
      // Mock long-running operation
      integrationsRepositoryInstance.getVCSIntegrations.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockVcsIntegrations), 100))
      );
      
      mountComponent();
      
      // Should show loading state
      expect(wrapper.find('[data-testid="box-loader"]').exists()).toBe(true);
      
      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 150));
      await wrapper.vm.$nextTick();
      
      // Should hide loading state after completion
      expect(wrapper.find('[data-testid="box-loader"]').exists()).toBe(false);
    });

    it('should maintain consistent state during navigation', async () => {
      mountComponent();
      await nextTick();
      await wrapper.vm.$nextTick();

      // Verify page state is set consistently
      expect(mockStores.state.page).toBe('projects');
      
      // Select a VCS
      await wrapper.vm.onSelectedVCS( mockVcsIntegrations[0]);
      
      // Page state should remain consistent
      expect(mockStores.state.page).toBe('projects');
    });

    it('should handle rapid organization changes gracefully', async () => {
      integrationsRepositoryInstance.getVCSIntegrations.mockResolvedValue(mockVcsIntegrations);
      
      mountComponent();
      await nextTick();

      // Simulate rapid organization changes
      const orgs = [
        { id: 'org-1', name: 'Org 1', created_on: new Date() },
        { id: 'org-2', name: 'Org 2', created_on: new Date() },
        { id: 'org-3', name: 'Org 3', created_on: new Date() }
      ].map(org => org as any);

      for (const org of orgs) {
        mockStores.user.getDefaultOrg = org;
        await wrapper.vm.fetchVcsIntegrations(true);
      }

      // Should handle all changes without errors
      expect(wrapper.vm.error).toBe(false);
      expect(integrationsRepositoryInstance.getVCSIntegrations).toHaveBeenCalledTimes(orgs.length + 1); // +1 for initial mount
    });
  });
});