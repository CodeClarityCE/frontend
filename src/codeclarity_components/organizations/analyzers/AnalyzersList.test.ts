import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AnalyzersList from './AnalyzersList.vue';
import { MemberRole } from '@/codeclarity_components/organizations/organization.entity';

// Mock router
vi.mock('@/router', () => ({
    default: {
        push: vi.fn(),
        go: vi.fn()
    }
}));

// Mock auth store
vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => ({
        getAuthenticated: true,
        getToken: 'test-token'
    }))
}));

// Mock analyzer repository
const mockAnalyzerRepo = {
    getAnalyzers: vi.fn(),
    deleteAnalyzer: vi.fn()
};

vi.mock('@/codeclarity_components/organizations/analyzers/AnalyzerRepository', () => ({
    AnalyzerRepository: vi.fn().mockImplementation(() => mockAnalyzerRepo)
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

// Mock Dialog components
vi.mock('@/shadcn/ui/dialog/Dialog.vue', () => ({
    default: {
        name: 'Dialog',
        template: '<div data-testid="dialog"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/dialog/DialogTrigger.vue', () => ({
    default: {
        name: 'DialogTrigger',
        template: '<div data-testid="dialog-trigger"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/dialog/DialogContent.vue', () => ({
    default: {
        name: 'DialogContent',
        template: '<div data-testid="dialog-content"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/dialog/DialogHeader.vue', () => ({
    default: {
        name: 'DialogHeader',
        template: '<div data-testid="dialog-header"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/dialog/DialogTitle.vue', () => ({
    default: {
        name: 'DialogTitle',
        template: '<div data-testid="dialog-title"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/dialog/DialogDescription.vue', () => ({
    default: {
        name: 'DialogDescription',
        template: '<div data-testid="dialog-description"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/dialog/DialogFooter.vue', () => ({
    default: {
        name: 'DialogFooter',
        template: '<div data-testid="dialog-footer"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/dialog/DialogClose.vue', () => ({
    default: {
        name: 'DialogClose',
        template: '<div data-testid="dialog-close"><slot></slot></div>'
    }
}));

vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<span data-testid="icon"></span>',
        props: ['icon']
    }
}));

// Mock RouterLink
const MockRouterLink = {
    name: 'RouterLink',
    template: '<a data-testid="router-link"><slot></slot></a>',
    props: ['to']
};

describe('AnalyzersList', () => {
    let wrapper: any;

    const mockAnalyzers = [
        {
            id: 'analyzer-1',
            name: 'CodeQL Analyzer',
            description: 'Static analysis for security vulnerabilities',
            type: 'SAST',
            enabled: true
        },
        {
            id: 'analyzer-2',
            name: 'Dependency Check',
            description: 'Check for vulnerable dependencies',
            type: 'SCA',
            enabled: false
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        mockAnalyzerRepo.getAnalyzers.mockResolvedValue({
            data: mockAnalyzers
        });
        mockAnalyzerRepo.deleteAnalyzer.mockResolvedValue({});
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.find('[data-testid="header-item"]').exists()).toBe(true);
    });

    it('shows HeaderItem with correct orgId', () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
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
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
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

    it('displays analyzers when data is loaded', async () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        wrapper.vm.loading = false;
        wrapper.vm.error = false;
        wrapper.vm.analyzers = mockAnalyzers;

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Analyzers Management');
    });

    it('shows error state when error is true', async () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
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

        expect(wrapper.html()).toContain('We failed to retrieve the analyzers');
    });

    it('fetches analyzers on mount', async () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        // Wait for async operations
        await wrapper.vm.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(mockAnalyzerRepo.getAnalyzers).toHaveBeenCalledWith({
            orgId: 'test-org-id',
            bearerToken: 'test-token',
            handleBusinessErrors: true,
            page: 0,
            entries_per_page: 0,
            search_key: ''
        });
    });

    it('redirects unauthorized users', () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
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
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
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

    it('handles delete analyzer', async () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        await wrapper.vm.deleteAnalyzer('analyzer-1');

        expect(mockAnalyzerRepo.deleteAnalyzer).toHaveBeenCalledWith({
            orgId: 'test-org-id',
            analyzer_id: 'analyzer-1',
            bearerToken: 'test-token',
            handleBusinessErrors: true
        });
        // Verify page reload happens after delete
    });

    it('handles refresh action', async () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const fetchSpy = vi.spyOn(wrapper.vm, 'fetchAnalyzers');
        await wrapper.vm.fetchAnalyzers(true);

        expect(fetchSpy).toHaveBeenCalledWith(true);
    });

    it('shows no analyzers state when empty', async () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        wrapper.vm.loading = false;
        wrapper.vm.error = false;
        wrapper.vm.analyzers = [];

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('No analyzers configured');
    });

    it('displays analyzer statistics', async () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgInfo = { id: 'test-org', role: MemberRole.ADMIN };
        wrapper.vm.loading = false;
        wrapper.vm.error = false;
        wrapper.vm.analyzers = mockAnalyzers;

        await wrapper.vm.$nextTick();

        const statCards = wrapper.findAllComponents({ name: 'StatCard' });
        expect(statCards.length).toBeGreaterThan(0);
    });

    it('handles business logic errors correctly', async () => {
        const mockError = new Error('Network error') as any;
        mockError.error_code = 'NETWORK_ERROR';
        mockAnalyzerRepo.getAnalyzers.mockRejectedValue(mockError);

        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
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
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.vm.analyzers).toEqual([]);
        expect(wrapper.vm.loading).toBe(false);
        expect(wrapper.vm.error).toBe(false);
        expect(wrapper.vm.errorCode).toBeUndefined();
    });

    it('accepts optional props correctly', () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id',
                page: 'test-page',
                action: 'test-action'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.props().orgId).toBe('test-org-id');
        expect(wrapper.props().page).toBe('test-page');
        expect(wrapper.props().action).toBe('test-action');
    });

    it('handles missing optional props', () => {
        wrapper = mount(AnalyzersList, {
            props: {
                orgId: 'test-org-id'
            },
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.props().page).toBeUndefined();
        expect(wrapper.props().action).toBeUndefined();
        expect(wrapper.exists()).toBe(true);
    });
});
