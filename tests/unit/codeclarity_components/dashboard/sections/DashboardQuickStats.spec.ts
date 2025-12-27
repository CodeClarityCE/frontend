import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DashboardQuickStats from '@/codeclarity_components/dashboard/sections/DashboardQuickStats.vue';

// Mock StatCard component
vi.mock('@/base_components/ui/cards/StatCard.vue', () => ({
  default: {
    name: 'StatCard',
    template: '<div data-testid="stat-card"><slot /></div>',
    props: ['title', 'value', 'description', 'icon', 'trend', 'isLoading', 'error']
  }
}));

// Mock dashboard repository
vi.mock('@/codeclarity_components/dashboard/dashboard.repository', () => ({
  DashboardRepository: {
    getQuickStats: vi.fn()
  }
}));

// Mock state store  
vi.mock('@/stores/state', () => ({
  useStateStore: vi.fn(() => ({
    selected_organization_id: 'test-org-id'
  }))
}));

describe('DashboardQuickStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successfully', () => {
    const wrapper = mount(DashboardQuickStats);
    expect(wrapper.exists()).toBe(true);
  });

  it('should have proper grid container structure', () => {
    const wrapper = mount(DashboardQuickStats);
    
    const gridContainer = wrapper.find('.grid');
    expect(gridContainer.exists()).toBe(true);
    expect(gridContainer.classes()).toContain('gap-6');
    expect(gridContainer.classes()).toContain('sm:grid-cols-2');
    expect(gridContainer.classes()).toContain('lg:grid-cols-4');
  });

  it('should render multiple StatCard components', () => {
    const wrapper = mount(DashboardQuickStats);
    
    const statCards = wrapper.findAll('[data-testid="stat-card"]');
    expect(statCards.length).toBeGreaterThan(0);
  });
});