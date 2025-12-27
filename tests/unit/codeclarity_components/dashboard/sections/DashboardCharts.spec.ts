import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DashboardCharts from '@/codeclarity_components/dashboard/sections/DashboardCharts.vue';

// Mock InfoCard component
vi.mock('@/base_components/ui/cards/InfoCard.vue', () => ({
  default: {
    name: 'InfoCard',
    template: '<div data-testid="info-card" :class="$attrs.class"><slot /></div>',
    props: ['title', 'description', 'icon', 'variant']
  }
}));

// Mock chart components
vi.mock('@/codeclarity_components/dashboard/charts/LicenseDist.vue', () => ({
  default: {
    name: 'LicenseDist',
    template: '<div data-testid="license-dist">LicenseDist</div>',
    props: ['integrationIds']
  }
}));

vi.mock('@/codeclarity_components/dashboard/charts/ExposureOverview.vue', () => ({
  default: {
    name: 'ExposureOverview',
    template: '<div data-testid="exposure-overview">ExposureOverview</div>',
    props: ['integrationIds']
  }
}));

vi.mock('@/codeclarity_components/dashboard/charts/VulnerabilityImpact.vue', () => ({
  default: {
    name: 'VulnerabilityImpact',
    template: '<div data-testid="vulnerability-impact">VulnerabilityImpact</div>',
    props: ['integrationIds']
  }
}));

vi.mock('@/codeclarity_components/dashboard/charts/CurrentVulns.vue', () => ({
  default: {
    name: 'CurrentVulns',
    template: '<div data-testid="current-vulns">CurrentVulns</div>',
    props: ['integrationIds']
  }
}));

describe('DashboardCharts', () => {
  const defaultProps = {
    integrationIds: ['test-id-1', 'test-id-2']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(DashboardCharts, {
      props: defaultProps
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('should render all chart components', () => {
    const wrapper = mount(DashboardCharts, {
      props: defaultProps
    });

    expect(wrapper.find('[data-testid="exposure-overview"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="current-vulns"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="license-dist"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="vulnerability-impact"]').exists()).toBe(true);
  });

  it('should render four InfoCard containers', () => {
    const wrapper = mount(DashboardCharts, {
      props: defaultProps
    });

    const infoCards = wrapper.findAll('[data-testid="info-card"]');
    expect(infoCards).toHaveLength(5); // Includes TicketsDashboardCard
  });

  it('should pass integration IDs to all chart components', () => {
    const wrapper = mount(DashboardCharts, {
      props: defaultProps
    });

    const exposureOverview = wrapper.findComponent({ name: 'ExposureOverview' });
    const currentVulns = wrapper.findComponent({ name: 'CurrentVulns' });
    const licenseDist = wrapper.findComponent({ name: 'LicenseDist' });
    const vulnerabilityImpact = wrapper.findComponent({ name: 'VulnerabilityImpact' });

    expect(exposureOverview.props('integrationIds')).toEqual(defaultProps.integrationIds);
    expect(currentVulns.props('integrationIds')).toEqual(defaultProps.integrationIds);
    expect(licenseDist.props('integrationIds')).toEqual(defaultProps.integrationIds);
    expect(vulnerabilityImpact.props('integrationIds')).toEqual(defaultProps.integrationIds);
  });

  it('should apply correct CSS classes for grid layout', () => {
    const wrapper = mount(DashboardCharts, {
      props: defaultProps
    });

    const infoCards = wrapper.findAll('[data-testid="info-card"]');

    // Check grid layout classes are applied
    expect(infoCards[0]!.classes()).toContain('lg:col-span-8'); // ExposureOverview
    expect(infoCards[1]!.classes()).toContain('lg:col-span-4'); // CurrentVulns
    expect(infoCards[2]!.classes()).toContain('lg:col-span-6'); // LicenseDist
    expect(infoCards[3]!.classes()).toContain('lg:col-span-6'); // VulnerabilityImpact
  });

  it('should handle empty integration IDs array', () => {
    const wrapper = mount(DashboardCharts, {
      props: { integrationIds: [] }
    });

    const exposureOverview = wrapper.findComponent({ name: 'ExposureOverview' });
    expect(exposureOverview.props('integrationIds')).toEqual([]);
  });

  it('should have proper grid container structure', () => {
    const wrapper = mount(DashboardCharts, {
      props: defaultProps
    });

    const gridContainer = wrapper.find('.grid');
    expect(gridContainer.exists()).toBe(true);
    expect(gridContainer.classes()).toContain('gap-8');
    expect(gridContainer.classes()).toContain('lg:grid-cols-12');
  });
});