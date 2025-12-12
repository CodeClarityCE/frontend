import DashboardView from '@/codeclarity_components/dashboard/DashboardView.vue';
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, type computed } from 'vue';

// Mock stores
vi.mock('@/stores/state', () => ({
  useStateStore: vi.fn(() => ({
    $reset: vi.fn(),
    page: ''
  }))
}));

interface MockDashboardData {
  activeIntegrationIds: ReturnType<typeof computed<string[]>>;
  shouldShowEmptyState: ReturnType<typeof computed<boolean>>;
  hasIntegrations: ReturnType<typeof computed<boolean>>;
  hasProjects: ReturnType<typeof computed<boolean>>;
  hasError: ReturnType<typeof ref<boolean>>;
  isLoading: ReturnType<typeof ref<boolean>>;
  defaultOrg: ReturnType<typeof ref<{ id: string } | null>>;
  refreshData: ReturnType<typeof vi.fn>;
}

// Mock composable
vi.mock('@/codeclarity_components/dashboard/composables/useDashboardData', () => ({
  useDashboardData: vi.fn((): MockDashboardData => ({
    activeIntegrationIds: ref(['test-id']) as any,
    shouldShowEmptyState: ref(false) as any,
    hasIntegrations: ref(true) as any,
    hasProjects: ref(true) as any,
    hasError: ref(false),
    isLoading: ref(false),
    defaultOrg: ref({ id: 'org-123' }),
    refreshData: vi.fn()
  }))
}));

// Mock components
vi.mock('@/base_components', () => ({
  PageHeader: {
    name: 'PageHeader',
    template: '<div data-testid="page-header"><slot /></div>',
    props: ['title', 'description', 'isLoading'],
    emits: ['refresh']
  }
}));

vi.mock('@/codeclarity_components/dashboard/sections/DashboardQuickStats.vue', () => ({
  default: {
    name: 'DashboardQuickStats',
    template: '<div data-testid="dashboard-quick-stats">DashboardQuickStats</div>'
  }
}));

vi.mock('@/codeclarity_components/dashboard/sections/DashboardCharts.vue', () => ({
  default: {
    name: 'DashboardCharts',
    template: '<div data-testid="dashboard-charts">DashboardCharts</div>',
    props: ['integrationIds']
  }
}));

vi.mock('@/codeclarity_components/dashboard/layout/DashboardFooter.vue', () => ({
  default: {
    name: 'DashboardFooter',
    template: '<div data-testid="dashboard-footer">DashboardFooter</div>'
  }
}));

vi.mock('@/codeclarity_components/dashboard/layout/DashboardEmptyState.vue', () => ({
  default: {
    name: 'DashboardEmptyState',
    template: '<div data-testid="dashboard-empty-state">DashboardEmptyState</div>',
    props: ['isError', 'hasIntegrations', 'hasProjects', 'orgId']
  }
}));

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(DashboardView);
    expect(wrapper.exists()).toBe(true);
  });

  it('should show main dashboard content when not in empty state', () => {
    const wrapper = mount(DashboardView);
    
    expect(wrapper.find('[data-testid="page-header"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-quick-stats"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-charts"]').exists()).toBe(true);
    // expect(wrapper.find('[data-testid="dashboard-footer"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="dashboard-empty-state"]').exists()).toBe(false);
  });

  it('should show empty state when shouldShowEmptyState is true', async () => {
    const { useDashboardData } = await import('@/codeclarity_components/dashboard/composables/useDashboardData');
    vi.mocked(useDashboardData).mockReturnValueOnce({
      activeIntegrationIds: ref([]) as any,
      shouldShowEmptyState: ref(true) as any,
      hasIntegrations: ref(false) as any,
      hasProjects: ref(false) as any,
      hasError: ref(false),
      isLoading: ref(false),
      defaultOrg: ref({ id: 'org-123' } as any),
      refreshData: vi.fn()
    });

    const wrapper = mount(DashboardView);

    expect(wrapper.find('[data-testid="dashboard-empty-state"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="page-header"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dashboard-quick-stats"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dashboard-charts"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dashboard-footer"]').exists()).toBe(false);
  });

  it('should set page state correctly', async () => {
    const { useStateStore } = await import('@/stores/state');
    const mockStore = {
      $reset: vi.fn(),
      page: '',
      $patch: vi.fn(),
      $subscribe: vi.fn(),
      $onAction: vi.fn(),
      $state: {},
      $id: 'state'
    };
    vi.mocked(useStateStore).mockReturnValue(mockStore as any);

    mount(DashboardView);

    expect(mockStore.$reset).toHaveBeenCalled();
    expect(mockStore.page).toBe('dashboard');
  });

  it('should pass integration IDs to charts component', () => {
    const wrapper = mount(DashboardView);
    
    // Check if dashboard-charts element exists
    expect(wrapper.find('[data-testid="dashboard-charts"]').exists()).toBe(true);
    
    const chartsComponent = wrapper.findComponent({ name: 'DashboardCharts' });
    expect(chartsComponent.exists()).toBe(true);
    expect(chartsComponent.props('integrationIds')).toEqual(['test-id']);
  });

  it('should pass correct props to empty state component', async () => {
    const { useDashboardData } = await import('@/codeclarity_components/dashboard/composables/useDashboardData');
    vi.mocked(useDashboardData).mockReturnValueOnce({
      activeIntegrationIds: ref([]) as any,
      shouldShowEmptyState: ref(true) as any,
      hasIntegrations: ref(false) as any,
      hasProjects: ref(true) as any,
      hasError: ref(true),
      isLoading: ref(false),
      defaultOrg: ref({ id: 'org-123' } as any),
      refreshData: vi.fn()
    });

    const wrapper = mount(DashboardView);
    const emptyStateComponent = wrapper.findComponent({ name: 'DashboardEmptyState' });

    expect(emptyStateComponent.exists()).toBe(true);
    expect(emptyStateComponent.props()).toEqual({
      isError: true,
      hasIntegrations: false,
      hasProjects: true,
      orgId: 'org-123'
    });
  });
});