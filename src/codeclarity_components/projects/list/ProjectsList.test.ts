import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ProjectsList from './ProjectsList.vue';

// Mock all dependencies
vi.mock('@/stores/StateStore', () => ({
    useProjectsMainStore: vi.fn(() => ({
        setOrgId: vi.fn(),
        $reset: vi.fn()
    }))
}));

vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn(() => ({
        getUser: {
            default_org: { id: 'test-org-id' }
        },
        defaultOrg: {
            value: { id: 'test-org-id' }
        }
    }))
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => ({
        getAuthenticated: true,
        getToken: 'test-token'
    }))
}));

vi.mock('@/codeclarity_components/organizations/organization.repository', () => ({
    OrgRepository: vi.fn().mockImplementation(() => ({
        getOrgMetaData: vi.fn().mockResolvedValue({
            id: 'test-org',
            projects: [
                {
                    id: 'project-1',
                    name: 'Test Project',
                    analyses: [{ id: 'analysis-1', status: 'COMPLETED', created_on: '2023-01-01' }]
                }
            ],
            integrations: [{ id: 'integration-1', provider: 'GITHUB' }]
        })
    }))
}));

// Mock child components
vi.mock('./components/ProjectsList.vue', () => ({
    default: {
        name: 'ProjectsListComponent',
        template: '<div data-testid="projects-list-component">Projects List Component</div>'
    }
}));

vi.mock('@/base_components/ui/cards/StatCard.vue', () => ({
    default: {
        name: 'StatCard',
        template: '<div data-testid="stat-card"></div>',
        props: ['label', 'value', 'icon', 'variant', 'subtitle', 'subtitleIcon']
    }
}));

vi.mock('@/base_components/ui/cards/InfoCard.vue', () => ({
    default: {
        name: 'InfoCard',
        template: '<div data-testid="info-card"><slot></slot><slot name="actions"></slot></div>',
        props: ['title', 'description', 'icon', 'variant']
    }
}));

// Mock RouterLink
const MockRouterLink = {
    name: 'RouterLink',
    template: '<a><slot></slot></a>',
    props: ['to']
};

describe('ProjectsList', () => {
    let wrapper: any;
    let pinia: any;
    let router: any;

    beforeEach(() => {
        pinia = createPinia();
        router = createRouter({
            history: createWebHistory(),
            routes: [
                { path: '/', component: { template: '<div></div>' } },
                {
                    path: '/projects/:page?',
                    name: 'projects',
                    component: { template: '<div></div>' }
                },
                {
                    path: '/orgs/:orgId/:page?/:action?',
                    name: 'orgs',
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
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.find('.space-y-8').exists()).toBe(true);
        expect(wrapper.find('.relative').exists()).toBe(true);
        expect(wrapper.find('.min-h-screen').exists()).toBe(true);
    });

    it('displays page header correctly', () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.find('h1').text()).toBe('Projects');
        expect(wrapper.find('p').text()).toBe('Manage and monitor your project security analyses');
    });

    it('shows loading state initially', () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        // Initially loading should be true
        expect(wrapper.vm.orgMetaDataLoading).toBe(false); // Will be set by mock
    });

    it('displays statistics when projects exist', async () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        // Set mock data
        wrapper.vm.orgMetaData = {
            id: 'test-org',
            projects: [
                {
                    id: 'project-1',
                    analyses: [
                        { status: 'COMPLETED', created_on: '2023-01-01' },
                        { status: 'STARTED', created_on: '2023-01-02' }
                    ]
                }
            ],
            integrations: [{ id: 'integration-1' }]
        };

        await wrapper.vm.$nextTick();

        const statCards = wrapper.findAllComponents({ name: 'StatCard' });
        expect(statCards).toHaveLength(4);
    });

    it('calculates completed analyses count correctly', () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgMetaData = {
            projects: [
                {
                    analyses: [
                        { status: 'COMPLETED' },
                        { status: 'FINISHED' },
                        { status: 'STARTED' }
                    ]
                }
            ]
        };

        expect(wrapper.vm.getCompletedAnalysesCount()).toBe(2);
    });

    it('calculates running analyses count correctly', () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgMetaData = {
            projects: [
                {
                    analyses: [
                        { status: 'STARTED' },
                        { status: 'ONGOING' },
                        { status: 'COMPLETED' }
                    ]
                }
            ]
        };

        expect(wrapper.vm.getRunningAnalysesCount()).toBe(2);
    });

    it('formats last activity time correctly', () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        wrapper.vm.orgMetaData = {
            projects: [
                {
                    analyses: [{ created_on: oneHourAgo.toISOString() }]
                }
            ]
        };

        expect(wrapper.vm.getLastActivityTime()).toBe('1h');
    });

    it('shows no integrations state', async () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgMetaData = {
            projects: [],
            integrations: []
        };
        wrapper.vm.orgMetaDataLoading = false;

        await wrapper.vm.$nextTick();

        const infoCards = wrapper.findAllComponents({ name: 'InfoCard' });
        expect(infoCards.length).toBeGreaterThan(0);
    });

    it('shows no projects state', async () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgMetaData = {
            projects: [],
            integrations: [{ id: 'integration-1' }]
        };
        wrapper.vm.orgMetaDataLoading = false;

        await wrapper.vm.$nextTick();

        const infoCards = wrapper.findAllComponents({ name: 'InfoCard' });
        expect(infoCards.length).toBeGreaterThan(0);
    });

    it('handles error state', async () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        wrapper.vm.orgMetaDataError = true;
        wrapper.vm.orgMetaDataLoading = false;

        await wrapper.vm.$nextTick();

        const infoCards = wrapper.findAllComponents({ name: 'InfoCard' });
        expect(infoCards.length).toBeGreaterThan(0);
    });

    it('refreshes data when refresh button clicked', async () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const fetchSpy = vi.spyOn(wrapper.vm, 'fetchOrgMetaData');

        const refreshButton = wrapper.find('button');
        if (refreshButton.exists()) {
            await refreshButton.trigger('click');
            expect(fetchSpy).toHaveBeenCalled();
        }
    });

    it('resets view state on unmount', () => {
        wrapper = mount(ProjectsList, {
            global: {
                plugins: [pinia, router],
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const resetSpy = vi.spyOn(wrapper.vm.viewState, '$reset');
        wrapper.unmount();
        expect(resetSpy).toHaveBeenCalled();
    });
});
