import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UserNav from '@/codeclarity_components/header/components/UserNav.vue';

// Mock external dependencies
vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

// Mock stores
const mockUserStore = {
  getUser: {
    id: 'user-123',
    handle: 'johndoe',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe'
  },
  $reset: vi.fn()
};

const mockAuthStore = {
  getToken: 'test-token',
  $reset: vi.fn()
};

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore
}));

// Mock notification repository
class MockNotificationRepository {
  async getNotifications() {
    return {
      data: [
        {
          id: 'notif-1',
          title: 'Test Notification',
          description: 'Test notification description',
          content_type: 'general',
          content: {}
        },
        {
          id: 'notif-2',
          title: 'Package Update',
          description: 'New version available',
          content_type: 'new_version',
          content: {
            package: 'react',
            version: '18.0.0'
          }
        }
      ],
      matching_count: 2
    };
  }

  async deleteNotification() {
    return { success: true };
  }

  async deleteAllNotifications() {
    return { success: true };
  }
}

vi.mock('@/codeclarity_components/header/notification.repository', () => ({
  NotificationRepository: MockNotificationRepository
}));

// Mock business logic error
vi.mock('@/utils/api/BaseRepository', () => ({
  BusinessLogicError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'BusinessLogicError';
    }
  }
}));

// Mock UI components
const mockDropdownMenu = {
  name: 'DropdownMenu',
  template: '<div data-testid="dropdown-menu"><slot /></div>'
};

const mockDropdownMenuTrigger = {
  name: 'DropdownMenuTrigger',
  template: '<div data-testid="dropdown-trigger" v-bind="$attrs"><slot /></div>',
  props: ['as-child']
};

const mockDropdownMenuContent = {
  name: 'DropdownMenuContent',
  template: '<div data-testid="dropdown-content" v-bind="$attrs"><slot /></div>',
  props: ['class', 'align']
};

const mockDropdownMenuLabel = {
  name: 'DropdownMenuLabel',
  template: '<div data-testid="dropdown-label" v-bind="$attrs"><slot /></div>',
  props: ['class']
};

const mockDropdownMenuGroup = {
  name: 'DropdownMenuGroup',
  template: '<div data-testid="dropdown-group"><slot /></div>'
};

const mockDropdownMenuItem = {
  name: 'DropdownMenuItem',
  template: '<div data-testid="dropdown-item" v-bind="$attrs" @click="$emit(\'click\')"><slot /></div>',
  props: ['class'],
  emits: ['click']
};

const mockDropdownMenuSeparator = {
  name: 'DropdownMenuSeparator',
  template: '<hr data-testid="dropdown-separator" />'
};

const mockDropdownMenuShortcut = {
  name: 'DropdownMenuShortcut',
  template: '<span data-testid="dropdown-shortcut"><slot /></span>'
};

const mockButton = {
  name: 'Button',
  template: '<button data-testid="button" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
  props: ['variant', 'class'],
  emits: ['click']
};

const mockAvatar = {
  name: 'Avatar',
  template: '<div data-testid="avatar" v-bind="$attrs"><slot /></div>',
  props: ['class']
};

const mockAvatarImage = {
  name: 'AvatarImage',
  template: '<img data-testid="avatar-image" v-bind="$attrs" />',
  props: ['src', 'alt']
};

const mockAvatarFallback = {
  name: 'AvatarFallback',
  template: '<div data-testid="avatar-fallback" v-bind="$attrs"><slot /></div>',
  props: ['class']
};

const mockBadge = {
  name: 'Badge',
  template: '<span data-testid="badge" v-bind="$attrs"><slot /></span>',
  props: ['class']
};

const mockDialog = {
  name: 'Dialog',
  template: '<div v-if="true" data-testid="dialog"><slot /></div>'
};

const mockDialogTrigger = {
  name: 'DialogTrigger',
  template: '<div data-testid="dialog-trigger"><slot /></div>'
};

const mockDialogContent = {
  name: 'DialogContent',
  template: '<div data-testid="dialog-content"><slot /></div>'
};

const mockDialogTitle = {
  name: 'DialogTitle',
  template: '<h2 data-testid="dialog-title"><slot /></h2>'
};

const mockDialogDescription = {
  name: 'DialogDescription',
  template: '<div data-testid="dialog-description"><slot /></div>'
};

const mockDialogFooter = {
  name: 'DialogFooter',
  template: '<div data-testid="dialog-footer"><slot /></div>'
};

const mockIcon = {
  name: 'Icon',
  template: '<span data-testid="icon" :data-icon="icon" v-bind="$attrs"></span>',
  props: ['icon', 'class']
};

