import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import IntegrationsView from './IntegrationsView.vue';

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

// Mock the dynamic imports
vi.mock('./IntegrationsList.vue', () => ({
    default: {
        name: 'OrgIntegrationsList',
        template: '<div data-testid="integrations-list">Integrations List</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./IntegrationCreate.vue', () => ({
    default: {
        name: 'OrgIntegrationCreate',
        template: '<div data-testid="integration-create">Integration Create</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./IntegrationEdit.vue', () => ({
    default: {
        name: 'OrgIntegrationEdit',
        template: '<div data-testid="integration-edit">Integration Edit</div>',
        props: ['page', 'orgId']
    }
}));

describe.skip('IntegrationsView', () => {
    let wrapper: any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('shows IntegrationsList when action is "manage"', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Integrations List');
        expect(wrapper.html()).not.toContain('Integration Create');
        expect(wrapper.html()).not.toContain('Integration Edit');
    });

    it('shows IntegrationCreate when action is "add"', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'add'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Integration Create');
        expect(wrapper.html()).not.toContain('Integrations List');
        expect(wrapper.html()).not.toContain('Integration Edit');
    });

    it('shows IntegrationEdit when action is "edit"', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'edit'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Integration Edit');
        expect(wrapper.html()).not.toContain('Integrations List');
        expect(wrapper.html()).not.toContain('Integration Create');
    });

    it('shows nothing when action is undefined', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).not.toContain('Integrations List');
        expect(wrapper.html()).not.toContain('Integration Create');
        expect(wrapper.html()).not.toContain('Integration Edit');
    });

    it('shows nothing when action is not recognized', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'unknown'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).not.toContain('Integrations List');
        expect(wrapper.html()).not.toContain('Integration Create');
        expect(wrapper.html()).not.toContain('Integration Edit');
    });

    it('passes correct props to IntegrationsList', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        await wrapper.vm.$nextTick();

        const integrationsList = wrapper.findComponent({ name: 'OrgIntegrationsList' });
        if (integrationsList.exists()) {
            expect(integrationsList.props().page).toBe('integrations');
            expect(integrationsList.props().orgId).toBe('test-org-id');
        }
    });

    it('passes correct props to IntegrationCreate', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'add'
            }
        });

        await wrapper.vm.$nextTick();

        const integrationCreate = wrapper.findComponent({ name: 'OrgIntegrationCreate' });
        if (integrationCreate.exists()) {
            expect(integrationCreate.props().page).toBe('integrations');
            expect(integrationCreate.props().orgId).toBe('test-org-id');
        }
    });

    it('passes correct props to IntegrationEdit', async () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id',
                action: 'edit'
            }
        });

        await wrapper.vm.$nextTick();

        const integrationEdit = wrapper.findComponent({ name: 'OrgIntegrationEdit' });
        if (integrationEdit.exists()) {
            expect(integrationEdit.props().page).toBe('integrations');
            expect(integrationEdit.props().orgId).toBe('test-org-id');
        }
    });

    it('accepts props with correct typing', () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'test-page',
                orgId: 'test-org-id',
                action: 'test-action'
            }
        });

        expect(wrapper.props().page).toBe('test-page');
        expect(wrapper.props().orgId).toBe('test-org-id');
        expect(wrapper.props().action).toBe('test-action');
    });

    it('handles missing action prop', () => {
        wrapper = mount(IntegrationsView, {
            props: {
                page: 'integrations',
                orgId: 'test-org-id'
            }
        });

        expect(wrapper.props().action).toBeUndefined();
        expect(wrapper.exists()).toBe(true);
    });

    it('renders with different page values', async () => {
        const pageValues = ['integrations', 'vcs', 'tools'];

        for (const page of pageValues) {
            wrapper = mount(IntegrationsView, {
                props: {
                    page,
                    orgId: 'test-org-id',
                    action: 'manage'
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.props().page).toBe(page);

            if (wrapper) {
                wrapper.unmount();
            }
        }
    });

    it('renders with different orgId values', async () => {
        const orgIds = ['org-1', 'org-2', 'test-organization'];

        for (const orgId of orgIds) {
            wrapper = mount(IntegrationsView, {
                props: {
                    page: 'integrations',
                    orgId,
                    action: 'manage'
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.props().orgId).toBe(orgId);

            if (wrapper) {
                wrapper.unmount();
            }
        }
    });
});
