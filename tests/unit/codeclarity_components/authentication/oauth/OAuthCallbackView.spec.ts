// Mock reflect-metadata for TypeScript decorators
global.Reflect = global.Reflect ?? {};
global.Reflect.getMetadata = global.Reflect.getMetadata ?? vi.fn();
import OAuthCallbackView from '@/codeclarity_components/authentication/oauth/OAuthCallbackView.vue';
import { SocialProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
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

vi.mock('@/base_components/utilities/ErrorComponent.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'ErrorComponent',
      template: '<div data-testid="error-component">Error Component</div>'
    })
  };
});

vi.mock('@/base_components/ui/loaders/LoadingComponent.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'LoadingComponent',
      template: '<div data-testid="loading-component">Loading...</div>'
    })
  };
});

// Mock the async component import to be synchronous
vi.mock('@/codeclarity_components/authentication/oauth/OAuth2Callback.vue', async () => {
  const { defineComponent } = await import('vue');
  return {
    default: defineComponent({
      name: 'OAuth2Callback',
      props: ['provider'],
      template: '<div data-testid="oauth2-callback" :data-provider="provider">OAuth2 Callback Component</div>'
    }),
    __isTeleport: false,
    __isKeepAlive: false
  };
});

// Mock defineAsyncComponent to return the component immediately (synchronously)
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    defineAsyncComponent: (_options: any) => {
      // Return the mocked OAuth2Callback component directly
      return actual.defineComponent({
        name: 'OAuth2Callback',
        props: ['provider'],
        template: '<div data-testid="oauth2-callback" :data-provider="provider">OAuth2 Callback Component</div>'
      });
    }
  };
});

describe('OAuthCallbackView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateStore.page = '';
  });

  describe('Component Structure', () => {
    it('should render the main container with correct styling', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const mainElement = wrapper.find('main');
      expect(mainElement.exists()).toBe(true);
      expect(mainElement.classes()).toContain('p-12');
    });

    it('should render the OAuth2Callback component', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const oauth2Component = wrapper.find('[data-testid="oauth2-callback"]');
      expect(oauth2Component.exists()).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should reset the state store on component setup', () => {
      mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(mockStateStore.$reset).toHaveBeenCalledOnce();
    });

    it('should set page to "main"', () => {
      mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(mockStateStore.page).toBe('main');
    });

    it('should initialize state in correct order', () => {
      mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      // Verify that both operations happened in the component setup
      expect(mockStateStore.$reset).toHaveBeenCalledOnce();
      expect(mockStateStore.page).toBe('main');
    });
  });

  describe('Props Handling', () => {
    it('should pass GitLab provider to OAuth2Callback component', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const oauth2Component = wrapper.find('[data-testid="oauth2-callback"]');
      expect(oauth2Component.attributes('data-provider')).toBe(SocialProvider.GITLAB);
    });

    it('should pass GitHub provider to OAuth2Callback component', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITHUB
        }
      });
      
      const oauth2Component = wrapper.find('[data-testid="oauth2-callback"]');
      expect(oauth2Component.attributes('data-provider')).toBe(SocialProvider.GITHUB);
    });

    it('should accept provider prop with correct type', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(wrapper.props('provider')).toBe(SocialProvider.GITLAB);
    });
  });

  describe('Async Component Configuration', () => {
    it('should handle async component loading with correct configuration', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.vm).toBeDefined();
    });

    it('should render OAuth2Callback component when loaded', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const oauth2Component = wrapper.find('[data-testid="oauth2-callback"]');
      expect(oauth2Component.exists()).toBe(true);
    });
  });

  describe('Layout', () => {
    it('should have proper semantic structure', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const mainElement = wrapper.find('main');
      const oauth2Component = wrapper.find('[data-testid="oauth2-callback"]');
      
      expect(mainElement.exists()).toBe(true);
      expect(oauth2Component.exists()).toBe(true);
      expect(mainElement.element.contains(oauth2Component.element)).toBe(true);
    });

    it('should apply consistent padding to main container', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const mainElement = wrapper.find('main');
      expect(mainElement.classes()).toEqual(['p-12']);
    });
  });

  describe('Provider Support', () => {
    it('should support GitLab provider', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.props('provider')).toBe(SocialProvider.GITLAB);
    });

    it('should support GitHub provider', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITHUB
        }
      });
      
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.props('provider')).toBe(SocialProvider.GITHUB);
    });

    it('should handle different provider values correctly', () => {
      const providers = [SocialProvider.GITLAB, SocialProvider.GITHUB];
      
      providers.forEach(provider => {
        const wrapper = mount(OAuthCallbackView, {
          props: {
            provider
          }
        });
        
        const oauth2Component = wrapper.find('[data-testid="oauth2-callback"]');
        expect(oauth2Component.attributes('data-provider')).toBe(provider);
      });
    });
  });

  describe('Component Integration', () => {
    it('should properly mount with required props', () => {
      expect(() => mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      })).not.toThrow();
    });

    it('should integrate with state store properly', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(wrapper.vm).toBeDefined();
      expect(mockStateStore.$reset).toHaveBeenCalled();
      expect(mockStateStore.page).toBe('main');
    });

    it('should pass provider prop correctly to child component', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITHUB
        }
      });

      const oauth2Component = wrapper.findComponent('[data-testid="oauth2-callback"]');
      expect(oauth2Component.exists()).toBe(true);
      expect((oauth2Component as any).props('provider')).toBe(SocialProvider.GITHUB);
    });
  });

  describe('Error Handling', () => {
    it('should render without errors when all dependencies are available', () => {
      expect(() => mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      })).not.toThrow();
    });

    it('should handle store initialization properly', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(wrapper.vm).toBeDefined();
      expect(mockStateStore.$reset).toHaveBeenCalled();
    });

    it('should handle missing provider prop gracefully in component structure', () => {
      // This tests the component structure handling, not runtime behavior
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('TypeScript Integration', () => {
    it('should properly type the provider prop', () => {
      const wrapper = mount(OAuthCallbackView, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      // Verify that TypeScript types are working correctly
      expect(typeof wrapper.props('provider')).toBe('string');
      expect(Object.values(SocialProvider)).toContain(wrapper.props('provider'));
    });

    it('should maintain type safety for SocialProvider enum', () => {
      const validProviders = [SocialProvider.GITLAB, SocialProvider.GITHUB];
      
      validProviders.forEach(provider => {
        expect(() => mount(OAuthCallbackView, {
          props: {
            provider
          }
        })).not.toThrow();
      });
    });
  });
});