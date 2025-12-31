import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MainNav from '@/codeclarity_components/header/components/MainNav.vue';

// Mock store
const mockStateStore = {
  page: 'dashboard'
};

vi.mock('@/stores/state', () => ({
  useStateStore: () => mockStateStore
}));

// Mock RouterLink
const mockRouterLink = {
  name: 'RouterLink',
  template: '<a v-bind="$attrs"><slot /></a>',
  props: ['to']
};

describe('MainNav', () => {
  let wrapper: any;

  const createWrapper = (props = {}) => {
    return mount(MainNav, {
      props,
      global: {
        components: {
          RouterLink: mockRouterLink
        }
      }
    });
  };

  beforeEach(() => {
    // Reset store state
    mockStateStore.page = 'dashboard';
    
    // Clear any previous wrapper
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Structure', () => {
    it('renders correctly', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('renders as a nav element', () => {
      wrapper = createWrapper();
      const nav = wrapper.find('nav');
      expect(nav.exists()).toBe(true);
    });

    it('applies correct CSS classes', () => {
      wrapper = createWrapper();
      const nav = wrapper.find('nav');
      expect(nav.classes()).toContain('flex');
      expect(nav.classes()).toContain('items-center');
      expect(nav.classes()).toContain('gap-8');
    });

    it('accepts and applies custom class from props', () => {
      wrapper = createWrapper({ class: 'custom-class' });
      const nav = wrapper.find('nav');
      expect(nav.classes()).toContain('custom-class');
    });
  });

  describe('Navigation Links', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders Dashboard link', () => {
      const dashboardLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(dashboardLink.exists()).toBe(true);
      expect(dashboardLink.props('to')).toEqual({ name: 'home', params: {}, query: {} });
      expect(dashboardLink.text()).toBe('Dashboard');
    });

    it('renders Projects link', () => {
      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const projectsLink = links.find((link: any) => link.text() === 'Projects');
      expect(projectsLink).toBeTruthy();
      expect(projectsLink!.props('to')).toEqual({ name: 'projects', params: {}, query: {} });
    });

    it('initially shows Dashboard, Projects, and Tickets links', () => {
      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      expect(links).toHaveLength(3);

      const linkTexts = links.map((link: any) => link.text());
      expect(linkTexts).toContain('Dashboard');
      expect(linkTexts).toContain('Projects');
      expect(linkTexts).toContain('Tickets');
      expect(linkTexts).not.toContain('Results');
      expect(linkTexts).not.toContain('Settings');
    });
  });

  describe('Conditional Navigation Links', () => {
    it('shows Results link when page is results', async () => {
      mockStateStore.page = 'results';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const resultsLink = links.find((link: any) => link.text() === 'Results');
      expect(resultsLink).toBeTruthy();
      expect(resultsLink!.props('to')).toEqual({ name: 'results', params: {}, query: {} });
    });

    it('shows Settings link when page is settings', async () => {
      mockStateStore.page = 'settings';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const settingsLink = links.find((link: any) => link.text() === 'Settings');
      expect(settingsLink).toBeTruthy();
      expect(settingsLink!.props('to')).toEqual({ name: 'settings', params: {}, query: {} });
    });

    it('hides Results link when page is not results', async () => {
      mockStateStore.page = 'dashboard';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const resultsLink = links.find((link: any) => link.text() === 'Results');
      expect(resultsLink).toBeFalsy();
    });

    it('hides Settings link when page is not settings', async () => {
      mockStateStore.page = 'dashboard';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const settingsLink = links.find((link: any) => link.text() === 'Settings');
      expect(settingsLink).toBeFalsy();
    });
  });

  describe('Active State Styling', () => {
    it('applies active styling to Dashboard when page is dashboard', async () => {
      mockStateStore.page = 'dashboard';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const dashboardLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(dashboardLink.classes()).toContain('text-gray-900');
      expect(dashboardLink.classes()).toContain('font-semibold');
      
      const indicator = dashboardLink.find('.absolute.bottom-0');
      expect(indicator.exists()).toBe(true);
      expect(indicator.classes()).toContain('bg-gray-900');
    });

    it('applies active styling to Dashboard when page is home', async () => {
      mockStateStore.page = 'home';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const dashboardLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(dashboardLink.classes()).toContain('text-gray-900');
      expect(dashboardLink.classes()).toContain('font-semibold');
    });

    it('applies inactive styling to Dashboard when page is not dashboard/home', async () => {
      mockStateStore.page = 'projects';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const dashboardLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(dashboardLink.classes()).toContain('text-gray-600');
      expect(dashboardLink.classes()).not.toContain('text-gray-900');
      expect(dashboardLink.classes()).not.toContain('font-semibold');
    });

    it('applies active styling to Projects when page is projects', async () => {
      mockStateStore.page = 'projects';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const projectsLink = links.find((link: any) => link.text() === 'Projects');
      expect(projectsLink!.classes()).toContain('text-gray-900');
      expect(projectsLink!.classes()).toContain('font-semibold');

      const indicator = projectsLink!.find('.absolute.bottom-0');
      expect(indicator.exists()).toBe(true);
    });

    it('applies active styling to Results when page is results', async () => {
      mockStateStore.page = 'results';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const resultsLink = links.find((link: any) => link.text() === 'Results');
      expect(resultsLink!.classes()).toContain('text-gray-900');
      expect(resultsLink!.classes()).toContain('font-semibold');
    });

    it('applies active styling to Settings when page is settings', async () => {
      mockStateStore.page = 'settings';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      const settingsLink = links.find((link: any) => link.text() === 'Settings');
      expect(settingsLink!.classes()).toContain('text-gray-900');
      expect(settingsLink!.classes()).toContain('font-semibold');
    });
  });

  describe('Link Styling', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('applies correct base styling to all links', () => {
      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      links.forEach((link: any) => {
        expect(link.classes()).toContain('text-sm');
        expect(link.classes()).toContain('font-medium');
        expect(link.classes()).toContain('transition-all');
        expect(link.classes()).toContain('duration-200');
        expect(link.classes()).toContain('hover:text-gray-900');
        expect(link.classes()).toContain('relative');
        expect(link.classes()).toContain('py-2');
      });
    });

    it('renders active indicators with correct styling', async () => {
      mockStateStore.page = 'dashboard';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const indicator = wrapper.find('.absolute.bottom-0');
      expect(indicator.exists()).toBe(true);
      expect(indicator.classes()).toContain('left-0');
      expect(indicator.classes()).toContain('right-0');
      expect(indicator.classes()).toContain('h-0.5');
      expect(indicator.classes()).toContain('bg-gray-900');
      expect(indicator.classes()).toContain('rounded-full');
    });
  });

  describe('Store Integration', () => {
    it('reacts to state store page changes', async () => {
      // Initially no active styling
      mockStateStore.page = '';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      
      const dashboardLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(dashboardLink.classes()).toContain('text-gray-600');
    });

    it('handles undefined page state gracefully', async () => {
      mockStateStore.page = undefined as any;
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      expect(wrapper.exists()).toBe(true);
      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty page state', async () => {
      mockStateStore.page = '';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      expect(links).toHaveLength(3); // Dashboard, Projects, and Tickets
    });

    it('handles unknown page state', async () => {
      mockStateStore.page = 'unknown';
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();

      const links = wrapper.findAllComponents({ name: 'RouterLink' });
      expect(links).toHaveLength(3); // Dashboard, Projects, and Tickets
    });

    it('renders without store initially', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });
  });
});