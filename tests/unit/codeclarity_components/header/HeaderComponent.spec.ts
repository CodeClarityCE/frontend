import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import HeaderComponent from '@/codeclarity_components/header/HeaderComponent.vue';

// Mock all dependencies that use reflection
vi.mock('@/codeclarity_components/header/components/MainNav.vue', () => ({
  default: {
    name: 'MainNav',
    template: '<div data-testid="main-nav">MainNav</div>'
  }
}));

vi.mock('@/codeclarity_components/header/components/SearchHeader.vue', () => ({
  default: {
    name: 'SearchHeader', 
    template: '<div data-testid="search-header">SearchHeader</div>'
  }
}));

vi.mock('@/codeclarity_components/header/components/TeamSwitcher.vue', () => ({
  default: {
    name: 'TeamSwitcher',
    template: '<div data-testid="team-switcher">TeamSwitcher</div>'
  }
}));

vi.mock('@/codeclarity_components/header/components/UserNav.vue', () => ({
  default: {
    name: 'UserNav',
    template: '<div data-testid="user-nav">UserNav</div>'
  }
}));

describe('HeaderComponent', () => {
  let wrapper: any;

  const createWrapper = (props = {}) => {
    return mount(HeaderComponent, {
      props
    });
  };

  beforeEach(() => {
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

    it('has the correct responsive layout classes', () => {
      wrapper = createWrapper();
      const container = wrapper.find('div');
      expect(container.classes()).toContain('hidden');
      expect(container.classes()).toContain('flex-col');
      expect(container.classes()).toContain('md:flex');
    });

    it('renders header with proper styling', () => {
      wrapper = createWrapper();
      const header = wrapper.find('.border-b');
      expect(header.exists()).toBe(true);
      expect(header.classes()).toContain('border-gray-200');
      expect(header.classes()).toContain('bg-white/95');
      expect(header.classes()).toContain('backdrop-blur-sm');
      expect(header.classes()).toContain('sticky');
      expect(header.classes()).toContain('top-0');
      expect(header.classes()).toContain('z-50');
    });

    it('renders logo with router link', () => {
      wrapper = createWrapper();
      const logoLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(logoLink.exists()).toBe(true);
      expect(logoLink.props('to')).toEqual({ name: 'home' });
      
      const logo = logoLink.find('img');
      expect(logo.exists()).toBe(true);
      expect(logo.attributes('src')).toContain('svg'); // SVG image gets processed
      expect(logo.classes()).toContain('h-8');
    });
  });

  describe('Child Components', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders TeamSwitcher component', () => {
      const teamSwitcher = wrapper.find('[data-testid="team-switcher"]');
      expect(teamSwitcher.exists()).toBe(true);
    });

    it('renders MainNav component', () => {
      const mainNav = wrapper.find('[data-testid="main-nav"]');
      expect(mainNav.exists()).toBe(true);
    });

    it('renders SearchHeader component', () => {
      const searchHeader = wrapper.find('[data-testid="search-header"]');
      expect(searchHeader.exists()).toBe(true);
    });

    it('renders UserNav component', () => {
      const userNav = wrapper.find('[data-testid="user-nav"]');
      expect(userNav.exists()).toBe(true);
    });
  });

  describe('Layout Structure', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('has correct flex container structure', () => {
      const flexContainer = wrapper.find('.flex.h-16');
      expect(flexContainer.exists()).toBe(true);
      expect(flexContainer.classes()).toContain('items-center');
      expect(flexContainer.classes()).toContain('px-6');
      expect(flexContainer.classes()).toContain('gap-4');
    });

    it('has separator dividers in correct positions', () => {
      const separators = wrapper.findAll('.h-6.w-px.bg-gray-300');
      expect(separators).toHaveLength(2);
    });

    it('positions navigation elements correctly', () => {
      const mainNav = wrapper.find('[data-testid="main-nav"]');
      expect(mainNav.classes()).toContain('mx-8');
      
      const rightSection = wrapper.find('.ml-auto');
      expect(rightSection.exists()).toBe(true);
      expect(rightSection.classes()).toContain('flex');
      expect(rightSection.classes()).toContain('items-center');
      expect(rightSection.classes()).toContain('gap-4');
    });
  });

  describe('Logo Interaction', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('logo link has hover effects', () => {
      const logoLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(logoLink.classes()).toContain('hover:opacity-80');
      expect(logoLink.classes()).toContain('transition-opacity');
      expect(logoLink.classes()).toContain('duration-200');
    });

    it('logo link has proper flex layout', () => {
      const logoLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(logoLink.classes()).toContain('flex');
      expect(logoLink.classes()).toContain('gap-2');
      expect(logoLink.classes()).toContain('items-center');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('logo image has proper styling for accessibility', () => {
      const logo = wrapper.find('img');
      expect(logo.classes()).toContain('self-center');
    });

    it('maintains proper semantic structure', () => {
      // Header should be a semantic container
      const header = wrapper.find('.border-b');
      expect(header.exists()).toBe(true);
      
      // Logo should be properly nested
      const logoContainer = wrapper.find('img').element.closest('a');
      expect(logoContainer).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty props gracefully', () => {
      wrapper = createWrapper({});
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without crashing when router is available', async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
      expect(wrapper.exists()).toBe(true);
    });
  });
});