import PasswordResetRequestView from '@/codeclarity_components/authentication/password_reset/PasswordResetRequestView.vue';
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStateStore = {
  $reset: vi.fn(),
  page: '',
  publicPage: false
};

vi.mock('@/stores/state', () => ({
  useStateStore: () => mockStateStore
}));

describe('PasswordResetRequestView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateStore.page = '';
    mockStateStore.publicPage = false;
  });

  describe('Component Structure', () => {
    it('should render the main container with correct styling', () => {
      const wrapper = mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      const mainElement = wrapper.find('main');
      expect(mainElement.exists()).toBe(true);
      expect(mainElement.classes()).toContain('p-12');
    });

    it('should handle async component configuration', () => {
      const wrapper = mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should reset the state store on component setup', () => {
      mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      expect(mockStateStore.$reset).toHaveBeenCalledOnce();
    });

    it('should set page to "password-recovery"', () => {
      mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      expect(mockStateStore.page).toBe('password-recovery');
    });

    it('should set publicPage to true', () => {
      mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      expect(mockStateStore.publicPage).toBe(true);
    });
  });

  describe('Layout', () => {
    it('should have proper semantic structure', () => {
      const wrapper = mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      const mainElement = wrapper.find('main');
      expect(mainElement.exists()).toBe(true);
      expect(wrapper.html()).toContain('main');
    });

    it('should apply consistent padding to main container', () => {
      const wrapper = mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      const mainElement = wrapper.find('main');
      expect(mainElement.classes()).toEqual(['p-12']);
    });
  });

  describe('Error Handling', () => {
    it('should render without errors when all dependencies are available', () => {
      expect(() => mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      })).not.toThrow();
    });

    it('should handle store initialization properly', () => {
      const wrapper = mount(PasswordResetRequestView, {
        global: {
          stubs: ['PasswordResetRequestForm']
        }
      });
      
      expect(wrapper.vm).toBeDefined();
      expect(mockStateStore.$reset).toHaveBeenCalled();
    });
  });
});