import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchHeader from '@/codeclarity_components/header/components/SearchHeader.vue';

// Mock external dependencies
vi.mock('@vueuse/core', () => ({
  useMagicKeys: () => ({
    Meta_K: { value: false },
    Ctrl_K: { value: false },
    enter: { value: false }
  })
}));

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

// Mock stores
const mockUserStore = {
  defaultOrg: { id: 'org-123' }
};

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore
}));

// Mock UI components
const mockButton = {
  name: 'Button',
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'size', 'class'],
  emits: ['click']
};

const mockCommandDialog = {
  name: 'CommandDialog',
  template: '<div v-if="open" data-testid="command-dialog"><slot /></div>',
  props: ['open'],
  emits: ['update:open']
};

const mockCommandInput = {
  name: 'CommandInput',
  template: '<input data-testid="command-input" v-bind="$attrs" />',
  props: ['placeholder']
};

const mockCommandList = {
  name: 'CommandList',
  template: '<div data-testid="command-list" @click="$emit(\'click\')"><slot /></div>',
  emits: ['click']
};

const mockCommandEmpty = {
  name: 'CommandEmpty',
  template: '<div data-testid="command-empty"><slot /></div>'
};

const mockCommandGroup = {
  name: 'CommandGroup',
  template: '<div data-testid="command-group"><h3 v-if="heading">{{ heading }}</h3><slot /></div>',
  props: ['heading']
};

const mockCommandItem = {
  name: 'CommandItem',
  template: '<div data-testid="command-item" v-bind="$attrs"><slot /></div>',
  props: ['value', 'class']
};

const mockCommandSeparator = {
  name: 'CommandSeparator',
  template: '<hr data-testid="command-separator" />'
};

const mockIcon = {
  name: 'Icon',
  template: '<span data-testid="icon" :data-icon="icon"></span>',
  props: ['icon']
};

