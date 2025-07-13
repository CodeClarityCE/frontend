import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProjectsView from './ProjectsView.vue';

// Mock the state store
const mockStateStore = {
    $reset: vi.fn(),
    page: 'projects'
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

// Mock the dynamic imports
vi.mock('./list/ProjectsList.vue', () => ({
    default: {
        name: 'ProjectsList',
        template: '<div data-testid="projects-list">Projects List</div>'
    }
}));

vi.mock('./create/CreateProject.vue', () => ({
    default: {
        name: 'CreateProject',
        template: '<div data-testid="create-project">Create Project</div>'
    }
}));

describe('ProjectsView', () => {
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
        wrapper = mount(ProjectsView);

        expect(wrapper.find('main').exists()).toBe(true);
        expect(wrapper.find('main').classes()).toContain('p-8');
        expect(wrapper.find('main').classes()).toContain('space-y-6');
    });

    it('shows ProjectsList by default when no page prop provided', async () => {
        wrapper = mount(ProjectsView);

        // Wait for async component resolution
        await wrapper.vm.$nextTick();

        // Since we're dealing with async components, check for the template content
        expect(wrapper.html()).toContain('Projects List');
        expect(wrapper.html()).not.toContain('Create Project');
    });

    it('shows CreateProject when page prop is "add"', async () => {
        wrapper = mount(ProjectsView, {
            props: {
                page: 'add'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Create Project');
        expect(wrapper.html()).not.toContain('Projects List');
    });

    it('shows ProjectsList when page prop is not "add"', async () => {
        wrapper = mount(ProjectsView, {
            props: {
                page: 'list'
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Projects List');
        expect(wrapper.html()).not.toContain('Create Project');
    });

    it('initializes state store correctly', () => {
        wrapper = mount(ProjectsView);

        expect(mockStateStore.page).toBe('projects');
    });

    it('resets state store on mount', () => {
        wrapper = mount(ProjectsView);

        expect(mockStateStore.$reset).toHaveBeenCalled();
    });

    it('accepts page prop with correct typing', () => {
        wrapper = mount(ProjectsView, {
            props: {
                page: 'test-page'
            }
        });

        expect(wrapper.props().page).toBe('test-page');
    });

    it('handles undefined page prop', async () => {
        wrapper = mount(ProjectsView, {
            props: {
                page: undefined
            }
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.html()).toContain('Projects List');
        expect(wrapper.html()).not.toContain('Create Project');
    });
});
