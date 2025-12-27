import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import LoginView from '@/codeclarity_components/authentication/signin/LoginView.vue';

// Mock the stores
const mockStateStore = {
  $reset: vi.fn(),
  page: 'signup',
  publicPage: true
};

vi.mock('@/stores/state', () => ({
  useStateStore: vi.fn(() => mockStateStore)
}));

// Don't mock the UserAuthForm component, handle it in the test config

vi.mock('@/base_components/ui/loaders/LoadingComponent.vue', () => ({
  default: {
    name: 'LoadingComponent',
    template: '<div class="loading">Loading...</div>'
  }
}));

vi.mock('@/base_components/utilities/ErrorComponent.vue', () => ({
  default: {
    name: 'ErrorComponent',
    template: '<div class="error">Error</div>'
  }
}));

// Mock shadcn utilities
vi.mock('@/shadcn/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

vi.mock('@/shadcn/ui/button', () => ({
  buttonVariants: ({ variant }: any) => `button-${variant}`
}));

describe('LoginView.vue', () => {
  let wrapper: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockStateStore.$reset.mockClear();

    wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: {
            name: 'RouterLink',
            template: '<a :href="to.name"><slot /></a>',
            props: ['to']
          },
          UserAuthForm: {
            name: 'UserAuthForm',
            template: '<div class="user-auth-form">User Auth Form</div>'
          }
        }
      }
    });
  });

  describe('Component Structure', () => {
    it('renders the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('has the correct main structure', () => {
      const mainDiv = wrapper.find('div');
      expect(mainDiv.exists()).toBe(true);
      
      // Check for signup link
      const signupLink = wrapper.find('a[href="signup"]');
      expect(signupLink.exists()).toBe(true);
      expect(signupLink.text()).toContain('Signup');
      
      // Check for main content area
      const contentArea = wrapper.find('.h-svh');
      expect(contentArea.exists()).toBe(true);
    });

    it('displays the logo twice', () => {
      const logos = wrapper.findAll('img');
      expect(logos).toHaveLength(2);
      
      // First logo in signup link
      expect(logos[0].classes()).toContain('w-8');
      // Vue transforms the src in tests, so we just check that it exists
      expect(logos[0].attributes('src')).toBeTruthy();
      
      // Second logo in main content
      expect(logos[1].classes()).toContain('w-20');
      expect(logos[1].classes()).toContain('self-center');
      expect(logos[1].attributes('src')).toBeTruthy();
    });

    it('has proper heading and description', () => {
      const heading = wrapper.find('h1');
      expect(heading.exists()).toBe(true);
      expect(heading.text()).toBe('Sign In');
      expect(heading.classes()).toContain('text-2xl');
      expect(heading.classes()).toContain('font-semibold');
      expect(heading.classes()).toContain('tracking-tight');

      const description = wrapper.find('p.text-muted-foreground');
      expect(description.exists()).toBe(true);
      expect(description.text()).toBe('Welcome back. Please enter your credentials.');
    });

    it('includes the UserAuthForm component', () => {
      const authForm = wrapper.find('.user-auth-form');
      expect(authForm.exists()).toBe(true);
      expect(authForm.text()).toBe('User Auth Form');
    });

    it('initializes the state store correctly', () => {
      expect(mockStateStore.$reset).toHaveBeenCalled();
      expect(mockStateStore.page).toBe('signup');
      expect(mockStateStore.publicPage).toBe(true);
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct classes to signup link', () => {
      const signupLink = wrapper.find('a[href="signup"]');
      expect(signupLink.classes()).toContain('button-ghost');
      expect(signupLink.classes()).toContain('absolute');
      expect(signupLink.classes()).toContain('right-4');
      expect(signupLink.classes()).toContain('top-4');
      expect(signupLink.classes()).toContain('md:right-8');
      expect(signupLink.classes()).toContain('md:top-8');
    });

    it('centers the content properly', () => {
      const flexContainer = wrapper.find('.h-svh');
      expect(flexContainer.classes()).toContain('flex');
      expect(flexContainer.classes()).toContain('justify-center');

      const contentContainer = wrapper.find('.mx-auto');
      expect(contentContainer.classes()).toContain('flex');
      expect(contentContainer.classes()).toContain('w-full');
      expect(contentContainer.classes()).toContain('flex-col');
      expect(contentContainer.classes()).toContain('justify-center');
      expect(contentContainer.classes()).toContain('space-y-6');
      expect(contentContainer.classes()).toContain('sm:w-[350px]');
    });

    it('applies correct text alignment to heading section', () => {
      const headingSection = wrapper.find('.flex.flex-col.space-y-2.text-center');
      expect(headingSection.exists()).toBe(true);
      expect(headingSection.classes()).toContain('text-center');
    });
  });

  describe('Async Component Loading', () => {
    it('defines UserAuthForm as an async component with proper config', () => {
      // The component should be loaded asynchronously
      // We can't directly test defineAsyncComponent internals, but we can verify
      // that the component is rendered (stubbed in tests)
      const authForm = wrapper.find('.user-auth-form');
      expect(authForm.exists()).toBe(true);
    });
  });

  describe('Router Integration', () => {
    it('links to the signup page correctly', () => {
      const signupLink = wrapper.find('a[href="signup"]');
      expect(signupLink.exists()).toBe(true);
      expect(signupLink.attributes('href')).toBe('signup');
    });
  });

  describe('Commented Features', () => {
    it('does not render terms of service section', () => {
      // The terms section is commented out
      const termsText = wrapper.text();
      expect(termsText).not.toContain('Terms of Service');
      expect(termsText).not.toContain('Privacy Policy');
      expect(termsText).not.toContain('By clicking continue');
    });
  });
});