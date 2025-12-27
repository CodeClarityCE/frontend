import PasswordResetForm from '@/codeclarity_components/authentication/email/PasswordResetForm.vue';
import router from '@/router';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';

const { mockAuthRepository } = vi.hoisted(() => ({
  mockAuthRepository: {
    resetPassword: vi.fn()
  }
}));

vi.mock('@/codeclarity_components/authentication/auth.repository', () => ({
  AuthRepository: class {
    resetPassword = mockAuthRepository.resetPassword
  }
}));

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

vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

vi.mock('@iconify/vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    Icon: defineComponent({
      name: 'Icon',
      props: ['icon'],
      template: '<span :data-icon="icon"></span>'
    })
  };
});

vi.mock('@/base_components/forms/FormTextField.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'FormTextField',
      props: ['placeholder', 'type', 'name', 'modelValue'],
      emits: ['update:modelValue'],
      template: `
        <div data-testid="form-text-field">
          <input
            :type="type"
            :placeholder="placeholder"
            :name="name"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            :data-testid="name + '-input'"
          />
          <slot name="name"></slot>
        </div>
      `
    })
  };
});

vi.mock('@/base_components/ui/loaders/LoadingSubmitButton.vue', async () => {
  const { vi: viImport } = await import('vitest');
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'LoadingSubmitButton',
      expose: ['setLoading', 'setDisabled'],
      setup(_props: any, { expose }: any) {
        const setLoading = viImport.fn();
        const setDisabled = viImport.fn();
        expose({ setLoading, setDisabled });
        return { setLoading, setDisabled };
      },
      template: '<button type="submit" data-testid="submit-button"><slot></slot></button>'
    })
  };
});

vi.mock('vee-validate', async () => {
  const { defineComponent } = await import('vue');
  return {
    Form: defineComponent({
      name: 'Form',
      props: ['validationSchema', 'name'],
      emits: ['submit'],
      template: `
        <form @submit.prevent="$emit('submit')" data-testid="password-reset-form">
          <slot></slot>
        </form>
      `
    })
  };
});

vi.mock('@/shadcn/ui/alert/Alert.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'Alert',
      props: ['variant'],
      template: '<div data-testid="alert" :class="variant"><slot></slot></div>'
    })
  };
});

vi.mock('@/shadcn/ui/alert/AlertDescription.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'AlertDescription',
      props: ['class'],
      template: '<div data-testid="alert-description"><slot></slot></div>'
    })
  };
});

// Mock vue-router RouterLink
vi.mock('vue-router', async () => {
  const { defineComponent } = await import('vue');
  return {
    RouterLink: defineComponent({
      name: 'RouterLink',
      props: ['to', 'class', 'style'],
      template: '<a :href="to.name" :class="$props.class" :style="$props.style" data-testid="router-link"><slot></slot></a>'
    }),
    default: {
      push: vi.fn()
    }
  };
});

