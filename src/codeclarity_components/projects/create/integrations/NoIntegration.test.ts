import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import NoIntegration from './NoIntegration.vue';

// Mock dependencies
vi.mock('@/codeclarity_components/organizations/organization.entity', () => ({
    MemberRole: {
        MEMBER: 'MEMBER',
        ADMIN: 'ADMIN',
        OWNER: 'OWNER'
    },
    isMemberRoleGreaterOrEqualTo: vi.fn((role: string, requiredRole: string) => {
        const roles = { MEMBER: 1, ADMIN: 2, OWNER: 3 };
        return roles[role as keyof typeof roles] >= roles[requiredRole as keyof typeof roles];
    })
}));

vi.mock('@/base_components', () => ({
    InfoCard: {
        name: 'InfoCard',
        template: '<div data-testid="info-card"><slot></slot></div>',
        props: ['title', 'description', 'icon', 'variant']
    }
}));

vi.mock('@/shadcn/ui/button/Button.vue', () => ({
    default: {
        name: 'Button',
        template: '<button data-testid="button"><slot></slot></button>',
        props: ['variant', 'asChild'],
        emits: ['click']
    }
}));

// Mock RouterLink
const MockRouterLink = {
    name: 'RouterLink',
    template: '<a data-testid="router-link"><slot></slot></a>',
    props: ['to', 'target']
};

describe('NoIntegration', () => {
    let wrapper: any;
    let router: any;
    const mockOrganization = {
        id: 'org-1',
        name: 'Test Organization',
        role: 'ADMIN'
    };

    beforeEach(() => {
        router = createRouter({
            history: createWebHistory(),
            routes: [
                {
                    path: '/orgs/:orgId/:page',
                    name: 'orgManage',
                    component: { template: '<div></div>' }
                }
            ]
        });
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: mockOrganization
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'InfoCard' }).exists()).toBe(true);
    });

    it('displays correct info card props', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: mockOrganization
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const infoCard = wrapper.findComponent({ name: 'InfoCard' });
        expect(infoCard.props().title).toBe('No VCS Integration Found');
        expect(infoCard.props().description).toBe(
            'Connect your version control system to start importing projects'
        );
        expect(infoCard.props().icon).toBe('solar:code-square-bold');
        expect(infoCard.props().variant).toBe('warning');
    });

    it('shows admin message for admin users', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: { ...mockOrganization, role: 'ADMIN' }
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.text()).toContain('To import projects, you need to add an integration');
        expect(wrapper.text()).toContain('Set up your integration and then refresh');
    });

    it('shows non-admin message for regular members', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: { ...mockOrganization, role: 'MEMBER' }
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.text()).toContain('Please ask an admin or organization owner');
    });

    it('shows manage integrations button for admin users', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: { ...mockOrganization, role: 'ADMIN' }
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const manageButton = wrapper.find('[data-testid="router-link"]');
        expect(manageButton.exists()).toBe(true);
        expect(manageButton.text()).toContain('Manage Integrations');
    });

    it('hides manage integrations button for regular members', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: { ...mockOrganization, role: 'MEMBER' }
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const routerLinks = wrapper.findAll('[data-testid="router-link"]');
        const manageLink = routerLinks.find((link) => link.text().includes('Manage Integrations'));
        expect(manageLink).toBeFalsy();
    });

    it('emits refresh event when refresh button clicked', async () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: mockOrganization
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const refreshButton = wrapper.findAll('[data-testid="button"]')[0];
        await refreshButton.trigger('click');

        expect(wrapper.emitted('onRefresh')).toBeTruthy();
    });

    it('has correct router link configuration for manage integrations', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: { ...mockOrganization, role: 'ADMIN' }
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const routerLink = wrapper.findComponent({ name: 'RouterLink' });
        expect(routerLink.props().to).toEqual({
            name: 'orgManage',
            params: { orgId: 'org-1', page: 'integrations' }
        });
        expect(routerLink.props().target).toBe('_blank');
    });

    it('displays all action buttons', () => {
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: { ...mockOrganization, role: 'ADMIN' }
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const buttons = wrapper.findAllComponents({ name: 'Button' });
        expect(buttons.length).toBeGreaterThanOrEqual(2); // Refresh and Go Back buttons at minimum

        // Check for refresh button
        const refreshButton = buttons.find((button) => button.text().includes('Refresh'));
        expect(refreshButton).toBeTruthy();

        // Check for go back button
        const goBackButton = buttons.find((button) => button.text().includes('Go Back'));
        expect(goBackButton).toBeTruthy();
    });

    it('handles go back button click', async () => {
        const mockRouterBack = vi.fn();
        wrapper = mount(NoIntegration, {
            props: {
                defaultOrg: mockOrganization
            },
            global: {
                plugins: [router],
                components: {
                    RouterLink: MockRouterLink
                },
                mocks: {
                    $router: { back: mockRouterBack }
                }
            }
        });

        const buttons = wrapper.findAllComponents({ name: 'Button' });
        const goBackButton = buttons.find((button) => button.text().includes('Go Back'));

        if (goBackButton) {
            await goBackButton.trigger('click');
            expect(mockRouterBack).toHaveBeenCalled();
        }
    });

    it('validates required props', () => {
        expect(() => {
            mount(NoIntegration, {
                global: {
                    plugins: [router],
                    components: {
                        RouterLink: MockRouterLink
                    }
                }
            });
        }).toThrow();
    });
});
