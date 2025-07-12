import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ExpandableBox from '@/base_components/layout/ExpandableBox.vue';

// Mock external dependencies
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span data-testid="icon" :class="$attrs.class" :data-icon="icon" :title="$attrs.title"><slot /></span>',
    props: ['icon']
  }
}));

describe('ExpandableBox', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      const wrapper = mount(ExpandableBox);
      
      expect(wrapper.find('[collapsible-box]').exists()).toBe(true);
      expect(wrapper.find('.collapsible-show-more').exists()).toBe(true);
      expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true);
    });

    it('renders with collapsed state by default', () => {
      const wrapper = mount(ExpandableBox);
      
      expect(wrapper.find('.collapsible-content').attributes('style')).toContain('display: none');
      expect(wrapper.text()).toContain('Show more');
    });

    it('renders with expanded state when expand prop is true', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: true }
      });
      
      expect(wrapper.find('.collapsible-content').attributes('style')).toContain('display: block');
      expect(wrapper.text()).toContain('Show less');
    });

    it('has correct container structure', () => {
      const wrapper = mount(ExpandableBox);
      
      expect(wrapper.find('.project-patch-patch-container').exists()).toBe(true);
      expect(wrapper.find('.project-patch-patch-container-header').exists()).toBe(true);
      expect(wrapper.find('.title').exists()).toBe(true);
      expect(wrapper.find('.collapsible-content').exists()).toBe(true);
      expect(wrapper.find('.content-wrapper').exists()).toBe(true);
    });
  });

  describe('Slots', () => {
    it('renders title slot content', () => {
      const wrapper = mount(ExpandableBox, {
        slots: {
          title: '<h3>Test Title</h3>'
        }
      });
      
      expect(wrapper.find('.title').html()).toContain('<h3>Test Title</h3>');
    });

    it('renders body slot content', () => {
      const wrapper = mount(ExpandableBox, {
        slots: {
          body: '<p>Test Body Content</p>'
        }
      });
      
      expect(wrapper.html()).toContain('<p>Test Body Content</p>');
    });

    it('renders collapsible_content slot when expanded', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: true },
        slots: {
          collapsible_content: '<div>Expandable Content</div>'
        }
      });
      
      expect(wrapper.find('.content-wrapper').html()).toContain('<div>Expandable Content</div>');
    });

    it('renders collapsibe_content_inverse slot when collapsed', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: false },
        slots: {
          collapsibe_content_inverse: '<div>Collapsed Content</div>'
        }
      });
      
      expect(wrapper.html()).toContain('<div>Collapsed Content</div>');
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('toggles expansion state when clicking expand button', async () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: false }
      });
      
      expect(wrapper.text()).toContain('Show more');
      expect(wrapper.find('.collapsible-content').attributes('style')).toContain('display: none');
      
      await wrapper.find('.collapsible-show-more').trigger('click');
      
      expect(wrapper.text()).toContain('Show less');
      expect(wrapper.find('.collapsible-content').attributes('style')).toContain('display: block');
    });

    it('toggles from expanded to collapsed when clicking expand button', async () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: true }
      });
      
      expect(wrapper.text()).toContain('Show less');
      expect(wrapper.find('.collapsible-content').attributes('style')).toContain('display: block');
      
      await wrapper.find('.collapsible-show-more').trigger('click');
      
      expect(wrapper.text()).toContain('Show more');
      expect(wrapper.find('.collapsible-content').attributes('style')).toContain('display: none');
    });

    it('shows correct text based on expand state', async () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: false }
      });
      
      expect(wrapper.find('.collapse-text').text()).toBe('Show more');
      
      await wrapper.find('.collapsible-show-more').trigger('click');
      
      expect(wrapper.find('.collapse-text').text()).toBe('Show less');
    });
  });

  describe('Callback Functions', () => {
    it('calls expandCallBack when expanding', async () => {
      const expandCallback = vi.fn();
      const wrapper = mount(ExpandableBox, {
        props: { 
          expand: false,
          expandCallBack: expandCallback
        }
      });
      
      await wrapper.find('.collapsible-show-more').trigger('click');
      
      expect(expandCallback).toHaveBeenCalledOnce();
    });

    it('calls closeCallBack when collapsing', async () => {
      const closeCallback = vi.fn();
      const wrapper = mount(ExpandableBox, {
        props: { 
          expand: true,
          closeCallBack: closeCallback
        }
      });
      
      await wrapper.find('.collapsible-show-more').trigger('click');
      
      expect(closeCallback).toHaveBeenCalledOnce();
    });

    it('does not call callbacks when they are not provided', async () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: false }
      });
      
      // Should not throw error when callbacks are undefined
      await wrapper.find('.collapsible-show-more').trigger('click');
      expect(wrapper.text()).toContain('Show less');
    });

    it('calls correct callback based on current state', async () => {
      const expandCallback = vi.fn();
      const closeCallback = vi.fn();
      
      const wrapper = mount(ExpandableBox, {
        props: { 
          expand: false,
          expandCallBack: expandCallback,
          closeCallBack: closeCallback
        }
      });
      
      // First click - should expand and call expandCallBack
      await wrapper.find('.collapsible-show-more').trigger('click');
      expect(expandCallback).toHaveBeenCalledOnce();
      expect(closeCallback).not.toHaveBeenCalled();
      
      // Second click - should collapse and call closeCallBack
      await wrapper.find('.collapsible-show-more').trigger('click');
      expect(closeCallback).toHaveBeenCalledOnce();
      expect(expandCallback).toHaveBeenCalledOnce(); // Still only once
    });
  });

  describe('Icon and Visual Elements', () => {
    it('renders chevron down icon', () => {
      const wrapper = mount(ExpandableBox);
      
      const icon = wrapper.find('[data-testid="icon"]');
      expect(icon.exists()).toBe(true);
      expect(icon.attributes('data-icon')).toBe('ion:chevron-down-outline');
      expect(icon.attributes('title')).toBe('Show more details');
    });

    it('has correct CSS classes for expand button', () => {
      const wrapper = mount(ExpandableBox);
      
      const expandButton = wrapper.find('.collapsible-show-more');
      expect(expandButton.classes()).toContain('collapse-selector');
      
      const buttonInner = wrapper.find('.collapsible-show-more-inner');
      expect(buttonInner.exists()).toBe(true);
      
      const icon = wrapper.find('.collapse-icon');
      expect(icon.exists()).toBe(true);
    });
  });

  describe('Content Display Logic', () => {
    it('shows collapsibe_content_inverse when collapsed', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: false },
        slots: {
          collapsibe_content_inverse: '<div data-testid="inverse-content">Collapsed View</div>'
        }
      });
      
      const inverseContent = wrapper.find('[data-testid="inverse-content"]');
      expect(inverseContent.exists()).toBe(true);
      
      // Check that the parent container has the correct style for showing content
      const parentDiv = inverseContent.element.closest('div[style]');
      const hasDisplayBlock = !parentDiv || !parentDiv.getAttribute('style')?.includes('display: none');
      expect(hasDisplayBlock).toBe(true);
    });

    it('hides collapsibe_content_inverse when expanded', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: true },
        slots: {
          collapsibe_content_inverse: '<div data-testid="inverse-content">Collapsed View</div>'
        }
      });
      
      const inverseContentContainer = wrapper.find('div[style*="display: none"]');
      expect(inverseContentContainer.exists()).toBe(true);
    });

    it('shows collapsible_content when expanded', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: true },
        slots: {
          collapsible_content: '<div data-testid="expandable-content">Expanded View</div>'
        }
      });
      
      const collapsibleContent = wrapper.find('.collapsible-content');
      expect(collapsibleContent.attributes('style')).toContain('display: block');
      
      const expandableContent = wrapper.find('[data-testid="expandable-content"]');
      expect(expandableContent.exists()).toBe(true);
    });

    it('hides collapsible_content when collapsed', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: false },
        slots: {
          collapsible_content: '<div data-testid="expandable-content">Expanded View</div>'
        }
      });
      
      const collapsibleContent = wrapper.find('.collapsible-content');
      expect(collapsibleContent.attributes('style')).toContain('display: none');
    });
  });

  describe('Component Integration', () => {
    it('renders complete component with all slots', () => {
      const wrapper = mount(ExpandableBox, {
        props: { expand: false },
        slots: {
          title: '<h2>Test Title</h2>',
          body: '<p>Test Body</p>',
          collapsible_content: '<div>Expandable Content</div>',
          collapsibe_content_inverse: '<div>Collapsed Content</div>'
        }
      });
      
      expect(wrapper.html()).toContain('<h2>Test Title</h2>');
      expect(wrapper.html()).toContain('<p>Test Body</p>');
      expect(wrapper.html()).toContain('<div>Expandable Content</div>');
      expect(wrapper.html()).toContain('<div>Collapsed Content</div>');
    });

    it('maintains state through multiple interactions', async () => {
      const expandCallback = vi.fn();
      const closeCallback = vi.fn();
      
      const wrapper = mount(ExpandableBox, {
        props: { 
          expand: false,
          expandCallBack: expandCallback,
          closeCallBack: closeCallback
        }
      });
      
      // Start collapsed
      expect(wrapper.text()).toContain('Show more');
      
      // Expand
      await wrapper.find('.collapsible-show-more').trigger('click');
      expect(wrapper.text()).toContain('Show less');
      expect(expandCallback).toHaveBeenCalledOnce();
      
      // Collapse
      await wrapper.find('.collapsible-show-more').trigger('click');
      expect(wrapper.text()).toContain('Show more');
      expect(closeCallback).toHaveBeenCalledOnce();
      
      // Expand again
      await wrapper.find('.collapsible-show-more').trigger('click');
      expect(wrapper.text()).toContain('Show less');
      expect(expandCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing slots gracefully', () => {
      const wrapper = mount(ExpandableBox);
      
      expect(wrapper.find('.title').exists()).toBe(true);
      expect(wrapper.find('.content-wrapper').exists()).toBe(true);
      // Should not throw errors with empty slots
    });

    it('handles callback functions as undefined', async () => {
      const wrapper = mount(ExpandableBox, {
        props: { 
          expand: false,
          expandCallBack: undefined,
          closeCallBack: undefined
        }
      });
      
      // Should not throw error when clicking with undefined callbacks
      await wrapper.find('.collapsible-show-more').trigger('click');
      expect(wrapper.text()).toContain('Show less');
    });

    it('preserves initial expand state from props', () => {
      const wrapperCollapsed = mount(ExpandableBox, {
        props: { expand: false }
      });
      const wrapperExpanded = mount(ExpandableBox, {
        props: { expand: true }
      });
      
      expect(wrapperCollapsed.text()).toContain('Show more');
      expect(wrapperExpanded.text()).toContain('Show less');
    });
  });
});