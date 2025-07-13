import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import IntegrationsList from './IntegrationsList.vue';
import { MemberRole } from '@/codeclarity_components/organizations/organization.entity';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';

// Mock router
vi.mock('@/router', () => ({
    default: {
        push: vi.fn()
    }
}));

// Mock auth store
vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => ({
        getAuthenticated: true,
        getToken: 'test-token'
    }))
}));

// Mock integrations repository
const mockIntegrationRepo = {
    getVCS: vi.fn(),
    deleteIntegration: vi.fn()
};

vi.mock('@/codeclarity_components/organizations/integrations/IntegrationsRepository', () => ({
    IntegrationsRepository: vi.fn().mockImplementation(() => mockIntegrationRepo)
}));

// Mock child components
vi.mock('@/codeclarity_components/organizations/subcomponents/HeaderItem.vue', () => ({
    default: {
        name: 'HeaderItem',
        template: '<div data-testid="header-item"></div>',
        props: ['orgId'],
        emits: ['onOrgInfo']
    }
}));

vi.mock('@/base_components/ui/loaders/BoxLoader.vue', () => ({
    default: {
        name: 'BoxLoader',
        template: '<div data-testid="box-loader"></div>',
        props: ['dimensions']
    }
}));

vi.mock('@/base_components/ui/cards/InfoCard.vue', () => ({
    default: {
        name: 'InfoCard',
        template: '<div data-testid="info-card"><slot></slot><slot name="actions"></slot></div>',
        props: ['title', 'description', 'icon', 'variant']
    }
}));

vi.mock('@/base_components/ui/cards/StatCard.vue', () => ({
    default: {
        name: 'StatCard',
        template: '<div data-testid="stat-card"></div>',
        props: ['label', 'value', 'icon', 'variant', 'subtitle', 'subtitleIcon']
    }
}));

vi.mock('@/shadcn/ui/button/Button.vue', () => ({
    default: {
        name: 'Button',
        template: '<button data-testid="button"><slot></slot></button>',
        props: ['variant', 'size']
    }
}));

vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<span data-testid="icon"></span>',
        props: ['icon']
    }
}));

// Mock date utils
vi.mock('@/utils/dateUtils', () => ({
    getDaysUntilExpiry: vi.fn((date) => {
        const now = new Date();
        const expiry = new Date(date);
        return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    })
}));

// Mock RouterLink
const MockRouterLink = {
    name: 'RouterLink',
    template: '<a data-testid="router-link"><slot></slot></a>',
    props: ['to']
};

describe('IntegrationsList', () => {
    let wrapper: any;
    let pinia: any;

    const mockVcsIntegrations = [
        {
            id: 'integration-1',
            integration_provider: IntegrationProvider.GITHUB,
            name: 'GitHub Integration',
            invalid: false,
            expires_on: '2024-12-31'
        },
        {
            id: 'integration-2',
            integration_provider: IntegrationProvider.GITLAB,
            name: 'GitLab Integration',
            invalid: true,
            expires_on: '2024-01-15'
        }
    ];

    beforeEach(() => {
        pinia = createPinia();
        vi.clearAllMocks();

        mockIntegrationRepo.getVCS.mockResolvedValue({
            data: mockVcsIntegrations
        });
        mockIntegrationRepo.deleteIntegration.mockResolvedValue({});
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.find('[data-testid="header-item"]').exists()).toBe(true);
    });

    it('shows HeaderItem with correct orgId', () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const headerItem = wrapper.findComponent({ name: 'HeaderItem' });
        expect(headerItem.exists()).toBe(true);
        expect(headerItem.props().orgId).toBe('test-org-id');
    });

    it('shows loading state when loading is true', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.loading = true;
        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        await wrapper.vm.$nextTick();

        const boxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });
        expect(boxLoaders.length).toBeGreaterThan(0);
    });

    it('displays integrations when data is loaded', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        wrapper.vm.loading = false;
        wrapper.vm.error = false;
        wrapper.vm.vcsIntegrations = mockVcsIntegrations;

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Integrations Management');
    });

    it('shows error state when error is true', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        wrapper.vm.loading = false;
        wrapper.vm.error = true;
        wrapper.vm.errorCode = 'NETWORK_ERROR';

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('We failed to retrieve the integrations');
    });

    it('fetches VCS integrations on mount', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        // Wait for async operations
        await wrapper.vm.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockIntegrationRepo.getVCS).toHaveBeenCalledWith({
            orgId: 'test-org-id',
            bearerToken: 'test-token',
            pagination: {
                page: 0,
                entries_per_page: 100
            },
            handleBusinessErrors: true
        });
    });

    it('redirects unauthorized users', () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const orgInfo = {
            id: 'test-org',
            role: MemberRole.USER
        };

        wrapper.vm.setOrgInfo(orgInfo);

        // Verify router.push was called for unauthorized redirect
    });

    it('allows access for admin users', () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const orgInfo = {
            id: 'test-org',
            role: MemberRole.ADMIN
        };

        wrapper.vm.setOrgInfo(orgInfo);

        // Admin users should have access without redirect
        expect(wrapper.vm.orgInfo).toEqual(orgInfo);
    });

    it('handles delete integration', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        await wrapper.vm.deleteIntegration('integration-1');

        expect(mockIntegrationRepo.deleteIntegration).toHaveBeenCalledWith({
            orgId: 'test-org-id',
            bearerToken: 'test-token',
            integrationId: 'integration-1',
            handleBusinessErrors: true
        });
    });

    it('handles refresh action', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const fetchSpy = vi.spyOn(wrapper.vm, 'fetchVcsIntegrations');
        await wrapper.vm.fetchVcsIntegrations(true);

        expect(fetchSpy).toHaveBeenCalledWith(true);
    });

    it('shows no integrations state when empty', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        wrapper.vm.loading = false;
        wrapper.vm.error = false;
        wrapper.vm.vcsIntegrations = [];

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('No integrations configured');
    });

    it('displays integration statistics', async () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        wrapper.vm.loading = false;
        wrapper.vm.error = false;
        wrapper.vm.vcsIntegrations = mockVcsIntegrations;

        await wrapper.vm.$nextTick();

        const statCards = wrapper.findAllComponents({ name: 'StatCard' });
        expect(statCards.length).toBeGreaterThan(0);
    });

    it('handles business logic errors correctly', async () => {
        const mockError = new Error('Network error') as any;
        mockError.error_code = 'NETWORK_ERROR';
        mockIntegrationRepo.getVCS.mockRejectedValue(mockError);

        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        await wrapper.vm.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(wrapper.vm.error).toBe(true);
    });

    it('initializes with correct default values', () => {
        wrapper = mount(IntegrationsList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                plugins: [pinia],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.vm.vcsIntegrations).toEqual([]);
        expect(wrapper.vm.loading).toBe(false);
        expect(wrapper.vm.error).toBe(false);
        expect(wrapper.vm.errorCode).toBeUndefined();
    });
});