describe('PasswordResetForm', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthRepository.resetPassword.mockResolvedValue({});

    originalLocation = window.location;

    delete (window as any).location;
    (window as any).location = {
      href: 'https://example.com?token=test-token&userid=test-userid',
      search: '?token=test-token&userid=test-userid'
    };
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  describe('Component Structure', () => {
    it('should render the main container', () => {
      const wrapper = mount(PasswordResetForm);
      
      const container = wrapper.find('.password-reset-wrapper');
      expect(container.exists()).toBe(true);
    });

    it('should render form elements when not in success state', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const title = wrapper.find('.title');
      const form = wrapper.find('[data-testid="password-reset-form"]');
      const passwordInput = wrapper.find('[data-testid="new_password-input"]');
      const confirmInput = wrapper.find('[data-testid="new_password_comfirmation-input"]');
      
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('Password Reset');
      expect(form.exists()).toBe(true);
      expect(passwordInput.exists()).toBe(true);
      expect(confirmInput.exists()).toBe(true);
    });

    it('should render submit button', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const submitButton = wrapper.find('[data-testid="submit-button"]');
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toBe('Update password');
    });
  });

  describe('URL Parameter Handling', () => {
    it('should extract token and userid from URL parameters', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      expect(form.exists()).toBe(true);
      expect(router.push).not.toHaveBeenCalled();
    });

    it('should redirect to login when token is missing', async () => {
      (window as any).location = {
        href: 'https://example.com?userid=test-userid',
        search: '?userid=test-userid'
      };

      mount(PasswordResetForm);
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login when userid is missing', async () => {
      (window as any).location = {
        href: 'https://example.com?token=test-token',
        search: '?token=test-token'
      };

      mount(PasswordResetForm);
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login when both parameters are missing', async () => {
      (window as any).location = {
        href: 'https://example.com',
        search: ''
      };

      mount(PasswordResetForm);
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('Form Submission', () => {
    it('should call resetPassword with correct parameters', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const passwordInput = wrapper.find('[data-testid="new_password-input"]');
      const confirmInput = wrapper.find('[data-testid="new_password_comfirmation-input"]');
      
      await passwordInput.setValue('newpassword123');
      await confirmInput.setValue('newpassword123');
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      
      expect(mockAuthRepository.resetPassword).toHaveBeenCalledWith({
        data: {
          new_password: 'newpassword123',
          new_password_confirmation: 'newpassword123',
          token: 'test-token',
          user_id_hash: 'test-userid'
        },
        handleBusinessErrors: true
      });
    });

    it('should show success state after successful submission', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const passwordInput = wrapper.find('[data-testid="new_password-input"]');
      const confirmInput = wrapper.find('[data-testid="new_password_comfirmation-input"]');
      
      await passwordInput.setValue('newpassword123');
      await confirmInput.setValue('newpassword123');
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const successTitle = wrapper.find('.title');
      expect(successTitle.exists()).toBe(true);
      expect(successTitle.text()).toBe('Success');
    });

    it('should handle button loading state during submission', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();

      const loadingButton = wrapper.findComponent('[data-testid="submit-button"]');
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');

      expect((loadingButton as any).vm.setLoading).toHaveBeenCalledWith(true);
      expect((loadingButton as any).vm.setDisabled).toHaveBeenCalledWith(true);

      await nextTick();

      expect((loadingButton as any).vm.setLoading).toHaveBeenCalledWith(false);
      expect((loadingButton as any).vm.setDisabled).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling', () => {
    it('should display validation error', async () => {
      const validationError = new ValidationError('validation-error', 'Validation failed', { new_password: ['Too short'] } as any);
      mockAuthRepository.resetPassword.mockRejectedValue(validationError);

      const wrapper = mount(PasswordResetForm);
      await nextTick();

      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();

      const alert = wrapper.find('[data-testid="alert"]');
      expect(alert.exists()).toBe(true);
      expect(alert.classes()).toContain('destructive');
    });

    it('should display password mismatch error', async () => {
      const businessError = new BusinessLogicError(APIErrors.PasswordsDoNotMatch, 'Passwords do not match');
      mockAuthRepository.resetPassword.mockRejectedValue(businessError);
      
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const alert = wrapper.find('[data-testid="alert"]');
      expect(alert.exists()).toBe(true);
    });

    it('should show non-recoverable error for expired token', async () => {
      const businessError = new BusinessLogicError(APIErrors.PasswordResetTokenInvalidOrExpired, 'Token is invalid or expired');
      mockAuthRepository.resetPassword.mockRejectedValue(businessError);
      
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const failureTitle = wrapper.find('.title');
      expect(failureTitle.exists()).toBe(true);
      expect(failureTitle.text()).toBe('Failed');
      
      const subtitle = wrapper.find('.subtitle');
      expect(subtitle.text()).toContain('password reset has expired');
    });

    it('should show non-recoverable error for internal error', async () => {
      const businessError = new BusinessLogicError(APIErrors.InternalError, 'Internal server error');
      mockAuthRepository.resetPassword.mockRejectedValue(businessError);
      
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const failureTitle = wrapper.find('.title');
      expect(failureTitle.exists()).toBe(true);
      expect(failureTitle.text()).toBe('Failed');
    });

    it('should reset error state on new submission', async () => {
      mockAuthRepository.resetPassword.mockRejectedValueOnce(new Error('Error'));
      
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      let alert = wrapper.find('[data-testid="alert"]');
      expect(alert.exists()).toBe(true);
      
      mockAuthRepository.resetPassword.mockResolvedValue({});
      await form.trigger('submit');
      await nextTick();
      
      alert = wrapper.find('[data-testid="alert"]');
      expect(alert.exists()).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should show only form when neither success nor non-recoverable error', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      const successSection = wrapper.find('.text-4xl.font-semibold');
      const failureSection = wrapper.find('.text-red-500');
      
      expect(form.exists()).toBe(true);
      expect(successSection.exists()).toBe(false);
      expect(failureSection.exists()).toBe(false);
    });

    it('should hide form in success state', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const formElement = wrapper.find('[data-testid="password-reset-form"]');
      expect(formElement.exists()).toBe(false);
    });
  });

  describe('Navigation Links', () => {
    it('should show back to login link in success state', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();

      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();

      const loginLink = wrapper.find('a[href="login"]');
      expect(loginLink.exists()).toBe(true);
      expect(loginLink.text()).toBe('Back to login');
    });

    it('should show recovery request and login links in non-recoverable error state', async () => {
      const businessError = new BusinessLogicError(APIErrors.PasswordResetTokenInvalidOrExpired, 'Token is invalid or expired');
      mockAuthRepository.resetPassword.mockRejectedValue(businessError);

      const wrapper = mount(PasswordResetForm);
      await nextTick();

      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();

      const links = wrapper.findAll('a');
      expect(links).toHaveLength(2);
      expect(links[0]?.text()).toBe('Request a new password reset');
      expect(links[1]?.text()).toBe('Back to login');
    });
  });

  describe('Form Validation', () => {
    it('should update password values when inputs change', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();

      const passwordInput = wrapper.find('[data-testid="new_password-input"]');
      const confirmInput = wrapper.find('[data-testid="new_password_comfirmation-input"]');

      await passwordInput.setValue('newpassword123');
      await confirmInput.setValue('newpassword123');

      expect((passwordInput.element as HTMLInputElement).value).toBe('newpassword123');
      expect((confirmInput.element as HTMLInputElement).value).toBe('newpassword123');
    });

    it('should have proper input types for password fields', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const passwordInput = wrapper.find('[data-testid="new_password-input"]');
      const confirmInput = wrapper.find('[data-testid="new_password_comfirmation-input"]');
      
      expect(passwordInput.attributes('type')).toBe('password');
      expect(confirmInput.attributes('type')).toBe('password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      const passwordInput = wrapper.find('[data-testid="new_password-input"]');
      const confirmInput = wrapper.find('[data-testid="new_password_comfirmation-input"]');
      const submitButton = wrapper.find('[data-testid="submit-button"]');
      
      expect(form.exists()).toBe(true);
      expect(passwordInput.attributes('type')).toBe('password');
      expect(confirmInput.attributes('type')).toBe('password');
      expect(submitButton.attributes('type')).toBe('submit');
    });

    it('should have descriptive placeholders', async () => {
      const wrapper = mount(PasswordResetForm);
      await nextTick();
      
      const passwordInput = wrapper.find('[data-testid="new_password-input"]');
      const confirmInput = wrapper.find('[data-testid="new_password_comfirmation-input"]');
      
      expect(passwordInput.attributes('placeholder')).toBe('Enter your new password');
      expect(confirmInput.attributes('placeholder')).toBe('Confirm your new password');
    });
  });
});