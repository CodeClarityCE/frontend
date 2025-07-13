import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import UserAuthForm from '@/codeclarity_components/authentication/signin/UserAuthForm.vue';
import { nextTick } from 'vue';

// Mock stores
const mockAuthStore = {
  getAuthenticated: false,
  setToken: vi.fn(),
  setTokenExpiry: vi.fn(),
  setRefreshToken: vi.fn(),
  setRefreshTokenExpiry: vi.fn(),
  setAuthenticated: vi.fn()
};

const mockUserStore = {
  setUser: vi.fn()
};

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => mockAuthStore)
}));

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => mockUserStore)
}));

// Mock repositories
const mockAuthRepository = {
  authenticate: vi.fn(),
  getAuthenticatedUser: vi.fn()
};

vi.mock('@/codeclarity_components/authentication/auth.repository', () => ({
  AuthRepository: vi.fn(() => mockAuthRepository)
}));

// Mock API errors
vi.mock('@/utils/api/ApiErrors', () => ({
  APIErrors: {
    InternalError: 'InternalError',
    WrongCredentials: 'WrongCredentials',
    RegistrationNotVerified: 'RegistrationNotVerified',
    CannotPerformActionOnSocialAccount: 'CannotPerformActionOnSocialAccount',
    EntityNotFound: 'EntityNotFound',
    ValidationFailed: 'ValidationFailed'
  }
}));

// Mock BaseRepository with partial import
vi.mock('@/utils/api/BaseRepository', async (importOriginal) => {
  const actual = await importOriginal() as any;
  
  class ValidationError extends Error {
    error_code: string;
    constructor(code: string) {
      super();
      this.error_code = code;
    }
    toMessage(prefix: string) {
      return `${prefix} Validation error`;
    }
  }

  class BusinessLogicError extends Error {
    error_code: string;
    constructor(code: string) {
      super();
      this.error_code = code;
    }
  }

  return {
    ...actual,
    ValidationError,
    BusinessLogicError
  };
});

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

// Mock vue-router
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    createRouter: vi.fn(),
    createWebHistory: vi.fn()
  };
});

// Mock Icon component
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span :class="icon"></span>',
    props: ['icon']
  }
}));

// Mock shadcn components
vi.mock('@/shadcn/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

vi.mock('@/shadcn/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button type="submit" class="button"><slot /></button>'
  }
}));

vi.mock('@/shadcn/ui/form', () => ({
  FormControl: { name: 'FormControl', template: '<div class="form-control"><slot /></div>' },
  FormField: { 
    name: 'FormField', 
    template: '<div class="form-field"><slot :componentField="{ name, value: \'\' }" /></div>',
    props: ['name']
  },
  FormItem: { name: 'FormItem', template: '<div class="form-item"><slot /></div>' },
  FormLabel: { name: 'FormLabel', template: '<label class="form-label"><slot /></label>' },
  FormMessage: { name: 'FormMessage', template: '<div class="form-message">Error</div>' }
}));

vi.mock('@/shadcn/ui/input', () => ({
  Input: {
    name: 'Input',
    template: '<input class="input" :type="type" :placeholder="placeholder" />',
    props: ['type', 'placeholder']
  }
}));

vi.mock('@/shadcn/ui/alert/Alert.vue', () => ({
  default: {
    name: 'Alert',
    template: '<div class="alert" :class="variant"><slot /></div>',
    props: ['variant']
  }
}));

vi.mock('@/shadcn/ui/alert/AlertDescription.vue', () => ({
  default: {
    name: 'AlertDescription',
    template: '<div class="alert-description"><slot /></div>'
  }
}));

// Mock vee-validate
vi.mock('vee-validate', () => ({
  useForm: () => ({
    handleSubmit: (fn: Function) => (e: Event) => {
      e?.preventDefault?.();
      fn({ email: 'test@example.com', password: 'password123' });
    }
  })
}));

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: (schema: any) => schema
}));

// Mock auto-animate
vi.mock('@formkit/auto-animate/vue', () => ({
  vAutoAnimate: {}
}));

