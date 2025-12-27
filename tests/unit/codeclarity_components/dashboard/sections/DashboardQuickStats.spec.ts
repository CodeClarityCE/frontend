import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DashboardQuickStats from '@/codeclarity_components/dashboard/sections/DashboardQuickStats.vue';

// Mock external dependencies
vi.mock('@/utils/api/BaseRepository', () => ({
  BusinessLogicError: class BusinessLogicError extends Error {}
}));

// Mock dashboard repository as a class
vi.mock('@/codeclarity_components/dashboard/dashboard.repository', () => ({
  DashboardRepository: class {
    getQuickStats = vi.fn().mockResolvedValue({ data: { nmb_projects: 0, max_grade: { score: 10, class: 'A+' } } })
    getRecentVulns = vi.fn().mockResolvedValue({ data: { severity_count: [] } })
  }
}));

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    getAuthenticated: true,
    getToken: 'test-token'
  }))
}));

// Mock user store
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    defaultOrg: { id: 'test-org-id' },
    getDefaultOrg: { id: 'test-org-id' }
  }))
}));

// Mock pinia - storeToRefs should return refs
vi.mock('pinia', () => ({
  storeToRefs: vi.fn((store) => ({
    defaultOrg: { value: store.defaultOrg }
  }))
}));

// Mock StatCard component
vi.mock('@/base_components/ui/cards/StatCard.vue', () => ({
  default: {
    name: 'StatCard',
    template: '<div data-testid="stat-card"><slot /></div>',
    props: ['label', 'value', 'subtitle', 'icon', 'variant']
  }
}));

// Mock shadcn components
vi.mock('@/shadcn/ui/card', () => ({
  Card: {
    name: 'Card',
    template: '<div data-testid="card"><slot /></div>'
  },
  CardContent: {
    name: 'CardContent',
    template: '<div><slot /></div>'
  }
}));

vi.mock('@/shadcn/ui/skeleton', () => ({
  Skeleton: {
    name: 'Skeleton',
    template: '<div data-testid="skeleton"></div>'
  }
}));

vi.mock('@/shadcn/ui/tooltip', () => ({
  Tooltip: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  TooltipProvider: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' }
}));

// Mock Iconify
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span data-testid="icon"></span>',
    props: ['icon']
  }
}));

describe('DashboardQuickStats', () => {
  const defaultProps = {
    integrationIds: ['test-id-1', 'test-id-2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(DashboardQuickStats, {
      props: defaultProps
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should have proper grid container structure', () => {
    const wrapper = mount(DashboardQuickStats, {
      props: defaultProps
    });

    const gridContainer = wrapper.find('.grid');
    expect(gridContainer.exists()).toBe(true);
    expect(gridContainer.classes()).toContain('gap-6');
    expect(gridContainer.classes()).toContain('sm:grid-cols-2');
    expect(gridContainer.classes()).toContain('lg:grid-cols-4');
  });

  it('should render multiple StatCard components after loading', async () => {
    const wrapper = mount(DashboardQuickStats, {
      props: defaultProps
    });

    // Wait for async data fetch to complete
    await flushPromises();

    const statCards = wrapper.findAll('[data-testid="stat-card"]');
    expect(statCards.length).toBeGreaterThan(0);
  });
});