import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
// import { createTestWrapper } from '../../utils/test-utils';
import { mockStores } from '../../utils/test-utils';
import UserAuthForm from '@/codeclarity_components/authentication/signin/UserAuthForm.vue';
import { AuthRepository } from '@/codeclarity_components/authentication/auth.repository';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import type { Token } from '@/codeclarity_components/authentication/token.entity';
import type { AuthenticatedUser } from '@/codeclarity_components/authentication/authenticated_user.entity';

// Mock BaseRepository with error classes
vi.mock('@/utils/api/BaseRepository', () => ({
  BaseRepository: class MockBaseRepository {
    constructor() {}
  },
  BusinessLogicError: class MockBusinessLogicError extends Error {
    constructor(public error_code: string) {
      super();
    }
  },
  ValidationError: class MockValidationError extends Error {
    constructor(public error_code: string, public details?: any) {
      super();
    }
  }
}));

// Mock the AuthRepository
vi.mock('@/codeclarity_components/authentication/auth.repository');
const mockAuthRepository = vi.mocked(AuthRepository);

// Mock router
vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

import router from '@/router';
const mockPush = vi.mocked(router.push);

describe.skip('UserAuthForm Integration Tests', () => {
  let authRepositoryInstance: any;
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores
    mockStores.auth.$reset();
    mockStores.user.$reset();
    
    // Setup AuthRepository mock instance
    authRepositoryInstance = {
      login: vi.fn(),
      getAccountInformation: vi.fn()
    };
    mockAuthRepository.mockImplementation(() => authRepositoryInstance);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const mountComponent = () => {
    wrapper = mount(UserAuthForm, {
      global: {
        stubs: {
          Icon: true,
          Alert: { template: '<div class="alert"><slot /></div>' },
          AlertDescription: { template: '<div class="alert-description"><slot /></div>' }
        }
      }
    });
    return wrapper;
  };

  describe('Form Validation', () => {
    it('should show validation errors for invalid email', async () => {
      mountComponent();
      
      const emailInput = wrapper.find('input[name="email"]');
      const form = wrapper.find('form');
      
      await emailInput.setValue('invalid-email');
      await form.trigger('submit');
      await nextTick();
      
      expect(wrapper.text()).toContain('Invalid email');
    });

    it('should show validation errors for short password', async () => {
      mountComponent();
      
      const passwordInput = wrapper.find('input[name="password"]');
      const form = wrapper.find('form');
      
      await passwordInput.setValue('short');
      await form.trigger('submit');
      await nextTick();
      
      expect(wrapper.text()).toContain('String must contain at least 10 character(s)');
    });

    it('should show validation errors for long password', async () => {
      mountComponent();
      
      const passwordInput = wrapper.find('input[name="password"]');
      const form = wrapper.find('form');
      
      await passwordInput.setValue('a'.repeat(76));
      await form.trigger('submit');
      await nextTick();
      
      expect(wrapper.text()).toContain('String must contain at most 75 character(s)');
    });
  });

  describe('Authentication Flow', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'validpassword123'
    };

    it('should successfully authenticate user with valid credentials', async () => {
      // Setup successful authentication response
      const mockToken: Token = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600
      };
      
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        active: true
      };

      authRepositoryInstance.login.mockResolvedValue(mockToken);
      authRepositoryInstance.getAccountInformation.mockResolvedValue(mockUser);

      mountComponent();
      
      // Fill form with valid data
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const form = wrapper.find('form');
      
      await emailInput.setValue(validCredentials.email);
      await passwordInput.setValue(validCredentials.password);
      await form.trigger('submit');
      await nextTick();

      // Verify API calls
      expect(authRepositoryInstance.login).toHaveBeenCalledWith({
        email: validCredentials.email,
        password: validCredentials.password
      });
      expect(authRepositoryInstance.getAccountInformation).toHaveBeenCalled();

      // Verify store updates
      expect(mockStores.auth.setTokens).toHaveBeenCalledWith(mockToken);
      expect(mockStores.user.setUser).toHaveBeenCalledWith(mockUser);

      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle authentication failure with invalid credentials', async () => {
      // Setup authentication failure
      authRepositoryInstance.login.mockRejectedValue(
        new BusinessLogicError('Invalid credentials', 'INVALID_CREDENTIALS')
      );

      mountComponent();
      
      // Fill form with invalid data
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const form = wrapper.find('form');
      
      await emailInput.setValue(validCredentials.email);
      await passwordInput.setValue('wrongpassword');
      await form.trigger('submit');
      await nextTick();

      // Verify error state
      expect(wrapper.find('.alert').exists()).toBe(true);
      expect(wrapper.text()).toContain('Invalid credentials');
      
      // Verify stores not updated
      expect(mockStores.auth.setTokens).not.toHaveBeenCalled();
      expect(mockStores.user.setUser).not.toHaveBeenCalled();
      
      // Verify no navigation
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle validation errors from server', async () => {
      // Setup validation error
      const validationError = new ValidationError({
        email: ['Email is already taken'],
        password: ['Password is too weak']
      });
      authRepositoryInstance.login.mockRejectedValue(validationError);

      mountComponent();
      
      // Fill form and submit
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const form = wrapper.find('form');
      
      await emailInput.setValue(validCredentials.email);
      await passwordInput.setValue(validCredentials.password);
      await form.trigger('submit');
      await nextTick();

      // Verify validation errors are displayed
      expect(wrapper.text()).toContain('Email is already taken');
      expect(wrapper.text()).toContain('Password is too weak');
    });

    it('should handle network/server errors gracefully', async () => {
      // Setup network error
      authRepositoryInstance.login.mockRejectedValue(
        new Error('Network connection failed')
      );

      mountComponent();
      
      // Fill form and submit
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const form = wrapper.find('form');
      
      await emailInput.setValue(validCredentials.email);
      await passwordInput.setValue(validCredentials.password);
      await form.trigger('submit');
      await nextTick();

      // Verify error alert is shown
      expect(wrapper.find('.alert').exists()).toBe(true);
      expect(wrapper.text()).toContain('An error occurred');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication', async () => {
      // Setup delayed authentication response
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      authRepositoryInstance.login.mockReturnValue(loginPromise);

      mountComponent();
      
      // Fill form and submit
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      const submitButton = wrapper.find('button[type="submit"]');
      const form = wrapper.find('form');
      
      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('validpassword123');
      await form.trigger('submit');
      await nextTick();

      // Verify loading state
      expect(submitButton.attributes('disabled')).toBeDefined();
      expect(wrapper.text()).toContain('Signing in');

      // Resolve the login
      resolveLogin!({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 3600
      });
      await nextTick();

      // Verify loading state is cleared
      expect(submitButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and accessibility attributes', () => {
      mountComponent();
      
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      
      // Check that inputs have labels
      expect(wrapper.find('label[for="email"]').exists()).toBe(true);
      expect(wrapper.find('label[for="password"]').exists()).toBe(true);
      
      // Check input types
      expect(emailInput.attributes('type')).toBe('email');
      expect(passwordInput.attributes('type')).toBe('password');
      
      // Check required attributes
      expect(emailInput.attributes('required')).toBeDefined();
      expect(passwordInput.attributes('required')).toBeDefined();
    });

    it('should support keyboard navigation', async () => {
      mountComponent();
      
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      // const submitButton = wrapper.find('button[type="submit"]');
      
      // Test tab order
      await emailInput.trigger('focus');
      expect(document.activeElement).toBe(emailInput.element);
      
      await emailInput.trigger('keydown', { key: 'Tab' });
      await nextTick();
      // Next element should be password input
      
      // Test enter key submission
      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('validpassword123');
      await passwordInput.trigger('keydown', { key: 'Enter' });
      await nextTick();
      
      expect(authRepositoryInstance.login).toHaveBeenCalled();
    });
  });

  describe('Social Authentication Integration', () => {
    it('should handle Google OAuth flow', async () => {
      mountComponent();
      
      const googleButton = wrapper.find('button[data-testid="google-auth"]');
      expect(googleButton.exists()).toBe(true);
      
      await googleButton.trigger('click');
      
      // Verify Google OAuth state is set
      expect(mockStores.auth.setSocialAuthState).toHaveBeenCalledWith({
        provider: 'google',
        state: expect.any(String),
        redirectUri: expect.any(String)
      });
    });

    it('should handle GitHub OAuth flow', async () => {
      mountComponent();
      
      const githubButton = wrapper.find('button[data-testid="github-auth"]');
      expect(githubButton.exists()).toBe(true);
      
      await githubButton.trigger('click');
      
      // Verify GitHub OAuth state is set
      expect(mockStores.auth.setSocialAuthState).toHaveBeenCalledWith({
        provider: 'github',
        state: expect.any(String),
        redirectUri: expect.any(String)
      });
    });
  });

  describe('Form Reset and State Management', () => {
    it('should clear error state when user starts typing', async () => {
      // Setup initial error state
      authRepositoryInstance.login.mockRejectedValue(
        new BusinessLogicError('Invalid credentials', 'INVALID_CREDENTIALS')
      );

      mountComponent();
      
      // Trigger error
      const form = wrapper.find('form');
      await form.trigger('submit');
      await nextTick();
      
      expect(wrapper.find('.alert').exists()).toBe(true);
      
      // Start typing in email field
      const emailInput = wrapper.find('input[name="email"]');
      await emailInput.setValue('n');
      await nextTick();
      
      // Error should be cleared
      expect(wrapper.find('.alert').exists()).toBe(false);
    });

    it('should maintain form state during re-renders', async () => {
      mountComponent();
      
      const emailInput = wrapper.find('input[name="email"]');
      const passwordInput = wrapper.find('input[name="password"]');
      
      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('password123');
      
      // Force re-render
      await wrapper.vm.$forceUpdate();
      await nextTick();
      
      // Values should be preserved
      expect(emailInput.element.value).toBe('test@example.com');
      expect(passwordInput.element.value).toBe('password123');
    });
  });
});