import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExposureOverview from '@/codeclarity_components/dashboard/charts/ExposureOverview.vue';

// Mock external dependencies
vi.mock('@/utils/api/BaseRepository', () => ({
  BusinessLogicError: class BusinessLogicError extends Error {}
}));

vi.mock('@/codeclarity_components/dashboard/dashboard.repository', () => ({
  DashboardRepository: vi.fn(() => ({
    getExposureOverview: vi.fn()
  }))
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
vi.mock('@/base_components/data-display/charts/BarChart.vue', () => ({
  default: {
    name: 'BarChart',
    template: '<div data-testid="bar-chart"></div>',
    props: ['data', 'options']
  }
}));

describe('ExposureOverview', () => {
  const defaultProps = {
    integrationIds: ['test-id-1', 'test-id-2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(ExposureOverview, {
      props: defaultProps
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept integration IDs as props', () => {
    const wrapper = mount(ExposureOverview, {
      props: defaultProps
    });
    
    expect(wrapper.props('integrationIds')).toEqual(['test-id-1', 'test-id-2']);
  });

  it('should handle empty integration IDs', () => {
    const wrapper = mount(ExposureOverview, {
      props: { integrationIds: [] }
    });
    
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('integrationIds')).toEqual([]);
  });

  it('should handle props changes', async () => {
    const wrapper = mount(ExposureOverview, {
      props: defaultProps
    });
    
    await wrapper.setProps({ integrationIds: ['new-id'] });
    expect(wrapper.props('integrationIds')).toEqual(['new-id']);
  });
});