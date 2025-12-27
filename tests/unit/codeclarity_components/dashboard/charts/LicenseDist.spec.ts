import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import LicenseDist from '@/codeclarity_components/dashboard/charts/LicenseDist.vue';

// Mock external dependencies
vi.mock('@/utils/api/BaseRepository', () => ({
  BusinessLogicError: class BusinessLogicError extends Error {}
}));

vi.mock('@/codeclarity_components/dashboard/dashboard.repository', () => ({
  DashboardRepository: class {
    getLicenseDistribution = vi.fn()
  }
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    token: 'mock-token'
  }))
}));

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    defaultOrg: { id: 'org-123' }
  }))
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn((store) => store)
}));

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: vi.fn(),
  registerables: []
}));

// Mock chart components
vi.mock('@/base_components/data-display/charts/DoughnutChart.vue', () => ({
  default: {
    name: 'DoughnutChart',
    template: '<div data-testid="doughnut-chart"></div>',
    props: ['data', 'options']
  }
}));

describe('LicenseDist', () => {
  const defaultProps = {
    integrationIds: ['test-id-1', 'test-id-2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(LicenseDist, {
      props: defaultProps
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept integration IDs as props', () => {
    const wrapper = mount(LicenseDist, {
      props: defaultProps
    });
    
    expect(wrapper.props('integrationIds')).toEqual(['test-id-1', 'test-id-2']);
  });

  it('should handle empty integration IDs', () => {
    const wrapper = mount(LicenseDist, {
      props: { integrationIds: [] }
    });
    
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('integrationIds')).toEqual([]);
  });

  it('should handle props changes', async () => {
    const wrapper = mount(LicenseDist, {
      props: defaultProps
    });
    
    await wrapper.setProps({ integrationIds: ['new-id'] });
    expect(wrapper.props('integrationIds')).toEqual(['new-id']);
  });
});