// Mock reflect-metadata for TypeScript decorators
global.Reflect = global.Reflect || {};
global.Reflect.getMetadata = global.Reflect.getMetadata || vi.fn();

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import OAuth2Callback from '@/codeclarity_components/authentication/oauth/OAuth2Callback.vue';
import router from '@/router';
import { SocialProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { APIErrors } from '@/utils/api/ApiErrors';

interface MockAuthRepository {
  gitlabAuthFinalize: ReturnType<typeof vi.fn>;
  githubAuthFinalize: ReturnType<typeof vi.fn>;
  getAuthenticatedUser: ReturnType<typeof vi.fn>;
}

interface MockAuthStore {
  getSocialAuthState: string | undefined;
  socialAuthState: string | undefined;
  setToken: ReturnType<typeof vi.fn>;
  setTokenExpiry: ReturnType<typeof vi.fn>;
  setRefreshToken: ReturnType<typeof vi.fn>;
  setRefreshTokenExpiry: ReturnType<typeof vi.fn>;
  setAuthenticated: ReturnType<typeof vi.fn>;
  $reset: ReturnType<typeof vi.fn>;
}

interface MockUserStore {
  setUser: ReturnType<typeof vi.fn>;
  $reset: ReturnType<typeof vi.fn>;
}

const mockAuthRepository: MockAuthRepository = {
  gitlabAuthFinalize: vi.fn(),
  githubAuthFinalize: vi.fn(),
  getAuthenticatedUser: vi.fn()
};

const mockAuthStore: MockAuthStore = {
  getSocialAuthState: 'test-state',
  socialAuthState: undefined,
  setToken: vi.fn(),
  setTokenExpiry: vi.fn(),
  setRefreshToken: vi.fn(),
  setRefreshTokenExpiry: vi.fn(),
  setAuthenticated: vi.fn(),
  $reset: vi.fn()
};

const mockUserStore: MockUserStore = {
  setUser: vi.fn(),
  $reset: vi.fn()
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
  }
}));

vi.mock('@/router', () => ({
  default: {
    push: vi.fn()
  }
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore
}));

vi.mock('@iconify/vue', () => ({
  Icon: defineComponent({
    name: 'Icon',
    props: ['icon', 'class'],
    template: '<span :data-icon="icon" :class="class"></span>'
  })
}));

vi.mock('@/shadcn/ui/button/Button.vue', () => ({
  default: defineComponent({
    name: 'Button',
    emits: ['click'],
    template: '<button @click="$emit(\'click\')" data-testid="button"><slot></slot></button>'
  })
}));

