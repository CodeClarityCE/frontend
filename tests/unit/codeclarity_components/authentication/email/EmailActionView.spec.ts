import EmailActionView from '@/codeclarity_components/authentication/email/EmailActionView.vue';
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockStateStore } = vi.hoisted(() => ({
  mockStateStore: {
    $reset: vi.fn(),
    page: ''
  }
}));

vi.mock('@/stores/state', () => ({
  useStateStore: () => mockStateStore
}));

vi.mock('@/codeclarity_components/organizations/invites/OrganizationJoin.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'EmailActionJoinOrg',
      template: '<div data-testid="email-action-join-org">Join Organization Component</div>'
    })
  };
});

vi.mock('@/codeclarity_components/authentication/email/PasswordResetForm.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'PasswordResetForm',
      template: '<div data-testid="password-reset-form">Password Reset Form Component</div>'
    })
  };
});

vi.mock('@/codeclarity_components/authentication/email/ConfirmRegistration.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'ConfirmRegistration',
      template: '<div data-testid="confirm-registration">Confirm Registration Component</div>'
    })
  };
});

describe('EmailActionView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateStore.page = '';
  });

  describe('Component Structure', () => {
    it('should render the main container with correct styling', () => {
      const wrapper = mount(EmailActionView);
      
      const mainElement = wrapper.find('main');
      expect(mainElement.exists()).toBe(true);
      expect(mainElement.classes()).toContain('p-12');
    });
  });

  describe('State Management', () => {
    it('should reset the state store on component setup', () => {
      mount(EmailActionView);
      
      expect(mockStateStore.$reset).toHaveBeenCalledOnce();
    });

    it('should set page to "emailAction"', () => {
      mount(EmailActionView);
      
      expect(mockStateStore.page).toBe('emailAction');
    });
  });

  describe('Conditional Rendering', () => {
    it('should render EmailActionJoinOrg when page prop is "join_org"', () => {
      const wrapper = mount(EmailActionView, {
        props: {
          page: 'join_org'
        }
      });
      
      const joinOrgComponent = wrapper.find('[data-testid="email-action-join-org"]');
      const passwordResetForm = wrapper.find('[data-testid="password-reset-form"]');
      const confirmRegistration = wrapper.find('[data-testid="confirm-registration"]');
      
      expect(joinOrgComponent.exists()).toBe(true);
      expect(passwordResetForm.exists()).toBe(false);
      expect(confirmRegistration.exists()).toBe(false);
    });

    it('should render PasswordResetForm when page prop is "reset_password"', () => {
      const wrapper = mount(EmailActionView, {
        props: {
          page: 'reset_password'
        }
      });
      
      const joinOrgComponent = wrapper.find('[data-testid="email-action-join-org"]');
      const passwordResetForm = wrapper.find('[data-testid="password-reset-form"]');
      const confirmRegistration = wrapper.find('[data-testid="confirm-registration"]');
      
      expect(joinOrgComponent.exists()).toBe(false);
      expect(passwordResetForm.exists()).toBe(true);
      expect(confirmRegistration.exists()).toBe(false);
    });

    it('should render ConfirmRegistration as default when page prop is undefined', () => {
      const wrapper = mount(EmailActionView);
      
      const joinOrgComponent = wrapper.find('[data-testid="email-action-join-org"]');
      const passwordResetForm = wrapper.find('[data-testid="password-reset-form"]');
      const confirmRegistration = wrapper.find('[data-testid="confirm-registration"]');
      
      expect(joinOrgComponent.exists()).toBe(false);
      expect(passwordResetForm.exists()).toBe(false);
      expect(confirmRegistration.exists()).toBe(true);
    });

    it('should render ConfirmRegistration as default when page prop is unknown value', () => {
      const wrapper = mount(EmailActionView, {
        props: {
          page: 'unknown_page'
        }
      });
      
      const joinOrgComponent = wrapper.find('[data-testid="email-action-join-org"]');
      const passwordResetForm = wrapper.find('[data-testid="password-reset-form"]');
      const confirmRegistration = wrapper.find('[data-testid="confirm-registration"]');
      
      expect(joinOrgComponent.exists()).toBe(false);
      expect(passwordResetForm.exists()).toBe(false);
      expect(confirmRegistration.exists()).toBe(true);
    });

    it('should render ConfirmRegistration as default when page prop is empty string', () => {
      const wrapper = mount(EmailActionView, {
        props: {
          page: ''
        }
      });
      
      const joinOrgComponent = wrapper.find('[data-testid="email-action-join-org"]');
      const passwordResetForm = wrapper.find('[data-testid="password-reset-form"]');
      const confirmRegistration = wrapper.find('[data-testid="confirm-registration"]');
      
      expect(joinOrgComponent.exists()).toBe(false);
      expect(passwordResetForm.exists()).toBe(false);
      expect(confirmRegistration.exists()).toBe(true);
    });
  });

  describe('Props', () => {
    it('should accept page prop as optional string', () => {
      const wrapper = mount(EmailActionView, {
        props: {
          page: 'join_org'
        }
      });
      
      expect(wrapper.props('page')).toBe('join_org');
    });

    it('should handle missing page prop gracefully', () => {
      const wrapper = mount(EmailActionView);
      
      expect(wrapper.props('page')).toBeUndefined();
    });
  });

  describe('Layout', () => {
    it('should have proper semantic structure', () => {
      const wrapper = mount(EmailActionView, {
        props: {
          page: 'join_org'
        }
      });
      
      const mainElement = wrapper.find('main');
      const component = wrapper.find('[data-testid="email-action-join-org"]');
      
      expect(mainElement.exists()).toBe(true);
      expect(component.exists()).toBe(true);
      expect(mainElement.element.contains(component.element)).toBe(true);
    });

    it('should apply consistent padding to main container', () => {
      const wrapper = mount(EmailActionView);
      
      const mainElement = wrapper.find('main');
      expect(mainElement.classes()).toEqual(['p-12']);
    });
  });

  describe('Component Integration', () => {
    it('should properly mount all supported page types', () => {
      const pageTypes = ['join_org', 'reset_password', undefined];
      
      pageTypes.forEach(pageType => {
        expect(() => mount(EmailActionView, {
          props: pageType ? { page: pageType } : {}
        })).not.toThrow();
      });
    });

    it('should ensure only one component is rendered at a time', () => {
      const wrapper = mount(EmailActionView, {
        props: {
          page: 'join_org'
        }
      });
      
      const allComponents = [
        wrapper.find('[data-testid="email-action-join-org"]'),
        wrapper.find('[data-testid="password-reset-form"]'),
        wrapper.find('[data-testid="confirm-registration"]')
      ];
      
      const visibleComponents = allComponents.filter(comp => comp.exists());
      expect(visibleComponents).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should render without errors when all dependencies are available', () => {
      expect(() => mount(EmailActionView)).not.toThrow();
    });

    it('should handle store initialization properly', () => {
      const wrapper = mount(EmailActionView);
      
      expect(wrapper.vm).toBeDefined();
      expect(mockStateStore.$reset).toHaveBeenCalled();
    });
  });
});