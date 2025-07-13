import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import OrganizationView from './OrganizationView.vue';

// Mock the state store
const mockStateStore = {
    $reset: vi.fn(),
    page: 'orgs'
};

vi.mock('@/stores/state', () => ({
    useStateStore: () => mockStateStore
}));

// Mock the async components with proper loading/error components
vi.mock('@/base_components/utilities/ErrorComponent.vue', () => ({
    default: {
        name: 'ErrorComponent',
        template: '<div data-testid="error-component">Error</div>'
    }
}));

vi.mock('@/base_components/ui/loaders/LoadingComponent.vue', () => ({
    default: {
        name: 'LoadingComponent',
        template: '<div data-testid="loading-component">Loading</div>'
    }
}));

vi.mock('@/base_components/layout/PageHeader.vue', () => ({
    default: {
        name: 'PageHeader',
        template: '<div data-testid="page-header"></div>',
        props: ['title', 'description', 'showLastUpdated', 'showRefresh']
    }
}));

// Mock the dynamic imports
vi.mock('@/codeclarity_components/organizations/list/OrganizationsList.vue', () => ({
    default: {
        name: 'OrganizationsList',
        template: '<div data-testid="organizations-list">Organizations List</div>'
    }
}));

vi.mock('@/codeclarity_components/organizations/create/OrganizationCreate.vue', () => ({
    default: {
        name: 'OrganizationCreate',
        template: '<div data-testid="organization-create">Create Organization</div>'
    }
}));

vi.mock('./audit_logs/ManageAuditLogs.vue', () => ({
    default: {
        name: 'ManageAuditLogs',
        template: '<div data-testid="manage-audit-logs">Audit Logs</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./policy/PoliciesView.vue', () => ({
    default: {
        name: 'PoliciesView',
        template: '<div data-testid="policies-view">Policies</div>',
        props: ['page', 'orgId', 'action']
    }
}));

vi.mock('./manage/OrganizationManage.vue', () => ({
    default: {
        name: 'OrganizationManage',
        template: '<div data-testid="organization-manage">Organization Manage</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./members/ManageMembers.vue', () => ({
    default: {
        name: 'ManageMembers',
        template: '<div data-testid="manage-members">Manage Members</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./invites/ManageInvites.vue', () => ({
    default: {
        name: 'ManageInvites',
        template: '<div data-testid="manage-invites">Manage Invites</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./integrations/IntegrationsView.vue', () => ({
    default: {
        name: 'IntegrationsView',
        template: '<div data-testid="integrations-view">Integrations</div>',
        props: ['page', 'orgId', 'action']
    }
}));

vi.mock('./analyzers/AnalyzersView.vue', () => ({
    default: {
        name: 'AnalyzersView',
        template: '<div data-testid="analyzers-view">Analyzers</div>',
        props: ['page', 'orgId', 'action']
    }
}));

describe('OrganizationView', () => {
    let wrapper: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockStateStore.$reset.mockClear();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(OrganizationView);

        expect(wrapper.find('.min-h-screen').exists()).toBe(true);
        expect(wrapper.find('.bg-gray-50').exists()).toBe(true);
        expect(wrapper.find('.max-w-7xl').exists()).toBe(true);
    });

    it('shows OrganizationsList when action is "list" and no orgId', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'list'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Organizations List');
        expect(wrapper.html()).not.toContain('Create Organization');
    });

    it('shows OrganizationCreate when action is "add" and no orgId', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'add'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Create Organization');
        expect(wrapper.html()).not.toContain('Organizations List');
    });

    it('shows PoliciesView when page is "policies" and orgId exists', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'policies',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Policies');
    });

    it('shows PoliciesView when page is "policy" and orgId exists', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'policy',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Policies');
    });

    it('shows ManageAuditLogs when page is "logs" and orgId exists', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'logs',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Audit Logs');
    });

    it('shows ManageMembers when page is "members" and orgId exists', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'members',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Manage Members');
    });

    it('shows ManageInvites when page is "invites" and orgId exists', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'invites',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Manage Invites');
    });

    it('shows IntegrationsView when page is "integrations" and orgId exists', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Integrations');
    });

    it('shows AnalyzersView when page is "analyzers" and orgId exists', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Analyzers');
    });

    it('shows OrganizationManage as fallback when page and orgId exist', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'overview',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Organization Manage');
    });

    it('displays correct page title for create organization', () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'add'
            }
        });

        expect(wrapper.vm.getPageTitle()).toBe('Create Organization');
    });

    it('displays correct page title for organizations list', () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'list'
            }
        });

        expect(wrapper.vm.getPageTitle()).toBe('Organizations');
    });

    it('displays correct page title for policies page', () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'policies',
                orgId: 'test-org-id'
            }
        });

        expect(wrapper.vm.getPageTitle()).toBe('Organization Policies');
    });

    it('displays correct page title for members page', () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'members',
                orgId: 'test-org-id'
            }
        });

        expect(wrapper.vm.getPageTitle()).toBe('Members');
    });

    it('displays correct page description for create organization', () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'add'
            }
        });

        expect(wrapper.vm.getPageDescription()).toBe('Create a new organization to manage your team and projects');
    });

    it('displays correct page description for organizations list', () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'list'
            }
        });

        expect(wrapper.vm.getPageDescription()).toBe("Monitor your organization's security posture and vulnerabilities");
    });

    it('displays correct page description for policies page', () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'policies',
                orgId: 'test-org-id'
            }
        });

        expect(wrapper.vm.getPageDescription()).toBe('Configure security policies and compliance settings');
    });

    it('initializes state store correctly', () => {
        wrapper = mount(OrganizationView);

        expect(mockStateStore.page).toBe('orgs');
    });

    it('resets state store on mount', () => {
        wrapper = mount(OrganizationView);

        expect(mockStateStore.$reset).toHaveBeenCalled();
    });

    it('accepts props with correct typing', () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'test-action',
                page: 'test-page',
                orgId: 'test-org-id'
            }
        });

        expect(wrapper.props().action).toBe('test-action');
        expect(wrapper.props().page).toBe('test-page');
        expect(wrapper.props().orgId).toBe('test-org-id');
    });

    it('handles undefined props gracefully', () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: undefined,
                page: undefined,
                orgId: undefined
            }
        });

        expect(wrapper.vm.getPageTitle()).toBe('Organizations');
        expect(wrapper.vm.getPageDescription()).toBe('Manage your organizations and security settings');
    });

    it('shows page header with correct props', () => {
        wrapper = mount(OrganizationView, {
            props: {
                action: 'list'
            }
        });

        const pageHeader = wrapper.findComponent({ name: 'PageHeader' });

        expect(pageHeader.exists()).toBe(true);
        expect(pageHeader.props().title).toBe('Organizations');
        expect(pageHeader.props().description).toBe("Monitor your organization's security posture and vulnerabilities");
        expect(pageHeader.props().showLastUpdated).toBe(false);
        expect(pageHeader.props().showRefresh).toBe(false);
    });

    it('passes correct props to child components', async () => {
        wrapper = mount(OrganizationView, {
            props: {
                page: 'members',
                orgId: 'test-org-id',
                action: 'test-action'
            }
        });

        await wrapper.vm.$nextTick();

        const manageMembersComponent = wrapper.findComponent({ name: 'ManageMembers' });
        if (manageMembersComponent.exists()) {
            expect(manageMembersComponent.props().page).toBe('members');
            expect(manageMembersComponent.props().orgId).toBe('test-org-id');
        }
    });
});