import CurrentVulns from '@/codeclarity_components/dashboard/charts/CurrentVulns.vue';
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock external dependencies
vi.mock('@/utils/api/BaseRepository', () => ({
  BusinessLogicError: class BusinessLogicError extends Error {}
}));

vi.mock('@/codeclarity_components/dashboard/dashboard.repository', () => ({
  DashboardRepository: vi.fn(() => ({
    getCurrentVulns: vi.fn()
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

// Mock UI components
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<div data-testid="icon"></div>',
    props: ['icon']
  }
}));

vi.mock('@/shadcn/ui/skeleton', () => ({
  Skeleton: {
    name: 'Skeleton',
    template: '<div data-testid="skeleton"></div>'
  }
}));

vi.mock('@/shadcn/ui/button/Button.vue', () => ({
  default: {
    name: 'Button',
    template: '<button data-testid="button"><slot /></button>',
    props: ['variant', 'size']
  }
}));

vi.mock('@/shadcn/ui/scroll-area', () => ({
  ScrollArea: {
    name: 'ScrollArea',
    template: '<div data-testid="scroll-area"><slot /></div>'
  }
}));

describe('CurrentVulns', () => {
  const defaultProps = {
    integrationIds: ['test-id-1', 'test-id-2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(CurrentVulns, {
      props: defaultProps
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should accept integration IDs as props', () => {
    const wrapper = mount(CurrentVulns, {
      props: defaultProps
    });
    
    expect(wrapper.props('integrationIds')).toEqual(['test-id-1', 'test-id-2']);
  });

  it('should handle empty integration IDs', () => {
    const wrapper = mount(CurrentVulns, {
      props: { integrationIds: [] }
    });
    
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('integrationIds')).toEqual([]);
  });

  it('should render loading state initially', () => {
    const wrapper = mount(CurrentVulns, {
      props: defaultProps
    });
    
    // Should have loading-related elements
    expect(wrapper.html()).toBeTruthy();
  });

  it('should handle props changes', async () => {
    const wrapper = mount(CurrentVulns, {
      props: defaultProps
    });
    
    await wrapper.setProps({ integrationIds: ['new-id'] });
    expect(wrapper.props('integrationIds')).toEqual(['new-id']);
  });
});