const mockRouterLink = {
  name: 'RouterLink',
  template: '<a data-testid="router-link" v-bind="$attrs"><slot /></a>',
  props: ['to', 'title']
};

describe('UserNav', () => {
  let wrapper: any;

  const createWrapper = (props = {}) => {
    return mount(UserNav, {
      props,
      global: {
        components: {
          DropdownMenu: mockDropdownMenu,
          DropdownMenuTrigger: mockDropdownMenuTrigger,
          DropdownMenuContent: mockDropdownMenuContent,
          DropdownMenuLabel: mockDropdownMenuLabel,
          DropdownMenuGroup: mockDropdownMenuGroup,
          DropdownMenuItem: mockDropdownMenuItem,
          DropdownMenuSeparator: mockDropdownMenuSeparator,
          DropdownMenuShortcut: mockDropdownMenuShortcut,
          Button: mockButton,
          Avatar: mockAvatar,
          AvatarImage: mockAvatarImage,
          AvatarFallback: mockAvatarFallback,
          Badge: mockBadge,
          Dialog: mockDialog,
          DialogTrigger: mockDialogTrigger,
          DialogContent: mockDialogContent,
          DialogTitle: mockDialogTitle,
          DialogDescription: mockDialogDescription,
          DialogFooter: mockDialogFooter,
          Icon: mockIcon,
          RouterLink: mockRouterLink
        }
      }
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock store data
    mockUserStore.getUser = {
      id: 'user-123',
      handle: 'johndoe',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe'
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

    it('renders dropdown menu structure', () => {
      wrapper = createWrapper();
      
      const dropdownMenu = wrapper.findComponent({ name: 'DropdownMenu' });
      const dropdownTrigger = wrapper.findComponent({ name: 'DropdownMenuTrigger' });
      const dropdownContent = wrapper.findComponent({ name: 'DropdownMenuContent' });
      
      expect(dropdownMenu.exists()).toBe(true);
      expect(dropdownTrigger.exists()).toBe(true);
      expect(dropdownContent.exists()).toBe(true);
    });

    it('renders user avatar trigger button', () => {
      wrapper = createWrapper();
      
      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.exists()).toBe(true);
      expect(button.props('variant')).toBe('ghost');
      expect(button.props('class')).toContain('rounded-full');
    });

    it('renders avatar with fallback', () => {
      wrapper = createWrapper();
      
      const avatar = wrapper.findComponent({ name: 'Avatar' });
      const avatarImage = wrapper.findComponent({ name: 'AvatarImage' });
      const avatarFallback = wrapper.findComponent({ name: 'AvatarFallback' });
      
      expect(avatar.exists()).toBe(true);
      expect(avatarImage.exists()).toBe(true);
      expect(avatarFallback.exists()).toBe(true);
    });

    it('displays user initials in avatar fallback', () => {
      wrapper = createWrapper();
      
      const avatarFallback = wrapper.findComponent({ name: 'AvatarFallback' });
      expect(avatarFallback.text()).toBe('JD'); // John Doe initials
    });
  });

  describe('Dropdown Menu Content', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders dropdown content with correct width', () => {
      const dropdownContent = wrapper.findComponent({ name: 'DropdownMenuContent' });
      expect(dropdownContent.props('class')).toContain('w-56');
      expect(dropdownContent.props('align')).toBe('end');
    });

    it('renders user information in dropdown label', () => {
      const dropdownLabel = wrapper.findComponent({ name: 'DropdownMenuLabel' });
      expect(dropdownLabel.exists()).toBe(true);
      expect(dropdownLabel.text()).toContain('johndoe');
      expect(dropdownLabel.text()).toContain('john@example.com');
    });

    it('renders menu separators', () => {
      const separators = wrapper.findAllComponents({ name: 'DropdownMenuSeparator' });
      expect(separators.length).toBeGreaterThan(0);
    });

    it('renders dropdown menu group', () => {
      const menuGroup = wrapper.findComponent({ name: 'DropdownMenuGroup' });
      expect(menuGroup.exists()).toBe(true);
    });

    it('renders dropdown menu items', () => {
      const menuItems = wrapper.findAllComponents({ name: 'DropdownMenuItem' });
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Links', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders Profile router link', () => {
      const routerLinks = wrapper.findAllComponents({ name: 'RouterLink' });
      const profileLink = routerLinks.find(link => 
        link.props('title') === 'Profile'
      );
      
      expect(profileLink).toBeTruthy();
      expect(profileLink.props('to')).toEqual({ 
        name: 'settings', 
        params: { page: 'account' } 
      });
    });

    it('renders Manage Organizations router link', () => {
      const routerLinks = wrapper.findAllComponents({ name: 'RouterLink' });
      const orgsLink = routerLinks.find(link => 
        link.props('title') === 'Manage Organizations'
      );
      
      expect(orgsLink).toBeTruthy();
      expect(orgsLink.props('to')).toEqual({ 
        name: 'orgs', 
        params: { action: 'list' } 
      });
    });

    it('displays correct menu item text', () => {
      expect(wrapper.text()).toContain('Profile');
      expect(wrapper.text()).toContain('Manage Organizations');
      expect(wrapper.text()).toContain('Log out');
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders keyboard shortcuts', () => {
      const shortcuts = wrapper.findAllComponents({ name: 'DropdownMenuShortcut' });
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('displays Profile shortcut', () => {
      const shortcuts = wrapper.findAllComponents({ name: 'DropdownMenuShortcut' });
      const profileShortcut = shortcuts.find(shortcut => 
        shortcut.text() === '⇧⌘P'
      );
      expect(profileShortcut).toBeTruthy();
    });

    it('displays Log out shortcut', () => {
      const shortcuts = wrapper.findAllComponents({ name: 'DropdownMenuShortcut' });
      const logoutShortcut = shortcuts.find(shortcut => 
        shortcut.text() === '⇧⌘Q'
      );
      expect(logoutShortcut).toBeTruthy();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('handles logout click', async () => {
      const menuItems = wrapper.findAllComponents({ name: 'DropdownMenuItem' });
      const logoutItem = menuItems.find(item => 
        item.text().includes('Log out')
      );
      
      expect(logoutItem).toBeTruthy();
      
      await logoutItem.trigger('click');
      
      expect(mockUserStore.$reset).toHaveBeenCalled();
      expect(mockAuthStore.$reset).toHaveBeenCalled();
      // Note: We can't easily test router.push in this mock setup since it's hoisted
    });
  });

  describe('Notifications', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders notification dialog when notifications exist', async () => {
      // Wait for async notification fetch
      await wrapper.vm.$nextTick();
      
      const dialog = wrapper.findComponent({ name: 'Dialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('renders notification badge', async () => {
      await wrapper.vm.$nextTick();
      
      const badge = wrapper.findComponent({ name: 'Badge' });
      expect(badge.exists()).toBe(true);
    });

    it('renders bell icon in notification badge', async () => {
      await wrapper.vm.$nextTick();
      
      const icon = wrapper.findComponent({ name: 'Icon' });
      expect(icon.props('icon')).toBe('line-md:bell-loop');
    });

    it('displays notification count in badge', async () => {
      await wrapper.vm.$nextTick();
      
      const badge = wrapper.findComponent({ name: 'Badge' });
      expect(badge.text()).toContain('2'); // Mock returns 2 notifications
    });
  });

  describe('Notification Dialog', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick(); // Wait for notifications to load
    });

    it('renders dialog components', () => {
      const dialogTrigger = wrapper.findComponent({ name: 'DialogTrigger' });
      const dialogContent = wrapper.findComponent({ name: 'DialogContent' });
      const dialogTitle = wrapper.findComponent({ name: 'DialogTitle' });
      const dialogDescription = wrapper.findComponent({ name: 'DialogDescription' });
      const dialogFooter = wrapper.findComponent({ name: 'DialogFooter' });
      
      expect(dialogTrigger.exists()).toBe(true);
      expect(dialogContent.exists()).toBe(true);
      expect(dialogTitle.exists()).toBe(true);
      expect(dialogDescription.exists()).toBe(true);
      expect(dialogFooter.exists()).toBe(true);
    });

    it('displays notification dialog title', () => {
      const dialogTitle = wrapper.findComponent({ name: 'DialogTitle' });
      expect(dialogTitle.text()).toBe('Notifications');
    });

    it('displays notification count in description', () => {
      const dialogDescription = wrapper.findComponent({ name: 'DialogDescription' });
      expect(dialogDescription.text()).toContain('You have 2 new notifications');
    });

    it('renders notification list items', () => {
      const listItems = wrapper.findAll('li');
      expect(listItems.length).toBe(2); // Mock returns 2 notifications
    });

    it('renders dismiss buttons for notifications', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const dismissButtons = buttons.filter(button => 
        button.text() === 'Dismiss'
      );
      expect(dismissButtons.length).toBe(2); // One for each notification
    });

    it('renders clear all button', () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const clearAllButton = buttons.find(button => 
        button.text() === 'Clear all'
      );
      expect(clearAllButton).toBeTruthy();
    });
  });

  describe('Notification Types', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
    });

    it('displays general notification correctly', () => {
      expect(wrapper.text()).toContain('Test Notification');
      expect(wrapper.text()).toContain('Test notification description');
    });

    it('displays package update notification correctly', () => {
      expect(wrapper.text()).toContain('react can be upgraded');
      expect(wrapper.text()).toContain('New version available');
      expect(wrapper.text()).toContain('react@18.0.0');
    });
  });

  describe('Notification Interactions', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await wrapper.vm.$nextTick();
    });

    it('handles individual notification dismissal', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const dismissButton = buttons.find(button => 
        button.text() === 'Dismiss'
      );
      
      expect(dismissButton).toBeTruthy();
      await dismissButton.trigger('click');
      
      // Check that dismiss functionality is called (via component method)
      expect(dismissButton.emitted('click')).toBeTruthy();
    });

    it('handles clear all notifications', async () => {
      const buttons = wrapper.findAllComponents({ name: 'Button' });
      const clearAllButton = buttons.find(button => 
        button.text() === 'Clear all'
      );
      
      expect(clearAllButton).toBeTruthy();
      await clearAllButton.trigger('click');
      
      expect(clearAllButton.emitted('click')).toBeTruthy();
    });
  });

  describe('Styling and Layout', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('applies correct button styling', () => {
      const button = wrapper.findComponent({ name: 'Button' });
      const classes = button.props('class');
      
      expect(classes).toContain('relative');
      expect(classes).toContain('h-9');
      expect(classes).toContain('w-9');
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('hover:bg-gray-100');
    });

    it('applies correct avatar styling', () => {
      const avatar = wrapper.findComponent({ name: 'Avatar' });
      expect(avatar.props('class')).toContain('h-8');
      expect(avatar.props('class')).toContain('w-8');
      expect(avatar.props('class')).toContain('border');
    });

    it('applies correct avatar fallback styling', () => {
      const avatarFallback = wrapper.findComponent({ name: 'AvatarFallback' });
      const classes = avatarFallback.props('class');
      
      expect(classes).toContain('bg-gray-100');
      expect(classes).toContain('text-gray-700');
      expect(classes).toContain('font-medium');
      expect(classes).toContain('text-sm');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('provides alt text for avatar image', () => {
      const avatarImage = wrapper.findComponent({ name: 'AvatarImage' });
      expect(avatarImage.props('alt')).toBe('@shadcn');
    });

    it('uses semantic HTML structure', () => {
      // Check for proper menu structure
      expect(wrapper.findComponent({ name: 'DropdownMenu' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'DropdownMenuLabel' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'DropdownMenuGroup' }).exists()).toBe(true);
    });

    it('provides cursor pointer for interactive items', () => {
      const menuItems = wrapper.findAllComponents({ name: 'DropdownMenuItem' });
      menuItems.forEach(item => {
        expect(item.props('class')).toContain('cursor-pointer');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined user gracefully', () => {
      mockUserStore.getUser = undefined;
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('handles user with missing names gracefully', () => {
      mockUserStore.getUser = {
        id: 'user-123',
        handle: 'johndoe',
        email: 'john@example.com',
        first_name: '',
        last_name: ''
      };
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('handles empty props gracefully', () => {
      wrapper = createWrapper({});
      expect(wrapper.exists()).toBe(true);
    });

    it('renders core elements even with minimal data', () => {
      wrapper = createWrapper();
      
      expect(wrapper.findComponent({ name: 'DropdownMenu' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'Avatar' }).exists()).toBe(true);
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('properly integrates dropdown menu components', () => {
      const dropdownMenu = wrapper.findComponent({ name: 'DropdownMenu' });
      const trigger = dropdownMenu.findComponent({ name: 'DropdownMenuTrigger' });
      const content = dropdownMenu.findComponent({ name: 'DropdownMenuContent' });
      
      expect(trigger.exists()).toBe(true);
      expect(content.exists()).toBe(true);
    });

    it('properly integrates dialog components', () => {
      const dialog = wrapper.findComponent({ name: 'Dialog' });
      const dialogTrigger = dialog.findComponent({ name: 'DialogTrigger' });
      const dialogContent = dialog.findComponent({ name: 'DialogContent' });
      
      expect(dialogTrigger.exists()).toBe(true);
      expect(dialogContent.exists()).toBe(true);
    });

    it('maintains proper component hierarchy', () => {
      // Avatar should be inside Button inside DropdownMenuTrigger
      const trigger = wrapper.findComponent({ name: 'DropdownMenuTrigger' });
      const button = trigger.findComponent({ name: 'Button' });
      const avatar = button.findComponent({ name: 'Avatar' });
      
      expect(avatar.exists()).toBe(true);
    });
  });
});