describe('OAuth2Callback', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthRepository.gitlabAuthFinalize.mockResolvedValue({
      token: 'test-token',
      token_expiry: 3600,
      refresh_token: 'refresh-token',
      refresh_token_expiry: 7200
    });

    mockAuthRepository.githubAuthFinalize.mockResolvedValue({
      token: 'test-token',
      token_expiry: 3600,
      refresh_token: 'refresh-token',
      refresh_token_expiry: 7200
    });

    mockAuthRepository.getAuthenticatedUser.mockResolvedValue({
      setup_done: true,
      id: 'user-id',
      email: 'test@example.com'
    });

    originalLocation = window.location;

    delete (window as any).location;
    (window as any).location = {
      href: 'https://example.com?state=test-state&code=test-code',
      search: '?state=test-state&code=test-code'
    };

    mockAuthStore.getSocialAuthState = 'test-state';
    mockAuthStore.socialAuthState = undefined;
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  describe('Component Structure', () => {
    it('should render the main container', async () => {
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const container = wrapper.find('.oauth-status-wrapper');
      expect(container.exists()).toBe(true);
      expect(container.classes()).toContain('flex');
      expect(container.classes()).toContain('flex-col');
      expect(container.classes()).toContain('items-center');
      expect(container.classes()).toContain('justify-center');
      expect(container.classes()).toContain('h-screen');
    });

    it('should render GitLab icon when provider is GitLab', async () => {
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const gitlabIcon = wrapper.find('[data-icon="devicon:gitlab"]');
      expect(gitlabIcon.exists()).toBe(true);
    });

    it('should render GitHub icon when provider is GitHub', async () => {
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITHUB
        }
      });
      
      const githubIcon = wrapper.find('[data-icon="simple-icons:github"]');
      expect(githubIcon.exists()).toBe(true);
    });

    it('should display loading spinner initially', async () => {
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const loadingIcon = wrapper.find('[data-icon="tabler:loader-2"]');
      expect(loadingIcon.exists()).toBe(true);
      expect(loadingIcon.classes()).toContain('animate-spin');
    });
  });

  describe('URL Parameter Validation', () => {
    it('should redirect to login when state parameter is missing', async () => {
      (window as any).location = {
        href: 'https://example.com?code=test-code',
        search: '?code=test-code'
      };

      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login when code parameter is missing', async () => {
      (window as any).location = {
        href: 'https://example.com?state=test-state',
        search: '?state=test-state'
      };

      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login when provider is invalid', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: 'INVALID' as SocialProvider
        }
      });
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('State Validation (CSRF Protection)', () => {
    it('should redirect to login when stored state is undefined', async () => {
      mockAuthStore.getSocialAuthState = undefined;
      
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login when state mismatch occurs', async () => {
      mockAuthStore.getSocialAuthState = 'different-state';
      
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('should clear social auth state when state matches', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(mockAuthStore.socialAuthState).toBeUndefined();
    });
  });

  describe('GitLab Authentication', () => {
    it('should call gitlabAuthFinalize for GitLab provider', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(mockAuthRepository.gitlabAuthFinalize).toHaveBeenCalledWith({
        data: { code: 'test-code' },
        handleBusinessErrors: true
      });
    });

    it('should redirect to signup when user setup is not done for GitLab', async () => {
      mockAuthRepository.getAuthenticatedUser.mockResolvedValue({
        setup_done: false,
        id: 'user-id',
        email: 'test@example.com'
      });
      
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      expect(router.push).toHaveBeenCalledWith({
        name: 'signup',
        query: { provider: SocialProvider.GITLAB }
      });
    });
  });

  describe('GitHub Authentication', () => {
    it('should call githubAuthFinalize for GitHub provider', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITHUB
        }
      });
      await nextTick();
      
      expect(mockAuthRepository.githubAuthFinalize).toHaveBeenCalledWith({
        data: { code: 'test-code' },
        handleBusinessErrors: true
      });
    });

    it('should redirect to signup when user setup is not done for GitHub', async () => {
      mockAuthRepository.getAuthenticatedUser.mockResolvedValue({
        setup_done: false,
        id: 'user-id',
        email: 'test@example.com'
      });
      
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITHUB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      expect(router.push).toHaveBeenCalledWith({
        name: 'signup',
        query: { provider: SocialProvider.GITHUB }
      });
    });
  });

  describe('Successful Authentication', () => {
    it('should set authentication tokens and user data', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      expect(mockAuthStore.setToken).toHaveBeenCalledWith('test-token');
      expect(mockAuthStore.setTokenExpiry).toHaveBeenCalledWith(3600);
      expect(mockAuthStore.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockAuthStore.setRefreshTokenExpiry).toHaveBeenCalledWith(7200);
      expect(mockAuthStore.setAuthenticated).toHaveBeenCalledWith(true);
      expect(mockUserStore.setUser).toHaveBeenCalled();
    });

    it('should redirect to home page after successful authentication', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      expect(router.push).toHaveBeenCalledWith('/');
    });

    it('should get authenticated user with correct token', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(mockAuthRepository.getAuthenticatedUser).toHaveBeenCalledWith({
        bearerToken: 'test-token',
        handleBusinessErrors: true,
        validate: false
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle business logic error with account not activated', async () => {
      const businessError = new BusinessLogicError('AccountNotActivated', 'Account not activated');
      mockAuthRepository.gitlabAuthFinalize.mockRejectedValue(businessError);
      
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/trial');
    });

    it('should display non-recoverable error for failed social authentication', async () => {
      const businessError = new BusinessLogicError(APIErrors.FailedToAuthenticateSocialAccount, 'Failed to authenticate social account');
      mockAuthRepository.gitlabAuthFinalize.mockRejectedValue(businessError);
      
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      const errorMessage = wrapper.text();
      expect(errorMessage).toContain('Whoops');
      expect(errorMessage).toContain('non-recoverable issue');
    });

    it('should display error code for non-recoverable errors', async () => {
      const businessError = new BusinessLogicError(APIErrors.FailedToAuthenticateSocialAccount, 'Failed to authenticate social account');
      mockAuthRepository.gitlabAuthFinalize.mockRejectedValue(businessError);
      
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      expect(wrapper.text()).toContain('Error code:');
      expect(wrapper.text()).toContain(APIErrors.FailedToAuthenticateSocialAccount);
    });

    it('should display "already exists" error message', async () => {
      const businessError = new BusinessLogicError(APIErrors.AlreadyExists, 'User already exists');
      mockAuthRepository.gitlabAuthFinalize.mockRejectedValue(businessError);
      
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      expect(wrapper.text()).toContain('A user with that email already exists');
    });

    it('should hide loading spinner when error occurs', async () => {
      const businessError = new BusinessLogicError(APIErrors.FailedToAuthenticateSocialAccount, 'Failed to authenticate social account');
      mockAuthRepository.gitlabAuthFinalize.mockRejectedValue(businessError);
      
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      const loadingIcon = wrapper.find('[data-icon="tabler:loader-2"]');
      expect(loadingIcon.exists()).toBe(false);
    });
  });

  describe('Error Recovery Actions', () => {
    it('should reset stores and redirect to login on non-recoverable error button click', async () => {
      const businessError = new BusinessLogicError(APIErrors.FailedToAuthenticateSocialAccount, 'Failed to authenticate social account');
      mockAuthRepository.gitlabAuthFinalize.mockRejectedValue(businessError);
      
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      const button = wrapper.find('[data-testid="button"]');
      await button.trigger('click');
      
      expect(mockAuthStore.$reset).toHaveBeenCalled();
      expect(mockUserStore.$reset).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login on recoverable error button click', async () => {
      const businessError = new BusinessLogicError(APIErrors.AlreadyExists, 'User already exists');
      mockAuthRepository.gitlabAuthFinalize.mockRejectedValue(businessError);
      
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      await nextTick(); // Wait for onMounted async operations
      
      const button = wrapper.find('[data-testid="button"]');
      await button.trigger('click');
      
      expect(mockAuthStore.$reset).toHaveBeenCalled();
      expect(mockUserStore.$reset).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('Provider Support', () => {
    it('should support both GitLab and GitHub providers', () => {
      const gitlabWrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      const githubWrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITHUB
        }
      });
      
      expect(gitlabWrapper.exists()).toBe(true);
      expect(githubWrapper.exists()).toBe(true);
    });

    it('should handle unknown provider gracefully', async () => {
      mockAuthRepository.gitlabAuthFinalize.mockResolvedValue({
        token: 'test-token',
        token_expiry: 3600,
        refresh_token: 'refresh-token',
        refresh_token_expiry: 7200
      });
      
      mount(OAuth2Callback, {
        props: {
          provider: 'UNKNOWN' as SocialProvider
        }
      });
      await nextTick();
      
      expect(router.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('Component Lifecycle', () => {
    it('should start authentication process on mount', async () => {
      mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      await nextTick();
      
      expect(mockAuthRepository.gitlabAuthFinalize).toHaveBeenCalled();
    });

    it('should handle component unmounting gracefully', () => {
      const wrapper = mount(OAuth2Callback, {
        props: {
          provider: SocialProvider.GITLAB
        }
      });
      
      expect(() => wrapper.unmount()).not.toThrow();
    });
  });
});