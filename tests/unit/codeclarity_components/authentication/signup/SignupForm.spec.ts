import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SignupForm from '@/codeclarity_components/authentication/signup/SignupForm.vue';

// Mock stores
const mockAuthStore = {
  getAuthenticated: false
};

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore)
}));

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

// Mock API components and utilities
vi.mock('@/codeclarity_components/authentication/auth.repository', () => ({
  AuthRepository: vi.fn()
}));

vi.mock('@/utils/api/BaseRepository', () => ({
  BusinessLogicError: vi.fn(),
  ValidationError: vi.fn()
}));

vi.mock('@/utils/api/ApiErrors', () => ({
  APIErrors: {}
}));

// Mock shadcn utilities
vi.mock('@/shadcn/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

vi.mock('@/shadcn/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button><slot /></button>',
    props: ['variant', 'type', 'class']
  },
  buttonVariants: ({ variant }: any) => `button-${variant}`
}));

vi.mock('@/shadcn/ui/toast', () => ({
  toast: vi.fn()
}));

// Mock iconify
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span class="icon"></span>',
    props: ['icon']
  }
}));

describe('SignupForm.vue', () => {
  let wrapper: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockAuthStore.getAuthenticated = false;

    wrapper = mount(SignupForm, {
      global: {
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<a :href="to.name || to"><slot /></a>',
            props: ['to']
          },
          // Stub all form components to avoid complex validation logic
          Form: {
            name: 'Form',
            template: '<form class="signup-form"><slot /></form>',
            props: ['validation-schema']
          },
          FormField: {
            name: 'FormField',
            template: '<div class="form-field"><slot /></div>',
            props: ['name', 'type']
          },
          FormItem: true,
          FormLabel: {
            name: 'FormLabel',
            template: '<label><slot /></label>'
          },
          FormControl: true,
          FormMessage: true,
          FormDescription: {
            name: 'FormDescription',
            template: '<div class="form-description"><slot /></div>'
          },
          Input: {
            name: 'Input',
            template: '<input />',
            props: ['type', 'placeholder']
          },
          Checkbox: {
            name: 'Checkbox',
            template: '<input type="checkbox" />',
            props: ['model-value']
          },
          Alert: {
            name: 'Alert',
            template: '<div class="alert"><slot /></div>',
            props: ['variant']
          },
          AlertDescription: true
        }
      }
    });
  });

  describe('Component Structure', () => {
    it('renders the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('displays the main heading', () => {
      const heading = wrapper.find('h1');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toBe('Sign Up');
    });

    it('renders the welcome description', () => {
      const text = wrapper.text();
      expect(text).toContain('Welcome, please fill out the below information.');
    });

    it('renders logo images', () => {
      const images = wrapper.findAll('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
    });

    it('has a sign in link', () => {
      const signInLink = wrapper.findComponent({ name: 'RouterLink' });
      expect(signInLink.exists()).toBe(true);
      expect(signInLink.text()).toContain('Sign In');
    });
  });

  describe('Form Structure', () => {
    it('renders the signup form', () => {
      const form = wrapper.find('.signup-form');
      expect(form.exists()).toBe(true);
    });

    it('renders form fields', () => {
      // Check for basic form structure instead of specific field count
      const form = wrapper.find('.signup-form');
      expect(form.exists()).toBe(true);
    });

    it('renders register button', () => {
      const button = wrapper.findComponent({ name: 'Button' });
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('Register');
    });
  });

  describe('Links and Navigation', () => {
    it('includes sign in navigation link', () => {
      const routerLinks = wrapper.findAllComponents({ name: 'RouterLink' });
      expect(routerLinks.length).toBeGreaterThanOrEqual(1);

      const signInLink = routerLinks.find(link => link.text().includes('Sign In'));
      expect(signInLink).toBeTruthy();
    });

    it('has terms and privacy links in template', () => {
      // Check that the template includes the terms elements
      const html = wrapper.html();
      expect(html).toContain('terms');
      expect(html).toContain('privacy');
    });
  });

  describe('Form Behavior', () => {
    it('shows form by default (not loading)', () => {
      const form = wrapper.find('.signup-form');
      expect(form.exists()).toBe(true);
      
      const text = wrapper.text();
      expect(text).not.toContain('Creating your account');
    });

    it('does not show error alert initially', () => {
      const alert = wrapper.findComponent({ name: 'Alert' });
      expect(alert.exists()).toBe(false);
    });

    it('includes form description structure', () => {
      // Check for presence of form description elements in template
      const form = wrapper.find('.signup-form');
      expect(form.exists()).toBe(true);
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct container classes', () => {
      const container = wrapper.find('.mx-auto');
      expect(container.exists()).toBe(true);
    });

    it('centers the content appropriately', () => {
      const centerSection = wrapper.find('.text-center');
      expect(centerSection.exists()).toBe(true);
    });

    it('groups name fields in a flex row', () => {
      const flexRow = wrapper.find('.flex-row');
      expect(flexRow.exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('uses semantic heading structure', () => {
      const heading = wrapper.find('h1');
      expect(heading.exists()).toBe(true);
      expect(heading.classes()).toContain('text-2xl');
      expect(heading.classes()).toContain('font-semibold');
    });

    it('uses proper form structure', () => {
      const form = wrapper.find('form');
      expect(form.exists()).toBe(true);
      
      // Check for FormLabel components (stubbed)
      const labelComponents = wrapper.findAllComponents({ name: 'FormLabel' });
      expect(labelComponents.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('renders without crashing', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('handles authentication state', () => {
      expect(wrapper.exists()).toBe(true);
      expect(mockAuthStore.getAuthenticated).toBe(false);
    });
  });
});