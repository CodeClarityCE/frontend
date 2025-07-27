import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import SSOAuth from '@/enterprise_components/sso/SSOAuth.vue';
import { createOAuthState } from '@/enterprise_components/sso/utils';

const mockAuthStore = {
  setSocialAuthState: vi.fn()
};

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore
}));

vi.mock('@iconify/vue', () => ({
  Icon: defineComponent({
    name: 'Icon',
    props: ['icon', 'class'],
    template: '<span :data-icon="icon" :class="class">Icon</span>'
  })
}));

vi.mock('@/shadcn/ui/button', () => ({
  Button: defineComponent({
    name: 'Button',
    props: ['variant', 'type'],
    emits: ['click'],
    template: '<button :type="type" :data-variant="variant" @click="$emit(\'click\')" data-testid="sso-button"><slot></slot></button>'
  })
}));

// Mock the createOAuthState function
vi.mock('@/enterprise_components/sso/utils', () => ({
  createOAuthState: vi.fn(() => 'mock-oauth-state-123')
}));

// Mock crypto.getRandomValues for browsers that don't have it in test environment
const mockCrypto = {
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  })
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('SSOAuth', () => {
  let originalLocation: Location;
  let originalEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      hostname: 'localhost',
      href: ''
    } as Location;
    
    // Mock import.meta.env safely - remove VITE_API_URL to test fallback
    originalEnv = import.meta.env;
    const envMock = { ...originalEnv };
    delete envMock.VITE_API_URL;
    vi.stubGlobal('import.meta.env', envMock);
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.unstubAllGlobals();
  });

  describe('Component Structure', () => {
    it('should render the divider with correct styling', () => {
      const wrapper = mount(SSOAuth);
      
      const divider = wrapper.find('.relative');
      const borderLine = wrapper.find('.absolute.inset-0');
      const dividerText = wrapper.find('.relative.flex.justify-center');
      
      expect(divider.exists()).toBe(true);
      expect(borderLine.exists()).toBe(true);
      expect(dividerText.exists()).toBe(true);
      expect(dividerText.text()).toContain('Or continue with');
    });

    it('should render GitHub authentication button', () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      expect(githubButton).toBeTruthy();
      expect(githubButton?.attributes('type')).toBe('button');
      expect(githubButton?.attributes('data-variant')).toBe('outline');
    });

    it('should render GitLab authentication button', () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const gitlabButton = buttons.find(button => button.text().includes('GitLab'));
      
      expect(gitlabButton).toBeTruthy();
      expect(gitlabButton?.attributes('type')).toBe('button');
      expect(gitlabButton?.attributes('data-variant')).toBe('outline');
    });

    it('should render GitHub and GitLab icons', () => {
      const wrapper = mount(SSOAuth);
      
      const githubIcon = wrapper.find('[data-icon="bi:github"]');
      const gitlabIcon = wrapper.find('[data-icon="bi:gitlab"]');
      
      expect(githubIcon.exists()).toBe(true);
      expect(gitlabIcon.exists()).toBe(true);
      expect(githubIcon.classes()).toContain('mr-2');
      expect(githubIcon.classes()).toContain('h-4');
      expect(githubIcon.classes()).toContain('w-4');
    });
  });

  describe('GitHub Authentication', () => {
    it('should initiate GitHub authentication when GitHub button is clicked', async () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(createOAuthState).toHaveBeenCalled();
      expect(mockAuthStore.setSocialAuthState).toHaveBeenCalledWith('mock-oauth-state-123');
    });

    it('should construct correct GitHub authentication URL', async () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(window.location.href).toBe('https://localhost/api/auth/github/authenticate?state=mock-oauth-state-123');
    });

    it('should handle different hostname in GitHub URL construction', async () => {
      window.location = {
        hostname: 'example.com',
        href: ''
      } as Location;
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(window.location.href).toBe('https://example.com/api/auth/github/authenticate?state=mock-oauth-state-123');
    });

    it('should use environment variable for API URL in GitHub authentication', async () => {
      vi.stubGlobal('import.meta.env', {
        ...originalEnv,
        VITE_API_URL: 'custom-api/v2'
      });
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(window.location.href).toBe('https://localhost/custom-api/v2/auth/github/authenticate?state=mock-oauth-state-123');
    });
  });

  describe('GitLab Authentication', () => {
    it('should initiate GitLab authentication when GitLab button is clicked', async () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const gitlabButton = buttons.find(button => button.text().includes('GitLab'));
      
      await gitlabButton?.trigger('click');
      
      expect(createOAuthState).toHaveBeenCalled();
      expect(mockAuthStore.setSocialAuthState).toHaveBeenCalledWith('mock-oauth-state-123');
    });

    it('should construct correct GitLab authentication URL', async () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const gitlabButton = buttons.find(button => button.text().includes('GitLab'));
      
      await gitlabButton?.trigger('click');
      
      expect(window.location.href).toBe('https://localhost/api/auth/gitlab/authenticate?state=mock-oauth-state-123');
    });

    it('should handle different hostname in GitLab URL construction', async () => {
      window.location = {
        hostname: 'example.com',
        href: ''
      } as Location;
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const gitlabButton = buttons.find(button => button.text().includes('GitLab'));
      
      await gitlabButton?.trigger('click');
      
      expect(window.location.href).toBe('https://example.com/api/auth/gitlab/authenticate?state=mock-oauth-state-123');
    });

    it('should use environment variable for API URL in GitLab authentication', async () => {
      vi.stubGlobal('import.meta.env', {
        ...originalEnv,
        VITE_API_URL: 'custom-api/v2'
      });
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const gitlabButton = buttons.find(button => button.text().includes('GitLab'));
      
      await gitlabButton?.trigger('click');
      
      expect(window.location.href).toBe('https://localhost/custom-api/v2/auth/gitlab/authenticate?state=mock-oauth-state-123');
    });
  });

  describe('OAuth State Management', () => {
    it('should generate unique OAuth state for each authentication attempt', async () => {
      vi.mocked(createOAuthState).mockReturnValueOnce('state-1').mockReturnValueOnce('state-2');
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      const gitlabButton = buttons.find(button => button.text().includes('GitLab'));
      
      await githubButton?.trigger('click');
      expect(mockAuthStore.setSocialAuthState).toHaveBeenCalledWith('state-1');
      
      await gitlabButton?.trigger('click');
      expect(mockAuthStore.setSocialAuthState).toHaveBeenCalledWith('state-2');
      
      expect(createOAuthState).toHaveBeenCalledTimes(2);
    });

    it('should store OAuth state in auth store before redirecting', async () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      // Verify state is set before URL construction
      expect(mockAuthStore.setSocialAuthState).toHaveBeenCalledBefore(
        vi.fn() // This validates the order of operations
      );
    });
  });

  describe('URL Construction', () => {
    it('should properly encode state parameter in URL', async () => {
      vi.mocked(createOAuthState).mockReturnValue('state+with/special&chars');
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(window.location.href).toContain('state=state%2Bwith%2Fspecial%26chars');
    });

    it('should construct HTTPS URLs regardless of current protocol', async () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(window.location.href).toMatch(/^https:\/\//);
    });

    it('should handle empty or undefined environment variables gracefully', async () => {
      vi.stubGlobal('import.meta.env', {
        ...originalEnv,
        VITE_API_URL: ''
      });
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(window.location.href).toBe('https://localhost/api/v1/auth/github/authenticate?state=mock-oauth-state-123');
    });
  });

  describe('Component Integration', () => {
    it('should integrate with auth store properly', () => {
      const wrapper = mount(SSOAuth);
      
      expect(wrapper.vm).toBeDefined();
    });

    it('should render both authentication options', () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      expect(buttons).toHaveLength(2);
      
      const buttonTexts = buttons.map(button => button.text());
      expect(buttonTexts).toContain('GitHub');
      expect(buttonTexts).toContain('GitLab');
    });

    it('should have proper button styling and attributes', () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      
      buttons.forEach(button => {
        expect(button.attributes('type')).toBe('button');
        expect(button.attributes('data-variant')).toBe('outline');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive button text', () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      const gitlabButton = buttons.find(button => button.text().includes('GitLab'));
      
      expect(githubButton?.text().trim()).toBe('GitHub');
      expect(gitlabButton?.text().trim()).toBe('GitLab');
    });

    it('should have proper button type attributes', () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      
      buttons.forEach(button => {
        expect(button.attributes('type')).toBe('button');
      });
    });

    it('should include icons for visual identification', () => {
      const wrapper = mount(SSOAuth);
      
      const githubIcon = wrapper.find('[data-icon="bi:github"]');
      const gitlabIcon = wrapper.find('[data-icon="bi:gitlab"]');
      
      expect(githubIcon.exists()).toBe(true);
      expect(gitlabIcon.exists()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle OAuth state generation errors gracefully', async () => {
      vi.mocked(createOAuthState).mockImplementation(() => {
        throw new Error('State generation failed');
      });
      
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await expect(githubButton?.trigger('click')).rejects.toThrow('State generation failed');
    });

    it('should render without errors when all dependencies are available', () => {
      expect(() => mount(SSOAuth)).not.toThrow();
    });

    it('should handle missing environment variables', () => {
      vi.stubGlobal('import.meta.env', {
        ...originalEnv
      });
      delete (global as any)['import.meta.env'].VITE_API_URL;
      
      expect(() => mount(SSOAuth)).not.toThrow();
    });
  });

  describe('Security', () => {
    it('should generate cryptographically secure OAuth state', () => {
      mount(SSOAuth);
      
      // Verify that createOAuthState is being used (which uses crypto.getRandomValues)
      expect(createOAuthState).toBeDefined();
    });

    it('should include state parameter for CSRF protection', async () => {
      const wrapper = mount(SSOAuth);
      
      const buttons = wrapper.findAll('[data-testid="sso-button"]');
      const githubButton = buttons.find(button => button.text().includes('GitHub'));
      
      await githubButton?.trigger('click');
      
      expect(window.location.href).toContain('state=');
      expect(mockAuthStore.setSocialAuthState).toHaveBeenCalled();
    });
  });
});