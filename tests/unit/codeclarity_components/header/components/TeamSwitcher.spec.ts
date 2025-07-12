import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TeamSwitcher from '@/codeclarity_components/header/components/TeamSwitcher.vue';

// Mock external dependencies
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    go: vi.fn(),
    currentRoute: {
      value: { name: 'home' }
    }
  }
}));

// Mock stores
const mockUserStore = {
  getUser: {
    id: 'user-123',
    default_org: { id: 'org-123', name: 'default-org' }
  },
  getDefaultOrg: { id: 'org-123', name: 'Test Org' },
  setDefaultOrg: vi.fn()
};

const mockAuthStore = {
  getAuthenticated: true,
  getToken: 'test-token'
};

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore
}));

// Mock repositories
class MockOrgRepository {
  async getMany() {
    return {
      data: [
        { organization: { id: 'org-123', name: 'Test Org' } },
        { organization: { id: 'org-456', name: 'Another Org' } }
      ]
    };
  }

  async get() {
    return { id: 'org-123', name: 'Test Org' };
  }
}

class MockUserRepository {
  async setDefaultOrg() {
    return { success: true };
  }
}

vi.mock('@/codeclarity_components/organizations/organization.repository', () => ({
  OrgRepository: MockOrgRepository
}));

vi.mock('@/codeclarity_components/authentication/user.repository', () => ({
  UserRepository: MockUserRepository
}));

// Mock toast functions
vi.mock('@/utils/toasts', () => ({
  successToast: vi.fn(),
  errorToast: vi.fn()
}));

// Mock shadcn utils
vi.mock('@/shadcn/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' ')
}));

// Mock UI components
const mockButton = {
  name: 'Button',
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'role', 'aria-expanded', 'aria-label', 'class', 'type'],
  emits: ['click']
};

const mockDialog = {
  name: 'Dialog',
  template: '<div v-if="open" data-testid="dialog"><slot /></div>',
  props: ['open'],
  emits: ['update:open']
};

const mockDialogTrigger = {
  name: 'DialogTrigger',
  template: '<div data-testid="dialog-trigger" v-bind="$attrs"><slot /></div>',
  props: ['as-child']
};

const mockPopover = {
  name: 'Popover',
  template: '<div data-testid="popover"><slot /></div>',
  props: ['open'],
  emits: ['update:open']
};

const mockPopoverTrigger = {
  name: 'PopoverTrigger',
  template: '<div data-testid="popover-trigger" v-bind="$attrs"><slot /></div>',
  props: ['as-child']
};

const mockPopoverContent = {
  name: 'PopoverContent',
  template: '<div data-testid="popover-content" v-bind="$attrs"><slot /></div>',
  props: ['class']
};

const mockCommand = {
  name: 'Command',
  template: '<div data-testid="command" v-bind="$attrs"><slot /></div>',
  props: ['filter-function']
};

const mockCommandInput = {
  name: 'CommandInput',
  template: '<input data-testid="command-input" v-bind="$attrs" />',
  props: ['placeholder']
};

const mockCommandList = {
  name: 'CommandList',
  template: '<div data-testid="command-list"><slot /></div>'
};

const mockCommandEmpty = {
  name: 'CommandEmpty',
  template: '<div data-testid="command-empty"><slot /></div>'
};

const mockCommandGroup = {
  name: 'CommandGroup',
  template: '<div data-testid="command-group" @click="$emit(\'click\')"><h3 v-if="heading">{{ heading }}</h3><slot /></div>',
  props: ['heading'],
  emits: ['click']
};

const mockCommandItem = {
  name: 'CommandItem',
  template: '<div data-testid="command-item" v-bind="$attrs" @select="$emit(\'select\')"><slot /></div>',
  props: ['value', 'class'],
  emits: ['select']
};

const mockCommandSeparator = {
  name: 'CommandSeparator',
  template: '<hr data-testid="command-separator" />'
};

const mockAvatar = {
  name: 'Avatar',
  template: '<div data-testid="avatar" v-bind="$attrs"><slot /></div>',
  props: ['class']
};

