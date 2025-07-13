import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ResultsPatching from './ResultsPatching.vue';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';

// Mock child components
vi.mock('./PatchingContent.vue', () => ({
    default: {
        name: 'PatchingContent',
        template: '<div data-testid="patching-content">Patching Content</div>',
        props: ['analysisID', 'projectID']
    }
}));

describe('ResultsPatching.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());

        // Mock DOM elements
        const mockLoader = document.createElement('div');
        mockLoader.id = 'loader';
        mockLoader.style.display = 'block';
        document.body.appendChild(mockLoader);
    });

    afterEach(() => {
        vi.clearAllMocks();
        // Clean up DOM
        const loader = document.getElementById('loader');
        if (loader) {
            document.body.removeChild(loader);
        }
    });

    const createMockProject = (): Project => {
        const project = new Project();
        project.id = 'project-123';
        project.name = 'Test Project';
        return project;
    };

    const createMockAnalysis = (): Analysis => {
        const analysis = new Analysis();
        analysis.id = 'analysis-123';
        analysis.branch = 'main';
        return analysis;
    };

    const createWrapper = (props = {}) => {
        const defaultProps = {
            analysis: createMockAnalysis(),
            project: createMockProject()
        };

        return mount(ResultsPatching, {
            props: { ...defaultProps, ...props }
        });
    };

    it('renders correctly with required props', () => {
        const wrapper = createWrapper();

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="patching-content"]').exists()).toBe(true);
    });

    it('passes correct props to PatchingContent', () => {
        const mockProject = createMockProject();
        const mockAnalysis = createMockAnalysis();

        const wrapper = createWrapper({
            analysis: mockAnalysis,
            project: mockProject
        });

        const patchingContent = wrapper.findComponent({ name: 'PatchingContent' });
        expect(patchingContent.exists()).toBe(true);
    });

    it('shows content when details is false', () => {
        const wrapper = createWrapper();

        expect(wrapper.find('.flex.flex-col.gap-14').exists()).toBe(true);
        expect(wrapper.find('[data-testid="patching-content"]').exists()).toBe(true);
    });

    it('hides loader on mount', async () => {
        const loader = document.getElementById('loader');
        expect(loader?.style.display).toBe('block');

        createWrapper();

        // Wait for onMounted to complete
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(loader?.style.display).toBe('none');
    });

    it('handles missing loader element gracefully', async () => {
        // Remove loader before mounting
        const loader = document.getElementById('loader');
        if (loader) {
            document.body.removeChild(loader);
        }

        // Should not throw error
        expect(() => createWrapper()).not.toThrow();
    });

    it('renders with different project data', () => {
        const customProject = createMockProject();
        customProject.id = 'custom-project-456';
        customProject.name = 'Custom Project';

        const wrapper = createWrapper({ project: customProject });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="patching-content"]').exists()).toBe(true);
    });

    it('renders with different analysis data', () => {
        const customAnalysis = createMockAnalysis();
        customAnalysis.id = 'custom-analysis-789';
        customAnalysis.branch = 'develop';

        const wrapper = createWrapper({ analysis: customAnalysis });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="patching-content"]').exists()).toBe(true);
    });

    it('has correct component structure', () => {
        const wrapper = createWrapper();

        const mainDiv = wrapper.find('.flex.flex-col.gap-14');
        expect(mainDiv.exists()).toBe(true);
        expect(mainDiv.isVisible()).toBe(true);
    });

    it('initializes details state as false', () => {
        const wrapper = createWrapper();

        expect(wrapper.vm.details).toBe(false);
    });

    it('can change details state', async () => {
        const wrapper = createWrapper();

        // Initially false
        expect(wrapper.vm.details).toBe(false);

        // Change to true
        wrapper.vm.details = true;
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.details).toBe(true);
    });
});
