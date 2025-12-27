import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import FaqBox from '@/base_components/layout/FaqBox.vue';

// Mock external dependencies
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span data-testid="icon" :class="$attrs.class" :data-icon="icon"><slot /></span>',
    props: ['icon']
  }
}));

describe('FaqBox', () => {
  describe('Rendering', () => {
    it('renders with default collapsed state', () => {
      const wrapper = mount(FaqBox);
      
      expect(wrapper.find('.bg-gray-100').exists()).toBe(true);
      expect(wrapper.find('.description').exists()).toBe(false);
      expect(wrapper.find('[data-icon="tabler:plus"]').exists()).toBe(true);
      expect(wrapper.find('[data-icon="tabler:minus"]').exists()).toBe(false);
    });

    it('has correct container styling', () => {
      const wrapper = mount(FaqBox);
      const container = wrapper.find('.bg-gray-100');
      
      expect(container.classes()).toContain('bg-gray-100');
      expect(container.classes()).toContain('rounded');
      expect(container.classes()).toContain('p-2');
      expect(container.classes()).toContain('flex');
      expect(container.classes()).toContain('flex-col');
      expect(container.classes()).toContain('gap-2');
      expect(container.classes()).toContain('w-5/12');
    });

    it('has correct header layout styling', () => {
      const wrapper = mount(FaqBox);
      const header = wrapper.find('.flex.flex-row.items-start.justify-between');
      
      expect(header.exists()).toBe(true);
      expect(header.classes()).toContain('flex');
      expect(header.classes()).toContain('flex-row');
      expect(header.classes()).toContain('items-start');
      expect(header.classes()).toContain('justify-between');
    });
  });

  describe('Slots', () => {
    it('renders question slot content', () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<h3>What is Vue.js?</h3>'
        }
      });
      
      expect(wrapper.find('.font-medium').html()).toContain('<h3>What is Vue.js?</h3>');
    });

    it('renders answer slot content when expanded', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Question</span>',
          answer: '<p>Vue.js is a progressive JavaScript framework.</p>'
        }
      });
      
      // Initially collapsed - answer should not be visible
      expect(wrapper.find('.description').exists()).toBe(false);
      
      // Expand by clicking plus icon
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      
      // Answer should now be visible
      expect(wrapper.find('.description').exists()).toBe(true);
      expect(wrapper.find('.description').html()).toContain('<p>Vue.js is a progressive JavaScript framework.</p>');
    });

    it('does not render answer slot when collapsed', () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Question</span>',
          answer: '<p>This should not be visible</p>'
        }
      });
      
      expect(wrapper.find('.description').exists()).toBe(false);
      expect(wrapper.html()).not.toContain('<p>This should not be visible</p>');
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('expands when plus icon is clicked', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Test Question</span>',
          answer: '<span>Test Answer</span>'
        }
      });
      
      // Initially collapsed
      expect(wrapper.find('.description').exists()).toBe(false);
      expect(wrapper.find('[data-icon="tabler:plus"]').exists()).toBe(true);
      expect(wrapper.find('[data-icon="tabler:minus"]').exists()).toBe(false);
      
      // Click to expand
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      
      // Should be expanded
      expect(wrapper.find('.description').exists()).toBe(true);
      expect(wrapper.find('[data-icon="tabler:plus"]').exists()).toBe(false);
      expect(wrapper.find('[data-icon="tabler:minus"]').exists()).toBe(true);
    });

    it('collapses when minus icon is clicked', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Test Question</span>',
          answer: '<span>Test Answer</span>'
        }
      });
      
      // First expand
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      expect(wrapper.find('.description').exists()).toBe(true);
      
      // Then collapse
      await wrapper.find('[data-icon="tabler:minus"]').trigger('click');
      
      // Should be collapsed again
      expect(wrapper.find('.description').exists()).toBe(false);
      expect(wrapper.find('[data-icon="tabler:plus"]').exists()).toBe(true);
      expect(wrapper.find('[data-icon="tabler:minus"]').exists()).toBe(false);
    });

    it('toggles between expanded and collapsed states', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Toggle Test</span>',
          answer: '<span>Toggle Answer</span>'
        }
      });
      
      // Start collapsed
      expect(wrapper.find('.description').exists()).toBe(false);
      
      // Expand
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      expect(wrapper.find('.description').exists()).toBe(true);
      
      // Collapse
      await wrapper.find('[data-icon="tabler:minus"]').trigger('click');
      expect(wrapper.find('.description').exists()).toBe(false);
      
      // Expand again
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      expect(wrapper.find('.description').exists()).toBe(true);
    });
  });

  describe('Icon Display Logic', () => {
    it('shows plus icon when collapsed', () => {
      const wrapper = mount(FaqBox);
      
      const plusIcon = wrapper.find('[data-icon="tabler:plus"]');
      const minusIcon = wrapper.find('[data-icon="tabler:minus"]');
      
      expect(plusIcon.exists()).toBe(true);
      expect(minusIcon.exists()).toBe(false);
    });

    it('shows minus icon when expanded', async () => {
      const wrapper = mount(FaqBox);
      
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      
      const plusIcon = wrapper.find('[data-icon="tabler:plus"]');
      const minusIcon = wrapper.find('[data-icon="tabler:minus"]');
      
      expect(plusIcon.exists()).toBe(false);
      expect(minusIcon.exists()).toBe(true);
    });

    it('applies correct styling to icon containers', () => {
      const wrapper = mount(FaqBox);
      
      const iconContainer = wrapper.find('.p-1.flex.flex-row.items-center.cursor-pointer');
      expect(iconContainer.exists()).toBe(true);
      expect(iconContainer.classes()).toContain('p-1');
      expect(iconContainer.classes()).toContain('flex');
      expect(iconContainer.classes()).toContain('flex-row');
      expect(iconContainer.classes()).toContain('items-center');
      expect(iconContainer.classes()).toContain('cursor-pointer');
      expect(iconContainer.classes()).toContain('h-fit');
      expect(iconContainer.classes()).toContain('hover:rounded-full');
      expect(iconContainer.classes()).toContain('hover:bg-gray-200');
    });

    it('has icon class on the icon elements', () => {
      const wrapper = mount(FaqBox);
      
      const icon = wrapper.find('[data-testid="icon"]');
      expect(icon.classes()).toContain('icon');
    });
  });

  describe('Interactive Behavior', () => {
    it('responds to click events on icon containers', async () => {
      const wrapper = mount(FaqBox);
      
      const plusContainer = wrapper.find('.p-1.flex.flex-row.items-center.cursor-pointer');
      
      // Click to expand
      await plusContainer.trigger('click');
      expect(wrapper.find('.description').exists()).toBe(true);
      
      // Find minus container after state change
      const minusContainer = wrapper.find('.p-1.flex.flex-row.items-center.cursor-pointer');
      
      // Click to collapse
      await minusContainer.trigger('click');
      expect(wrapper.find('.description').exists()).toBe(false);
    });

    it('maintains reactive state throughout interactions', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Reactive Test</span>',
          answer: '<span>Reactive Answer</span>'
        }
      });
      
      // Multiple expansions and collapses
      for (let i = 0; i < 3; i++) {
        // Expand
        await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
        expect(wrapper.find('.description').exists()).toBe(true);
        expect(wrapper.text()).toContain('Reactive Answer');
        
        // Collapse
        await wrapper.find('[data-icon="tabler:minus"]').trigger('click');
        expect(wrapper.find('.description').exists()).toBe(false);
      }
    });
  });

  describe('Component Structure', () => {
    it('has proper question section structure', () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Question Structure Test</span>'
        }
      });
      
      const questionSection = wrapper.find('.font-medium');
      expect(questionSection.exists()).toBe(true);
      expect(questionSection.classes()).toContain('font-medium');
      expect(questionSection.text()).toContain('Question Structure Test');
    });

    it('has proper answer section structure when expanded', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Question</span>',
          answer: '<span>Answer Structure Test</span>'
        }
      });
      
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      
      const answerSection = wrapper.find('.description');
      expect(answerSection.exists()).toBe(true);
      expect(answerSection.classes()).toContain('description');
      expect(answerSection.text()).toContain('Answer Structure Test');
    });
  });

  describe('Component Integration', () => {
    it('renders complete FAQ component with all content', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<strong>How do I install Vue.js?</strong>',
          answer: '<div><p>You can install Vue.js using npm:</p><code>npm install vue</code></div>'
        }
      });
      
      // Check question is visible
      expect(wrapper.html()).toContain('<strong>How do I install Vue.js?</strong>');
      
      // Expand to see answer
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      
      // Check answer is visible with all content
      expect(wrapper.html()).toContain('<p>You can install Vue.js using npm:</p>');
      expect(wrapper.html()).toContain('<code>npm install vue</code>');
    });

    it('handles empty slots gracefully', () => {
      const wrapper = mount(FaqBox);
      
      // Should render without errors even with empty slots
      expect(wrapper.find('.font-medium').exists()).toBe(true);
      expect(wrapper.find('[data-icon="tabler:plus"]').exists()).toBe(true);
    });

    it('preserves slot content through state changes', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<em>Persistent Question</em>',
          answer: '<strong>Persistent Answer</strong>'
        }
      });
      
      // Question should always be visible
      expect(wrapper.html()).toContain('<em>Persistent Question</em>');
      
      // Expand and check both are visible
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      expect(wrapper.html()).toContain('<em>Persistent Question</em>');
      expect(wrapper.html()).toContain('<strong>Persistent Answer</strong>');
      
      // Collapse and check question still visible
      await wrapper.find('[data-icon="tabler:minus"]').trigger('click');
      expect(wrapper.html()).toContain('<em>Persistent Question</em>');
      expect(wrapper.html()).not.toContain('<strong>Persistent Answer</strong>');
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid clicking without state corruption', async () => {
      const wrapper = mount(FaqBox, {
        slots: {
          question: '<span>Rapid Click Test</span>',
          answer: '<span>Rapid Click Answer</span>'
        }
      });
      
      // Rapidly click multiple times
      for (let i = 0; i < 5; i++) {
        await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
        await wrapper.find('[data-icon="tabler:minus"]').trigger('click');
      }
      
      // Should end in collapsed state
      expect(wrapper.find('.description').exists()).toBe(false);
      expect(wrapper.find('[data-icon="tabler:plus"]').exists()).toBe(true);
      expect(wrapper.find('[data-icon="tabler:minus"]').exists()).toBe(false);
    });

    it('maintains state consistency', async () => {
      const wrapper = mount(FaqBox);

      // Initial state
      expect((wrapper.vm as any).show).toBe(false);

      // After expansion
      await wrapper.find('[data-icon="tabler:plus"]').trigger('click');
      expect((wrapper.vm as any).show).toBe(true);

      // After collapse
      await wrapper.find('[data-icon="tabler:minus"]').trigger('click');
      expect((wrapper.vm as any).show).toBe(false);
    });
  });
});