const mockAvatarImage = {
  name: 'AvatarImage',
  template: '<img data-testid="avatar-image" v-bind="$attrs" />',
  props: ['src', 'alt', 'class']
};

const mockAvatarFallback = {
  name: 'AvatarFallback',
  template: '<div data-testid="avatar-fallback"><slot /></div>'
};

const mockIcon = {
  name: 'Icon',
  template: '<span data-testid="icon" :data-icon="icon" v-bind="$attrs"></span>',
  props: ['icon', 'class']
};

const mockCheckIcon = {
  name: 'CheckIcon',
  template: '<span data-testid="check-icon" v-bind="$attrs"></span>',
  props: ['class']
};

describe('TeamSwitcher', () => {
  let wrapper: any;

  const createWrapper = (props = {}) => {
    return mount(TeamSwitcher, {
      props,
      global: {
        components: {
          Button: mockButton,
          Dialog: mockDialog,
          DialogTrigger: mockDialogTrigger,
          Popover: mockPopover,
          PopoverTrigger: mockPopoverTrigger,
          PopoverContent: mockPopoverContent,
          Command: mockCommand,
          CommandInput: mockCommandInput,
          CommandList: mockCommandList,
          CommandEmpty: mockCommandEmpty,
          CommandGroup: mockCommandGroup,
          CommandItem: mockCommandItem,
          CommandSeparator: mockCommandSeparator,
          Avatar: mockAvatar,
          AvatarImage: mockAvatarImage,
          AvatarFallback: mockAvatarFallback,
          Icon: mockIcon,
          CheckIcon: mockCheckIcon
        }
      }
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock store states
    mockUserStore.getUser = {
      id: 'user-123',
      default_org: { id: 'org-123', name: 'default-org' }
    };
    
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

    it('renders main dialog and popover structure', () => {
      wrapper = createWrapper();
      
      const dialog = wrapper.findComponent({ name: 'Dialog' });
      const popover = wrapper.findComponent({ name: 'Popover' });
      
      expect(dialog.exists()).toBe(true);
      expect(popover.exists()).toBe(true);
    });

    it('renders trigger button with correct properties', () => {
      wrapper = createWrapper();
      
      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.exists()).toBe(true);
      expect(button.props('variant')).toBe('outline');
      expect(button.props('role')).toBe('combobox');
      expect(button.props('aria-label')).toBe('Select an organization');
    });

    it('renders avatar in trigger button', () => {
      wrapper = createWrapper();
      
      const popoverTrigger = wrapper.findComponent({ name: 'PopoverTrigger' });
      const avatar = popoverTrigger.findComponent({ name: 'Avatar' });
      const avatarImage = avatar.findComponent({ name: 'AvatarImage' });
      const avatarFallback = avatar.findComponent({ name: 'AvatarFallback' });
      
      expect(avatar.exists()).toBe(true);
      expect(avatarImage.exists()).toBe(true);
      expect(avatarFallback.exists()).toBe(true);
      expect(avatarFallback.text()).toBe('SC');
    });

    it('renders sort icon in trigger button', () => {
      wrapper = createWrapper();
      
      const icon = wrapper.findComponent({ name: 'Icon' });
      expect(icon.exists()).toBe(true);
      expect(icon.props('icon')).toBe('radix-icons:caret-sort');
    });
  });

  describe('Command Structure', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders command components', () => {
      const command = wrapper.findComponent({ name: 'Command' });
      const commandInput = wrapper.findComponent({ name: 'CommandInput' });
      const commandList = wrapper.findComponent({ name: 'CommandList' });
      const commandEmpty = wrapper.findComponent({ name: 'CommandEmpty' });
      
      expect(command.exists()).toBe(true);
      expect(commandInput.exists()).toBe(true);
      expect(commandList.exists()).toBe(true);
      expect(commandEmpty.exists()).toBe(true);
    });

    it('renders search input with placeholder', () => {
      const commandInput = wrapper.findComponent({ name: 'CommandInput' });
      expect(commandInput.props('placeholder')).toBe('Search organization...');
    });

    it('renders empty state message', () => {
      const commandEmpty = wrapper.findComponent({ name: 'CommandEmpty' });
      expect(commandEmpty.text()).toBe('No organization found.');
    });

    it('renders command separator', () => {
      const separator = wrapper.findComponent({ name: 'CommandSeparator' });
      expect(separator.exists()).toBe(true);
    });

    it('has custom filter function', () => {
      const command = wrapper.findComponent({ name: 'Command' });
      expect(command.props('filter-function')).toBeDefined();
      expect(typeof command.props('filter-function')).toBe('function');
    });
  });

  describe('Team/Organization Items', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders command groups', () => {
      const groups = wrapper.findAllComponents({ name: 'CommandGroup' });
      expect(groups.length).toBeGreaterThan(0);
    });

    it('renders command items for organizations', () => {
      const items = wrapper.findAllComponents({ name: 'CommandItem' });
      expect(items.length).toBeGreaterThan(0);
    });

    it('renders create organization option', () => {
      const items = wrapper.findAllComponents({ name: 'CommandItem' });
      const createItem = items.find(item => 
        item.props('value') === 'create-team'
      );
      expect(createItem).toBeTruthy();
    });

    it('renders plus icon for create organization', () => {
      const icons = wrapper.findAllComponents({ name: 'Icon' });
      const plusIcon = icons.find(icon => 
        icon.props('icon') === 'radix-icons:plus-circled'
      );
      expect(plusIcon).toBeTruthy();
    });

    it('displays create organization text', () => {
      expect(wrapper.text()).toContain('Create Organization');
    });
  });

  describe('Avatar Display', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders avatars for team items', () => {
      const avatars = wrapper.findAllComponents({ name: 'Avatar' });
      expect(avatars.length).toBeGreaterThan(1); // At least trigger + team items
    });

    it('renders avatar images with correct src pattern', () => {
      const avatarImages = wrapper.findAllComponents({ name: 'AvatarImage' });
      avatarImages.forEach(image => {
        expect(image.props('src')).toContain('https://avatar.vercel.sh/');
        expect(image.props('src')).toContain('.png');
      });
    });

    it('renders avatar fallbacks', () => {
      const fallbacks = wrapper.findAllComponents({ name: 'AvatarFallback' });
      expect(fallbacks.length).toBeGreaterThan(0);
    });

    it('applies grayscale to team item avatars', () => {
      const commandItems = wrapper.findAllComponents({ name: 'CommandItem' });
      commandItems.forEach(item => {
        const avatarImage = item.findComponent({ name: 'AvatarImage' });
        if (avatarImage.exists()) {
          // Check if the item is not the create team item
          if (item.props('value') !== 'create-team') {
            expect(avatarImage.props('class')).toContain('grayscale');
          }
        }
      });
    });
  });

  describe('Selection State', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders check icons', () => {
      const checkIcons = wrapper.findAllComponents({ name: 'CheckIcon' });
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('applies correct opacity classes to check icons', () => {
      const checkIcons = wrapper.findAllComponents({ name: 'CheckIcon' });
      checkIcons.forEach(icon => {
        const classes = icon.props('class');
        expect(classes).toContain('ml-auto');
        expect(classes).toContain('h-4');
        expect(classes).toContain('w-4');
        // Should have either opacity-100 or opacity-0
        expect(
          classes.includes('opacity-100') || classes.includes('opacity-0')
        ).toBe(true);
      });
    });
  });

  describe('Interaction Handling', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('handles command item selection', async () => {
      const commandItems = wrapper.findAllComponents({ name: 'CommandItem' });
      
      // Find a team item (not create-team)
      const teamItem = commandItems.find(item => 
        item.props('value') !== 'create-team'
      );
      
      if (teamItem) {
        await teamItem.trigger('select');
        expect(teamItem.emitted('select')).toBeTruthy();
      }
    });

    it('handles create organization selection', async () => {
      const commandItems = wrapper.findAllComponents({ name: 'CommandItem' });
      const createItem = commandItems.find(item => 
        item.props('value') === 'create-team'
      );
      
      if (createItem) {
        await createItem.trigger('select');
        expect(createItem.emitted('select')).toBeTruthy();
      }
    });

    it('handles create organization group click', async () => {
      const commandGroups = wrapper.findAllComponents({ name: 'CommandGroup' });
      
      // Find the group that contains the create organization button
      const createGroup = commandGroups[commandGroups.length - 1]; // Usually the last one
      
      await createGroup.trigger('click');
      expect(createGroup.emitted('click')).toBeTruthy();
    });
  });

  describe('Styling and Classes', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('applies correct button styling', () => {
      const button = wrapper.findComponent({ name: 'Button' });
      const classes = button.props('class');
      
      expect(classes).toContain('w-[220px]');
      expect(classes).toContain('justify-between');
      expect(classes).toContain('bg-gray-50');
      expect(classes).toContain('border-gray-300');
      expect(classes).toContain('hover:bg-gray-100');
    });

    it('applies correct popover content styling', () => {
      const popoverContent = wrapper.findComponent({ name: 'PopoverContent' });
      expect(popoverContent.props('class')).toContain('w-[220px]');
      expect(popoverContent.props('class')).toContain('p-0');
    });

    it('applies correct avatar sizing', () => {
      const avatars = wrapper.findAllComponents({ name: 'Avatar' });
      avatars.forEach(avatar => {
        expect(avatar.props('class')).toContain('h-5');
        expect(avatar.props('class')).toContain('w-5');
      });
    });

    it('applies correct icon styling', () => {
      const sortIcon = wrapper.findComponent({ name: 'Icon' });
      expect(sortIcon.props('class')).toContain('ml-auto');
      expect(sortIcon.props('class')).toContain('h-4');
      expect(sortIcon.props('class')).toContain('w-4');
      expect(sortIcon.props('class')).toContain('shrink-0');
      expect(sortIcon.props('class')).toContain('opacity-50');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('has proper ARIA attributes on trigger button', () => {
      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.props('role')).toBe('combobox');
      expect(button.props('aria-expanded')).toBe('open');
      expect(button.props('aria-label')).toBe('Select an organization');
    });

    it('provides alt text for avatar images', () => {
      const avatarImages = wrapper.findAllComponents({ name: 'AvatarImage' });
      avatarImages.forEach(image => {
        expect(image.props('alt')).toBeDefined();
        expect(image.props('alt')).not.toBe('');
      });
    });

    it('has proper semantic structure', () => {
      // Check for command structure
      expect(wrapper.findComponent({ name: 'Command' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandInput' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'CommandList' }).exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty props gracefully', () => {
      wrapper = createWrapper({});
      expect(wrapper.exists()).toBe(true);
    });

    it('handles undefined user store data', () => {
      mockUserStore.getUser = undefined;
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('handles unauthenticated state', () => {
      mockAuthStore.getAuthenticated = false;
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('renders with minimal required elements', () => {
      wrapper = createWrapper();
      
      // Essential elements should still render
      expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Dialog' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Popover' }).exists()).toBe(true);
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('properly integrates dialog and popover components', () => {
      const dialog = wrapper.findComponent({ name: 'Dialog' });
      const popover = dialog.findComponent({ name: 'Popover' });
      
      expect(popover.exists()).toBe(true);
    });

    it('properly nests command components', () => {
      const command = wrapper.findComponent({ name: 'Command' });
      const commandList = command.findComponent({ name: 'CommandList' });
      const commandInput = command.findComponent({ name: 'CommandInput' });
      
      expect(commandList.exists()).toBe(true);
      expect(commandInput.exists()).toBe(true);
    });

    it('maintains proper component hierarchy', () => {
      const popoverContent = wrapper.findComponent({ name: 'PopoverContent' });
      const command = popoverContent.findComponent({ name: 'Command' });
      
      expect(command.exists()).toBe(true);
    });
  });
});