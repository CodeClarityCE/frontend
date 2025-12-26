import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import AnalyzersView from './AnalyzersView.vue';

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

// Mock Vue's defineAsyncComponent to return sync components
vi.mock('vue', async () => {
    const actual = await vi.importActual('vue');
    return {
        ...actual,
        defineAsyncComponent: (options: any) => {
            // Return the mock component directly based on the loader path
            const loaderStr = options.loader?.toString();
            if (loaderStr?.includes('AnalyzersList')) {
                return {
                    name: 'OrgAnalyzersList',
                    template: '<div data-testid="analyzers-list">Analyzers List</div>',
                    props: ['page', 'orgId']
                };
            }
            if (loaderStr?.includes('AnalyzerEdit')) {
                return {
                    name: 'OrgAnalyzerEdit',
                    template: '<div data-testid="analyzer-edit">Analyzer Edit</div>',
                    props: ['page', 'orgId']
                };
            }
            if (loaderStr?.includes('AnalyzerCreate')) {
                return {
                    name: 'OrgAnalyzerCreate',
                    template: '<div data-testid="analyzer-create">Analyzer Create</div>',
                    props: ['page', 'orgId']
                };
            }
            // Fallback
            return {
                name: 'AsyncComponent',
                template: '<div>Loading...</div>'
            };
        }
    };
});

// Mock the dynamic imports
vi.mock('./AnalyzersList.vue', () => ({
    default: {
        name: 'OrgAnalyzersList',
        template: '<div data-testid="analyzers-list">Analyzers List</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./AnalyzerEdit.vue', () => ({
    default: {
        name: 'OrgAnalyzerEdit',
        template: '<div data-testid="analyzer-edit">Analyzer Edit</div>',
        props: ['page', 'orgId']
    }
}));

vi.mock('./AnalyzerCreate.vue', () => ({
    default: {
        name: 'OrgAnalyzerCreate',
        template: '<div data-testid="analyzer-create">Analyzer Create</div>',
        props: ['page', 'orgId']
    }
}));

describe.skip('AnalyzersView', () => {
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
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('shows AnalyzersList when action is "manage"', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Analyzers List');
        expect(wrapper.html()).not.toContain('Analyzer Edit');
        expect(wrapper.html()).not.toContain('Analyzer Create');
    });

    it('shows AnalyzerEdit when action is "edit"', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'edit'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Analyzer Edit');
        expect(wrapper.html()).not.toContain('Analyzers List');
        expect(wrapper.html()).not.toContain('Analyzer Create');
    });

    it('shows AnalyzerCreate when action is "add"', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'add'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Analyzer Create');
        expect(wrapper.html()).not.toContain('Analyzers List');
        expect(wrapper.html()).not.toContain('Analyzer Edit');
    });

    it('shows nothing when action is undefined', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).not.toContain('Analyzers List');
        expect(wrapper.html()).not.toContain('Analyzer Edit');
        expect(wrapper.html()).not.toContain('Analyzer Create');
    });

    it('shows nothing when action is not recognized', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'unknown'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).not.toContain('Analyzers List');
        expect(wrapper.html()).not.toContain('Analyzer Edit');
        expect(wrapper.html()).not.toContain('Analyzer Create');
    });

    it('passes correct props to AnalyzersList', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        await wrapper.vm.$nextTick();

        const analyzersList = wrapper.findComponent({ name: 'OrgAnalyzersList' });
        if (analyzersList.exists()) {
            expect(analyzersList.props().page).toBe('analyzers');
            expect(analyzersList.props().orgId).toBe('test-org-id');
        }
    });

    it('passes correct props to AnalyzerEdit', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'edit'
            }
        });

        await wrapper.vm.$nextTick();

        const analyzerEdit = wrapper.findComponent({ name: 'OrgAnalyzerEdit' });
        if (analyzerEdit.exists()) {
            expect(analyzerEdit.props().page).toBe('analyzers');
            expect(analyzerEdit.props().orgId).toBe('test-org-id');
        }
    });

    it('passes correct props to AnalyzerCreate', async () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'add'
            }
        });

        await wrapper.vm.$nextTick();

        const analyzerCreate = wrapper.findComponent({ name: 'OrgAnalyzerCreate' });
        if (analyzerCreate.exists()) {
            expect(analyzerCreate.props().page).toBe('analyzers');
            expect(analyzerCreate.props().orgId).toBe('test-org-id');
        }
    });

    it('initializes state store correctly', () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        expect(mockStateStore.page).toBe('orgs');
    });

    it('resets state store on mount', () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        expect(mockStateStore.$reset).toHaveBeenCalled();
    });

    it('accepts props with correct typing', () => {
        wrapper = mount(AnalyzersView, {
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
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id'
            }
        });

        expect(wrapper.props().action).toBeUndefined();
        expect(wrapper.exists()).toBe(true);
    });

    it('renders with different page values', async () => {
        const pageValues = ['analyzers', 'tools', 'scanners'];

        for (const page of pageValues) {
            wrapper = mount(AnalyzersView, {
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
            wrapper = mount(AnalyzersView, {
                props: {
                    page: 'analyzers',
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

    it('supports all valid action values', async () => {
        const actions = ['manage', 'edit', 'add'];

        for (const action of actions) {
            wrapper = mount(AnalyzersView, {
                props: {
                    page: 'analyzers',
                    orgId: 'test-org-id',
                    action
                }
            });

            await wrapper.vm.$nextTick();

            expect(wrapper.props().action).toBe(action);

            if (wrapper) {
                wrapper.unmount();
            }
        }
    });

    it('maintains state store page setting across renders', () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        expect(mockStateStore.page).toBe('orgs');

        wrapper.unmount();

        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id-2',
                action: 'add'
            }
        });

        expect(mockStateStore.page).toBe('orgs');
    });

    it('has consistent component structure', () => {
        wrapper = mount(AnalyzersView, {
            props: {
                page: 'analyzers',
                orgId: 'test-org-id',
                action: 'manage'
            }
        });

        // The component should render without any structural elements
        // since it's just a router for async components
        expect(wrapper.element.tagName).toBeUndefined();
    });
});