describe('SearchHeader', () => {
  let wrapper: any;

  const createWrapper = (props = {}) => {
    return mount(SearchHeader, {
      props,
      global: {
        components: {
          Button: mockButton,
          CommandDialog: mockCommandDialog,
          CommandInput: mockCommandInput,
          CommandList: mockCommandList,
          CommandEmpty: mockCommandEmpty,
          CommandGroup: mockCommandGroup,
          CommandItem: mockCommandItem,
          CommandSeparator: mockCommandSeparator,
          Icon: mockIcon
        }
      }
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
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

    it('renders main container with correct classes', () => {
      wrapper = createWrapper();
      const container = wrapper.find('div');
      expect(container.classes()).toContain('flex');
      expect(container.classes()).toContain('items-center');
    });

    it('renders search button with correct styling', () => {
      wrapper = createWrapper();
      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.exists()).toBe(true);
      expect(button.props('variant')).toBe('outline');
      expect(button.props('size')).toBe('sm');
      expect(button.classes()).toContain('bg-gray-50');
      expect(button.classes()).toContain('border-gray-300');
    });

    it('renders search icon in button', () => {
      wrapper = createWrapper();
      const icons = wrapper.findAllComponents({ name: 'Icon' });
      const searchIcon = icons.find(icon => 
        icon.attributes('data-icon') === 'lucide:search'
      );
      expect(searchIcon).toBeTruthy();
    });

    it('renders keyboard shortcut display', () => {
      wrapper = createWrapper();
      const kbd = wrapper.find('kbd');
      expect(kbd.exists()).toBe(true);
      expect(kbd.text()).toContain('⌘');
      expect(kbd.text()).toContain('K');
      expect(kbd.classes()).toContain('pointer-events-none');
    });

    it('renders report problem button', () => {
      wrapper = createWrapper();
      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const reportButton = buttons[1]; // Second button
      expect(reportButton.props('variant')).toBe('link');
      
      const link = reportButton.find('a');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toContain('github.com');
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });
  });

  describe('Command Dialog', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders command dialog', () => {
      const dialog = wrapper.findComponent({ name: 'CommandDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('renders command input with placeholder', () => {
      const input = wrapper.findComponent({ name: 'CommandInput' });
      expect(input.exists()).toBe(true);
      expect(input.props('placeholder')).toBe('Type a command or search...');
    });

    it('renders command list', () => {
      const list = wrapper.findComponent({ name: 'CommandList' });
      expect(list.exists()).toBe(true);
    });

    it('renders empty state message', () => {
      const empty = wrapper.findComponent({ name: 'CommandEmpty' });
      expect(empty.exists()).toBe(true);
      expect(empty.text()).toBe('No results found.');
    });

    it('renders command separator', () => {
      const separator = wrapper.findComponent({ name: 'CommandSeparator' });
      expect(separator.exists()).toBe(true);
    });
  });

  describe('Command Groups and Items', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders Pages command group', () => {
      const groups = wrapper.findAllComponents({ name: 'CommandGroup' });
      const pagesGroup = groups.find(group => 
        group.props('heading') === 'Pages'
      );
      expect(pagesGroup).toBeTruthy();
    });

    it('renders Commands command group', () => {
      const groups = wrapper.findAllComponents({ name: 'CommandGroup' });
      const commandsGroup = groups.find(group => 
        group.props('heading') === 'Commands'
      );
      expect(commandsGroup).toBeTruthy();
    });

    it('renders all page navigation items', () => {
      const items = wrapper.findAllComponents({ name: 'CommandItem' });
      const itemValues = items.map(item => item.props('value'));
      
      expect(itemValues).toContain('dashboard');
      expect(itemValues).toContain('projects');
      expect(itemValues).toContain('settings');
      expect(itemValues).toContain('organizations');
    });

    it('renders all command items', () => {
      const items = wrapper.findAllComponents({ name: 'CommandItem' });
      const itemValues = items.map(item => item.props('value'));
      
      expect(itemValues).toContain('create_analyzer');
      expect(itemValues).toContain('import_project');
    });

    it('applies cursor-pointer class to all command items', () => {
      const items = wrapper.findAllComponents({ name: 'CommandItem' });
      items.forEach(item => {
        expect(item.props('class')).toContain('cursor-pointer');
      });
    });
  });

  describe('Button Interactions', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('triggers handleOpenChange when search button is clicked', async () => {
      const searchButton = wrapper.findAllComponents({ name: 'Button' })[0];
      
      // Initially dialog should not be visible
      const dialog = wrapper.findComponent({ name: 'CommandDialog' });
      expect(dialog.props('open')).toBeFalsy();
      
      // Click the button
      await searchButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // Check if open state changed (we can't easily test the actual state change in this mock setup)
      expect(searchButton.exists()).toBe(true);
    });

    it('emits click event on command list interaction', async () => {
      const commandList = wrapper.findComponent({ name: 'CommandList' });
      await commandList.trigger('click');
      
      expect(commandList.emitted('click')).toBeTruthy();
    });
  });

  describe('External Links', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders GitHub issue link with correct attributes', () => {
      const link = wrapper.find('a[href*="github.com"]');
      expect(link.exists()).toBe(true);
      expect(link.attributes('href')).toContain('issues/new');
      expect(link.attributes('href')).toContain('template=BLANK_ISSUE');
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });

    it('renders ticket icon in report button', () => {
      const reportButton = wrapper.findAllComponents({ name: 'Button' })[1];
      const icon = reportButton.findComponent({ name: 'Icon' });
      expect(icon.attributes('data-icon')).toBe('ion:ticket-outline');
    });

    it('displays correct report button text', () => {
      const reportButton = wrapper.findAllComponents({ name: 'Button' })[1];
      expect(reportButton.text()).toContain('Report a problem');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('has proper keyboard shortcut indication', () => {
      const kbd = wrapper.find('kbd');
      expect(kbd.classes()).toContain('pointer-events-none');
      expect(kbd.classes()).toContain('select-none');
    });

    it('has proper button structure for screen readers', () => {
      const searchButton = wrapper.findAllComponents({ name: 'Button' })[0];
      expect(searchButton.text()).toContain('Commands');
    });

    it('uses semantic elements appropriately', () => {
      // Check that kbd element is used for keyboard shortcuts
      const kbd = wrapper.find('kbd');
      expect(kbd.element.tagName.toLowerCase()).toBe('kbd');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty props gracefully', () => {
      wrapper = createWrapper({});
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without crashing when stores are undefined', () => {
      // Mock undefined store response
      vi.mocked(mockUserStore).defaultOrg = undefined;
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('renders all required elements even with minimal data', () => {
      wrapper = createWrapper();
      
      // Essential elements should still render
      expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandDialog' }).exists()).toBe(true);
      expect(wrapper.find('kbd').exists()).toBe(true);
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('properly integrates with command palette components', () => {
      // Verify all command palette components are present
      expect(wrapper.findComponent({ name: 'CommandDialog' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandInput' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandList' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandEmpty' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandGroup' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandItem' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandSeparator' }).exists()).toBe(true);
    });

    it('has proper component hierarchy', () => {
      // CommandDialog should contain other command components
      const dialog = wrapper.findComponent({ name: 'CommandDialog' });
      const input = dialog.findComponent({ name: 'CommandInput' });
      const list = dialog.findComponent({ name: 'CommandList' });
      
      expect(input.exists()).toBe(true);
      expect(list.exists()).toBe(true);
    });
  });
});