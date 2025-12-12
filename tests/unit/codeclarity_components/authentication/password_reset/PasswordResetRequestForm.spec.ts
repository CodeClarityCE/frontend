// Mock reflect-metadata for TypeScript decorators
global.Reflect = global.Reflect || {};
global.Reflect.getMetadata = global.Reflect.getMetadata || vi.fn();

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import PasswordResetRequestForm from '@/codeclarity_components/authentication/password_reset/PasswordResetRequestForm.vue';
import { BusinessLogicError, ValidationError } from '@/utils/api/BaseRepository';

const mockAuthRepository = {
  requestPasswordReset: vi.fn()
};

vi.mock('@/codeclarity_components/authentication/auth.repository', () => ({
  AuthRepository: vi.fn(() => mockAuthRepository)
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

vi.mock('@iconify/vue', () => ({
  Icon: defineComponent({
    name: 'Icon',
    props: ['icon'],
    template: '<span :data-icon="icon"></span>'
  })
}));

vi.mock('@/base_components/forms/FormTextField.vue', () => ({
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
          data-testid="email-input"
        />
        <slot name="name"></slot>
      </div>
    `
  })
}));

vi.mock('@/base_components/ui/loaders/LoadingSubmitButton.vue', () => ({
  default: defineComponent({
    name: 'LoadingSubmitButton',
    expose: ['setLoading', 'setDisabled'],
    setup(props, { expose }) {
      const setLoading = vi.fn();
      const setDisabled = vi.fn();
      expose({ setLoading, setDisabled });
      return { setLoading, setDisabled };
    },
    template: '<button type="submit" data-testid="submit-button"><slot></slot></button>'
  })
}));

vi.mock('vee-validate', () => ({
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
}));

vi.mock('@vee-validate/zod', () => ({
  toTypedSchema: vi.fn((schema) => schema)
}));

vi.mock('vue-router', () => ({
  RouterLink: defineComponent({
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to.name" data-testid="router-link"><slot></slot></a>'
  })
}));

describe('PasswordResetRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthRepository.requestPasswordReset.mockResolvedValue({});
  });

  describe('Component Structure', () => {
    it('should render the main container', () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const container = wrapper.find('.flex.flex-col.justify-center.items-center.my-20');
      expect(container.exists()).toBe(true);
    });

    it('should render the form when not in success state', () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      const title = wrapper.find('h2');
      
      expect(form.exists()).toBe(true);
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('Password Reset');
    });

    it('should render email input field', () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const emailField = wrapper.find('[data-testid="form-text-field"]');
      const emailInput = wrapper.find('[data-testid="email-input"]');
      
      expect(emailField.exists()).toBe(true);
      expect(emailInput.exists()).toBe(true);
      expect(emailInput.attributes('type')).toBe('email');
      expect(emailInput.attributes('placeholder')).toBe('Enter your email');
    });

    it('should render submit button', () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const submitButton = wrapper.find('[data-testid="submit-button"]');
      expect(submitButton.exists()).toBe(true);
      expect(submitButton.text()).toBe('Request password reset');
    });
  });

  describe('Form Validation', () => {
    it('should update email value when input changes', async () => {
      const wrapper = mount(PasswordResetRequestForm);

      const emailInput = wrapper.find('[data-testid="email-input"]');
      await emailInput.setValue('test@example.com');

      expect((emailInput.element as HTMLInputElement).value).toBe('test@example.com');
    });

    it('should have proper form attributes', () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      expect(form.exists()).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should call authRepository.requestPasswordReset on form submit', async () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const emailInput = wrapper.find('[data-testid="email-input"]');
      await emailInput.setValue('test@example.com');
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      
      expect(mockAuthRepository.requestPasswordReset).toHaveBeenCalledWith({
        data: { email: 'test@example.com' },
        handleBusinessErrors: true
      });
    });

    it('should show success state after successful submission', async () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const emailInput = wrapper.find('[data-testid="email-input"]');
      await emailInput.setValue('test@example.com');
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const successMessage = wrapper.find('.text-4xl.font-semibold');
      expect(successMessage.exists()).toBe(true);
      expect(successMessage.text()).toBe('Success');
    });

    it('should handle button loading state during submission', async () => {
      const wrapper = mount(PasswordResetRequestForm);
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
    it('should display error message on ValidationError', async () => {
      const validationError = new ValidationError('validation-error', 'Validation failed', [{ property: 'email', errors: ['Invalid email'] }]);
      mockAuthRepository.requestPasswordReset.mockRejectedValue(validationError);
      
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const errorIcon = wrapper.find('[data-icon="material-symbols:error-outline"]');
      expect(errorIcon.exists()).toBe(true);
    });

    it('should display error message on BusinessLogicError', async () => {
      const businessError = new BusinessLogicError('business-error', 'Business logic error occurred');
      mockAuthRepository.requestPasswordReset.mockRejectedValue(businessError);
      
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const errorIcon = wrapper.find('[data-icon="material-symbols:error-outline"]');
      expect(errorIcon.exists()).toBe(true);
    });

    it('should display generic error message for unknown errors', async () => {
      mockAuthRepository.requestPasswordReset.mockRejectedValue(new Error('Unknown error'));
      
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const errorIcon = wrapper.find('[data-icon="material-symbols:error-outline"]');
      expect(errorIcon.exists()).toBe(true);
    });

    it('should reset error state on new submission', async () => {
      mockAuthRepository.requestPasswordReset.mockRejectedValueOnce(new Error('Error'));
      
      const wrapper = mount(PasswordResetRequestForm);
      
      // First submission with error
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      let errorIcon = wrapper.find('[data-icon="material-symbols:error-outline"]');
      expect(errorIcon.exists()).toBe(true);
      
      // Second submission without error
      mockAuthRepository.requestPasswordReset.mockResolvedValue({});
      await form.trigger('submit');
      await nextTick();
      
      errorIcon = wrapper.find('[data-icon="material-symbols:error-outline"]');
      expect(errorIcon.exists()).toBe(false);
    });
  });

  describe('Success State', () => {
    it('should render success message and back to login link', async () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const successTitle = wrapper.find('.text-4xl.font-semibold');
      const backToLoginLink = wrapper.find('a[href="login"]');
      
      expect(successTitle.exists()).toBe(true);
      expect(successTitle.text()).toBe('Success');
      expect(backToLoginLink.exists()).toBe(true);
      expect(backToLoginLink.text()).toBe('Back to login');
    });

    it('should hide the form in success state', async () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const formElement = wrapper.find('[data-testid="password-reset-form"]');
      expect(formElement.exists()).toBe(false);
    });

    it('should display proper success instructions', async () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      await form.trigger('submit');
      await nextTick();
      
      const instructions = wrapper.find('.text-gray-500.font-medium');
      expect(instructions.exists()).toBe(true);
      expect(instructions.text()).toContain('If a user is registered under that email');
      expect(instructions.text()).toContain('5 minutes');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const form = wrapper.find('[data-testid="password-reset-form"]');
      const emailInput = wrapper.find('[data-testid="email-input"]');
      const submitButton = wrapper.find('[data-testid="submit-button"]');
      
      expect(form.exists()).toBe(true);
      expect(emailInput.attributes('type')).toBe('email');
      expect(submitButton.attributes('type')).toBe('submit');
    });

    it('should have descriptive button text', () => {
      const wrapper = mount(PasswordResetRequestForm);
      
      const submitButton = wrapper.find('[data-testid="submit-button"]');
      expect(submitButton.text()).toBe('Request password reset');
    });
  });
});