describe('UserAuthForm.vue', () => {
  let wrapper: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockAuthStore.getAuthenticated = false;

    wrapper = mount(UserAuthForm, {
      global: {
        mocks: {
          $router: {
            push: vi.fn()
          }
        }
      }
    });
  });

  describe('Component Structure', () => {
    it('renders the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('displays the form when not loading', () => {
      const form = wrapper.find('form');
      expect(form.exists()).toBe(true);
    });

    it('has email and password fields', () => {
      const emailField = wrapper.find('.form-field .form-label');
      expect(emailField.text()).toBe('Email*:');

      const passwordField = wrapper.findAll('.form-field .form-label')[1];
      expect(passwordField.text()).toBe('Password:');

      const inputs = wrapper.findAll('input');
      expect(inputs).toHaveLength(2);
      expect(inputs[0].attributes('type')).toBe('text');
      expect(inputs[0].attributes('placeholder')).toBe('Enter your email');
      expect(inputs[1].attributes('type')).toBe('password');
      expect(inputs[1].attributes('placeholder')).toBe('Enter your password');
    });

    it('has a submit button', () => {
      const button = wrapper.find('button[type="submit"]');
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe('Sign in');
    });
  });

  describe('Authentication Flow', () => {
    it('redirects to home if user is already authenticated', async () => {
      mockAuthStore.getAuthenticated = true;
      
      const routerPushMock = vi.fn();
      const { default: router } = await import('@/router');
      router.push = routerPushMock;
      
      mount(UserAuthForm, {
        global: {
          mocks: {
            $router: {
              push: routerPushMock
            }
          }
        }
      });

      expect(routerPushMock).toHaveBeenCalledWith('/');
    });

    it('submits form and authenticates successfully', async () => {
      const mockToken = {
        token: 'test-token',
        token_expiry: '2024-12-31',
        refresh_token: 'refresh-token',
        refresh_token_expiry: '2025-01-31'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      mockAuthRepository.authenticate.mockResolvedValue(mockToken);
      mockAuthRepository.getAuthenticatedUser.mockResolvedValue(mockUser);

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      expect(mockAuthRepository.authenticate).toHaveBeenCalledWith({
        data: { email: 'test@example.com', password: 'password123' },
        handleBusinessErrors: true
      });

      expect(mockAuthRepository.getAuthenticatedUser).toHaveBeenCalledWith({
        bearerToken: 'test-token',
        handleBusinessErrors: true
      });

      expect(mockAuthStore.setToken).toHaveBeenCalledWith('test-token');
      expect(mockAuthStore.setTokenExpiry).toHaveBeenCalledWith('2024-12-31');
      expect(mockAuthStore.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockAuthStore.setRefreshTokenExpiry).toHaveBeenCalledWith('2025-01-31');
      expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(true);
      expect(mockUserStore.setUser).toHaveBeenCalledWith(mockUser);
      
      const { default: router } = await import('@/router');
      expect(router.push).toHaveBeenCalledWith('/');
    });

    it('shows loading state during authentication', async () => {
      mockAuthRepository.authenticate.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const form = wrapper.find('form');
      await form.trigger('submit');
      await nextTick();

      expect(wrapper.find('.flex.flex-col.items-center').exists()).toBe(true);
      expect(wrapper.text()).toContain('Connecting');
      expect(wrapper.find('.animate-spin').exists()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles wrong credentials error', async () => {
      const { BusinessLogicError } = await import('@/utils/api/BaseRepository');
      mockAuthRepository.authenticate.mockRejectedValue(
        new BusinessLogicError('WrongCredentials')
      );

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      const alert = wrapper.find('.alert');
      expect(alert.exists()).toBe(true);
      expect(alert.classes()).toContain('destructive');
      expect(wrapper.text()).toContain('Wrong credentials.');
    });

    it('handles registration not verified error', async () => {
      const { BusinessLogicError } = await import('@/utils/api/BaseRepository');
      mockAuthRepository.authenticate.mockRejectedValue(
        new BusinessLogicError('RegistrationNotVerified')
      );

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      expect(wrapper.text()).toContain('You have not yet verified your registration');
    });

    it('handles social account error', async () => {
      const { BusinessLogicError } = await import('@/utils/api/BaseRepository');
      mockAuthRepository.authenticate.mockRejectedValue(
        new BusinessLogicError('CannotPerformActionOnSocialAccount')
      );

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      expect(wrapper.text()).toContain('To connected using your Social account');
    });

    it('handles validation error', async () => {
      const { ValidationError } = await import('@/utils/api/BaseRepository');
      mockAuthRepository.authenticate.mockRejectedValue(
        new ValidationError('ValidationFailed')
      );

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      expect(wrapper.text()).toContain('Invalid form: Validation error');
    });

    it('handles account not activated and redirects to trial', async () => {
      const { BusinessLogicError } = await import('@/utils/api/BaseRepository');
      mockAuthRepository.authenticate.mockRejectedValue(
        new BusinessLogicError('AccountNotActivated')
      );

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      const { default: router } = await import('@/router');
      expect(router.push).toHaveBeenCalledWith('/trial');
    });

    it('handles generic errors', async () => {
      mockAuthRepository.authenticate.mockRejectedValue(new Error('Network error'));

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      expect(wrapper.text()).toContain('An error occured during the processing of the request');
    });
  });

  describe('Form Behavior', () => {
    it('applies correct classes to the main container', () => {
      const container = wrapper.find('.grid.gap-6');
      expect(container.exists()).toBe(true);
    });

    it('resets error state when submitting', async () => {
      // First submission with error
      const { BusinessLogicError } = await import('@/utils/api/BaseRepository');
      mockAuthRepository.authenticate.mockRejectedValue(
        new BusinessLogicError('WrongCredentials')
      );

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      expect(wrapper.find('.alert').exists()).toBe(true);

      // Second submission that succeeds
      mockAuthRepository.authenticate.mockResolvedValue({
        token: 'test-token',
        token_expiry: '2024-12-31',
        refresh_token: 'refresh-token',
        refresh_token_expiry: '2025-01-31'
      });
      mockAuthRepository.getAuthenticatedUser.mockResolvedValue({
        id: 1,
        email: 'test@example.com'
      });

      await form.trigger('submit');
      await flushPromises();

      expect(wrapper.find('.alert').exists()).toBe(false);
    });
  });
});