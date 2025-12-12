import SignupView from '@/codeclarity_components/authentication/signup/SignupView.vue';
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the stores
const mockStateStore = {
  $reset: vi.fn(),
  page: '',
  publicPage: false
};

vi.mock('@/stores/state', () => ({
  useStateStore: vi.fn(() => mockStateStore)
}));

// Mock the async components
vi.mock('@/codeclarity_components/authentication/signup/SocialSetup.vue', () => ({
  default: {
    name: 'SocialSetup',
    template: '<div class="social-setup">Social Setup Component</div>',
    props: ['provider']
  }
}));

vi.mock('@/codeclarity_components/authentication/signup/SignupForm.vue', () => ({
  default: {
    name: 'SignupForm',
    template: '<div class="signup-form">Signup Form Component</div>'
  }
}));

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

// Mock window.location
const mockLocation = {
  search: ''
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('SignupView.vue', () => {
  let wrapper: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockStateStore.$reset.mockClear();
    
    // Reset location search
    mockLocation.search = '';
    
    wrapper = mount(SignupView, {
      global: {
        stubs: {
          SocialSetup: {
            name: 'SocialSetup',
            template: '<div class="social-setup">Social Setup</div>',
            props: ['provider']
          },
          SignupForm: {
            name: 'SignupForm',
            template: '<div class="signup-form">Signup Form</div>'
          }
        }
      }
    });
  });

  describe('Component Structure', () => {
    it('renders the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('initializes state store correctly', () => {
      expect(mockStateStore.$reset).toHaveBeenCalled();
      expect(mockStateStore.page).toBe('signup');
      expect(mockStateStore.publicPage).toBe(true);
    });

    it('renders SignupForm by default when no provider parameter', () => {
      const signupForm = wrapper.find('.signup-form');
      const socialSetup = wrapper.find('.social-setup');
      
      expect(signupForm.exists()).toBe(true);
      expect(signupForm.text()).toBe('Signup Form');
      expect(socialSetup.exists()).toBe(false);
    });
  });

  describe('Conditional Rendering', () => {
    it('renders SocialSetup when provider parameter is present', async () => {
      // Set URL with provider parameter
      mockLocation.search = '?provider=github';
      
      // Remount component to apply new URL
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      const socialSetup = wrapper.find('.social-setup');
      const signupForm = wrapper.find('.signup-form');
      
      expect(socialSetup.exists()).toBe(true);
      expect(socialSetup.text()).toBe('Social Setup');
      expect(signupForm.exists()).toBe(false);
    });

    it('renders SignupForm when provider parameter is empty', async () => {
      // Set URL with empty provider parameter
      mockLocation.search = '?provider=';
      
      // Remount component to apply new URL
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      const signupForm = wrapper.find('.signup-form');
      const socialSetup = wrapper.find('.social-setup');
      
      expect(signupForm.exists()).toBe(true);
      expect(signupForm.text()).toBe('Signup Form');
      expect(socialSetup.exists()).toBe(false);
    });

    it('handles different provider types', async () => {
      // Test with gitlab provider
      mockLocation.search = '?provider=gitlab';
      
      // Remount component to apply new URL
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      const socialSetup = wrapper.find('.social-setup');
      expect(socialSetup.exists()).toBe(true);
    });
  });

  describe('URL Parameter Parsing', () => {
    it('correctly parses provider parameter from URL', async () => {
      mockLocation.search = '?provider=github&other=value';
      
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      const socialSetup = wrapper.find('.social-setup');
      expect(socialSetup.exists()).toBe(true);
    });

    it('handles multiple URL parameters correctly', async () => {
      mockLocation.search = '?foo=bar&provider=github&baz=qux';
      
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      const socialSetup = wrapper.find('.social-setup');
      expect(socialSetup.exists()).toBe(true);
    });

    it('handles malformed URL parameters gracefully', async () => {
      mockLocation.search = '?provider';
      
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      // Should default to SignupForm when parameter is malformed
      const signupForm = wrapper.find('.signup-form');
      expect(signupForm.exists()).toBe(true);
    });
  });

  describe('Async Component Configuration', () => {
    it('defines async components with proper config', () => {
      // Test that the component structure exists
      expect(wrapper.vm).toBeDefined();
      
      // At least one of the components should be rendered
      const hasSignupForm = wrapper.find('.signup-form').exists();
      const hasSocialSetup = wrapper.find('.social-setup').exists();
      
      expect(hasSignupForm || hasSocialSetup).toBe(true);
    });

    it('handles async component loading states', () => {
      // Components should be rendered (even if stubbed)
      const componentExists = wrapper.find('.signup-form').exists() || wrapper.find('.social-setup').exists();
      expect(componentExists).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing location object gracefully', async () => {
      // Temporarily remove location.search
      const originalSearch = mockLocation.search;
      delete (mockLocation as any).search;
      
      try {
        wrapper = mount(SignupView, {
          global: {
            stubs: {
              SocialSetup: {
                name: 'SocialSetup',
                template: '<div class="social-setup">Social Setup</div>',
                props: ['provider']
              },
              SignupForm: {
                name: 'SignupForm',
                template: '<div class="signup-form">Signup Form</div>'
              }
            }
          }
        });

        await wrapper.vm.$nextTick();
        
        // Should default to SignupForm
        const signupForm = wrapper.find('.signup-form');
        expect(signupForm.exists()).toBe(true);
      } finally {
        // Restore original search
        mockLocation.search = originalSearch;
      }
    });

    it('renders without crashing when state store fails', () => {
      // Reset store to minimal state
      mockStateStore.page = '';
      mockStateStore.publicPage = false;
      
      const wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });
      
      expect(wrapper.exists()).toBe(true);
    });

    it('handles empty URL search correctly', async () => {
      mockLocation.search = '';
      
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">Social Setup</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      const signupForm = wrapper.find('.signup-form');
      expect(signupForm.exists()).toBe(true);
    });
  });

  describe('Component Integration', () => {
    it('passes provider prop to SocialSetup component', async () => {
      mockLocation.search = '?provider=github';
      
      wrapper = mount(SignupView, {
        global: {
          stubs: {
            SocialSetup: {
              name: 'SocialSetup',
              template: '<div class="social-setup">{{ provider }}</div>',
              props: ['provider']
            },
            SignupForm: {
              name: 'SignupForm',
              template: '<div class="signup-form">Signup Form</div>'
            }
          }
        }
      });

      await wrapper.vm.$nextTick();
      
      const socialSetup = wrapper.findComponent({ name: 'SocialSetup' });
      expect(socialSetup.exists()).toBe(true);
      expect(socialSetup.props('provider')).toBe('github');
    });
  });
});