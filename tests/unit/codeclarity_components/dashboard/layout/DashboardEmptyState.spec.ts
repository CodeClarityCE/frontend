import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DashboardEmptyState from '@/codeclarity_components/dashboard/layout/DashboardEmptyState.vue';

describe('DashboardEmptyState', () => {
  const defaultProps = {
    isError: false,
    hasIntegrations: false,
    hasProjects: false,
    orgId: 'test-org-id'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(DashboardEmptyState, {
      props: defaultProps
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should render different content based on error state', () => {
    const wrapper = mount(DashboardEmptyState, {
      props: { ...defaultProps, isError: true }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should render different content based on integrations state', () => {
    const wrapper = mount(DashboardEmptyState, {
      props: { ...defaultProps, hasIntegrations: true }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should render different content based on projects state', () => {
    const wrapper = mount(DashboardEmptyState, {
      props: { ...defaultProps, hasProjects: true }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should handle all combinations of state props', () => {
    const testCases = [
      { isError: true, hasIntegrations: false, hasProjects: false },
      { isError: false, hasIntegrations: true, hasProjects: false },
      { isError: false, hasIntegrations: false, hasProjects: true },
      { isError: false, hasIntegrations: true, hasProjects: true }
    ];

    testCases.forEach(testCase => {
      const wrapper = mount(DashboardEmptyState, {
        props: { ...defaultProps, ...testCase }
      });
      expect(wrapper.exists()).toBe(true);
    });
  });

  it('should accept and use orgId prop', () => {
    const wrapper = mount(DashboardEmptyState, {
      props: { ...defaultProps, orgId: 'custom-org-id' }
    });
    expect(wrapper.exists()).toBe(true);
  });
});