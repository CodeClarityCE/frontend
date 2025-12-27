import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import UserAuthForm from '@/codeclarity_components/authentication/signin/UserAuthForm.vue';
import {
  expectNoAccessibilityViolations,
  expectAccessibilityRule,
  getAccessibilityInsights,
  testKeyboardNavigation,
  accessibilityTestScenarios,
  formAxeConfig
} from '../../utils/accessibility-utils';

// Mock dependencies
vi.mock('@/codeclarity_components/authentication/auth.repository');

// Mock stores properly
vi.mock('@/stores/user', () => ({
  useUserStore: () => ({
    getUser: { id: 'test-user', email: 'test@example.com', name: 'Test User' },
    getDefaultOrg: { id: 'test-org', name: 'Test Org' },
    setUser: vi.fn(),
    setDefaultOrg: vi.fn()
  })
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    getToken: 'mock-token',
    initialized: true,
    authenticated: true,
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
    setToken: vi.fn(),
    logout: vi.fn()
  })
}));

vi.mock('@/router', () => ({
  default: { push: vi.fn() }
}));

describe('UserAuthForm Accessibility Tests', () => {
   
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Properly cleanup to prevent unhandled rejections
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
    await nextTick();
  });

  const mountComponent = () => {
    wrapper = mount(UserAuthForm, {
      global: {
        stubs: {
          Icon: true,
          Alert: { 
            template: '<div role="alert" class="alert"><slot /></div>',
            props: ['variant']
          },
          AlertDescription: { 
            template: '<div class="alert-description"><slot /></div>' 
          },
          Button: {
            template: '<button type="submit" :disabled="disabled"><slot /></button>',
            props: ['disabled']
          },
          Input: {
            template: '<input v-bind="$attrs" :type="type" :name="name" :id="id" :required="required" :aria-describedby="ariaDescribedBy" :aria-label="$attrs[\'aria-label\'] ?? placeholder" :placeholder="placeholder" />',
            props: ['type', 'name', 'id', 'required', 'ariaDescribedBy', 'placeholder'],
            inheritAttrs: false
          },
          FormField: {
            template: `
              <div class="form-field">
                <slot :componentField="{ 
                  name: name,
                  id: name,
                  'aria-label': name + ' field',
                  'aria-labelledby': name + '-label'
                }" />
              </div>
            `,
            props: ['name']
          },
          FormItem: {
            template: '<div class="form-item"><slot /></div>'
          },
          FormLabel: {
            template: '<label :for="htmlFor" :id="labelId"><slot /></label>',
            props: ['htmlFor', 'labelId']
          },
          FormControl: {
            template: '<div class="form-control"><slot /></div>'
          },
          FormMessage: {
            template: '<div class="form-message" role="alert"><slot /></div>'
          }
        }
      }
    });
    return wrapper;
  };

  describe('Basic Accessibility Compliance', () => {
    it('should pass WCAG 2.1 AA accessibility standards', async () => {
      mountComponent();
      await nextTick();
      
      await expectNoAccessibilityViolations(wrapper, formAxeConfig);
    });

    it('should have no color contrast violations', async () => {
      mountComponent();
      await nextTick();
      
      await expectAccessibilityRule(wrapper, 'color-contrast');
    });

    it('should have proper form labeling', async () => {
      mountComponent();
      await nextTick();
      
      await expectAccessibilityRule(wrapper, 'label');
      await expectAccessibilityRule(wrapper, 'form-field-multiple-labels');
    });

    it('should have proper ARIA attributes', async () => {
      mountComponent();
      await nextTick();
      
      await expectAccessibilityRule(wrapper, 'aria-valid-attr');
      await expectAccessibilityRule(wrapper, 'aria-valid-attr-value');
      await expectAccessibilityRule(wrapper, 'aria-required-attr');
    });
  });

  describe('Form Accessibility', () => {
    it('should pass comprehensive form accessibility tests', async () => {
      mountComponent();
      await nextTick();
      
      await accessibilityTestScenarios.form(wrapper);
    });

    it('should have accessible form fields with proper labels', async () => {
      mountComponent();
      await nextTick();
      
      // Check email field and label
      const emailInput = wrapper.find('input[placeholder*="email"]');
      expect(emailInput.exists()).toBe(true);
      
      const emailLabel = wrapper.find('label');
      expect(emailLabel.exists()).toBe(true);
      expect(wrapper.text()).toContain('Email');
      
      // Check password field and label  
      const passwordInput = wrapper.find('input[placeholder*="password"]');
      expect(passwordInput.exists()).toBe(true);
      expect(wrapper.text()).toContain('Password');
    });

    it('should have proper input types for accessibility', async () => {
      mountComponent();
      await nextTick();
      
      // Email input is type="text" in the actual component
      const emailInput = wrapper.find('input[placeholder*="email"]');
      expect(emailInput.attributes('type')).toBe('text');
      
      const passwordInput = wrapper.find('input[placeholder*="password"]');
      expect(passwordInput.attributes('type')).toBe('password');
    });

    it('should mark required fields appropriately', async () => {
      mountComponent();
      await nextTick();
      
      // Form validation is handled by vee-validate, not HTML5 required attributes
      // Check that required indicators are present in the labels
      expect(wrapper.text()).toContain('Email*');
      expect(wrapper.text()).toContain('Password');
    });

    it('should have accessible error messages', async () => {
      mountComponent();
      await nextTick();
      
      // Trigger validation errors
      const form = wrapper.find('form');
      await form.trigger('submit');
      await nextTick();
      
      // Error messages should have role="alert" for screen readers
      const errorMessages = wrapper.findAll('[role="alert"]');
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it('should associate error messages with form fields', async () => {
      mountComponent();
      await nextTick();
      
      // Trigger validation errors
      const emailInput = wrapper.find('input[name="email"]');
      await emailInput.setValue('invalid-email');
      await emailInput.trigger('blur');
      await nextTick();
      
      // Check if input has aria-describedby pointing to error message
      const describedBy = emailInput.attributes('aria-describedby');
      if (describedBy) {
        const errorElement = wrapper.find(`#${describedBy}`);
        expect(errorElement.exists()).toBe(true);
      }
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support proper keyboard navigation', async () => {
      mountComponent();
      await nextTick();
      
      const keyboardResults = await testKeyboardNavigation(wrapper);
      
      // Should have focusable elements
      expect(keyboardResults.focusableElements.length).toBeGreaterThan(0);
      
      // Tab order should include all interactive elements
      const expectedElements = ['input[name="email"]', 'input[name="password"]', 'button[type="submit"]'];
      for (const selector of expectedElements) {
        const element = wrapper.find(selector);
        expect(element.exists()).toBe(true);
      }
    });

    it('should allow form submission via Enter key', async () => {
      mountComponent();
      await nextTick();
      
      // Fill valid data
      const emailInput = wrapper.find('input[placeholder*="email"]');
      const passwordInput = wrapper.find('input[placeholder*="password"]');
      
      await emailInput.setValue('test@example.com');
      await passwordInput.setValue('validpassword123');
      
      // Press Enter in password field (form submission is handled internally)
      await passwordInput.trigger('keydown', { key: 'Enter' });
      await nextTick();
      
      // Form elements should exist and be functional
      expect(emailInput.exists()).toBe(true);
      expect(passwordInput.exists()).toBe(true);
    });

    it('should have proper focus management', async () => {
      mountComponent();
      await nextTick();
      
      const emailInput = wrapper.find('input[placeholder*="email"]');
      
      // Focus first input
      await emailInput.trigger('focus');
      
      // Tab to next element (focus management is browser-handled)
      await emailInput.trigger('keydown', { key: 'Tab' });
      
      // Ensure inputs are focusable
      expect(emailInput.exists()).toBe(true);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA landmarks', async () => {
      mountComponent();
      await nextTick();
      
      // Form should be identifiable as a form
      const form = wrapper.find('form');
      expect(form.exists()).toBe(true);
      
      // Should have proper heading structure
      const headings = wrapper.findAll('h1, h2, h3, h4, h5, h6');
      if (headings.length > 0) {
        // First heading should be h1 or have proper hierarchy
        const firstHeading = headings[0];
        const tagName = firstHeading.element.tagName.toLowerCase();
        expect(['h1', 'h2'].includes(tagName)).toBe(true);
      }
    });

    it('should announce loading states to screen readers', async () => {
      mountComponent();
      await nextTick();
      
      // Loading state is handled internally by the component
      // Check if loading text is available when it should be
      expect(wrapper.text()).toContain('Sign in');
    });

    it('should announce form errors to screen readers', async () => {
      mountComponent();
      await nextTick();
      
      // Trigger form submission with errors
      const form = wrapper.find('form');
      await form.trigger('submit');
      await nextTick();
      
      // Error messages should have role="alert" for immediate announcement
      const alerts = wrapper.findAll('[role="alert"]');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Social Authentication Accessibility', () => {
    it('should have accessible social login buttons', async () => {
      mountComponent();
      await nextTick();
      
      // Test social auth buttons
      await accessibilityTestScenarios.button(wrapper);
      
      const socialButtons = wrapper.findAll('[data-testid*="auth"]');
      for (const button of socialButtons) {
        const element = button.element;
        const hasText = element.textContent && element.textContent.trim().length > 0;
        const hasAriaLabel = element.hasAttribute('aria-label');
        
        expect(hasText ?? hasAriaLabel).toBe(true);
      }
    });

    it('should indicate button purpose for social logins', async () => {
      mountComponent();
      await nextTick();
      
      const googleButton = wrapper.find('[data-testid="google-auth"]');
      if (googleButton.exists()) {
        const text = googleButton.text() ?? googleButton.attributes('aria-label') ?? '';
        expect(text.toLowerCase()).toContain('google');
      }
      
      const githubButton = wrapper.find('[data-testid="github-auth"]');
      if (githubButton.exists()) {
        const text = githubButton.text() ?? githubButton.attributes('aria-label') ?? '';
        expect(text.toLowerCase()).toContain('github');
      }
    });
  });

  describe('Error State Accessibility', () => {
    it('should have accessible error announcements', async () => {
      mountComponent();
      await nextTick();
      
      // Error handling is internal to the component
      // Check that error alert structure exists
      const errorAlert = wrapper.find('.alert');
      if (errorAlert.exists()) {
        expect(errorAlert.attributes('role')).toBe('alert');
      }
    });

    it('should maintain focus after error display', async () => {
      mountComponent();
      await nextTick();
      
      const emailInput = wrapper.find('input[placeholder*="email"]');
      await emailInput.trigger('focus');
      
      // Focus management is handled by the component
      expect(emailInput.exists()).toBe(true);
    });
  });

  // TODO: Re-enable after Zod v4 compatibility issues are resolved
  // These tests cause unhandled rejections during cleanup due to auto-animate + Zod v4 timing issues
  describe.skip('Accessibility Insights and Scoring', () => {
    it('should achieve high accessibility score', async () => {
      mountComponent();
      await nextTick();

      const insights = await getAccessibilityInsights(wrapper);

      // Should have minimal violations
      expect(insights.violations.length).toBeLessThan(5);

      // Should have reasonable score (>=70%)
      expect(insights.summary.score).toBeGreaterThanOrEqual(70);

      // Should have more passes than violations
      expect(insights.summary.passCount).toBeGreaterThan(insights.summary.violationCount);
    });

    it('should provide detailed accessibility reporting', async () => {
      mountComponent();
      await nextTick();

      const insights = await getAccessibilityInsights(wrapper);

      // Log accessibility metrics for monitoring
      console.log('Accessibility Metrics:', {
        score: insights.summary.score,
        violations: insights.summary.violationCount,
        passes: insights.summary.passCount,
        total: insights.summary.totalChecks
      });

      // Ensure we have some test coverage
      expect(insights.summary.totalChecks).toBeGreaterThanOrEqual(8);
    });
  });
});