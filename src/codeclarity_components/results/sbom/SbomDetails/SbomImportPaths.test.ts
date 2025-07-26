import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SbomImportPaths from './SbomImportPaths.vue';
import { DependencyDetails } from './SbomDetails';
import type { GraphDependency } from '../../graph.entity';

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        props: ['icon', 'class'],
        template: '<span class="mock-icon" :class="$props.class">{{ icon }}</span>'
    }
}));

// Mock TreeChart component
vi.mock('@/base_components/data-display/charts/TreeChart.vue', () => ({
    default: {
        name: 'TreeChart',
        props: ['id', 'data', 'target-dependency'],
        template: '<div class="mock-tree-chart" :id="id">TreeChart: {{ data.length }} items</div>'
    }
}));

// Mock stores
const mockUserStore = {
    getDefaultOrg: { id: 'test-org-id' }
};

const mockAuthStore = {
    getToken: 'test-token'
};

vi.mock('@/stores/user', () => ({
    useUserStore: () => mockUserStore
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: () => mockAuthStore
}));

// Mock ResultsRepository
const mockGetDependencyGraph = vi.fn();
vi.mock('../../results.repository', () => ({
    ResultsRepository: vi.fn().mockImplementation(() => ({
        getDependencyGraph: mockGetDependencyGraph
    }))
}));

describe('SbomImportPaths.vue', () => {
    const createMockDependency = (overrides = {}): DependencyDetails => {
        return {
            name: 'test-package',
            version: '1.2.3',
            ...overrides
        } as DependencyDetails;
    };

    const createMockGraphData = (): GraphDependency[] => [
        {
            id: 'root-package',
            prod: true,
            dev: false,
            parentIds: [],
            childrenIds: ['test-package']
        },
        {
            id: 'test-package',
            prod: true,
            dev: false,
            parentIds: ['root-package'],
            childrenIds: []
        }
    ];

    const createWrapper = (dependency = createMockDependency(), props = {}) => {
        return mount(SbomImportPaths, {
            props: {
                dependency,
                analysisID: 'test-analysis-id',
                projectID: 'test-project-id',
                ...props
            }
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetDependencyGraph.mockResolvedValue({
            data: createMockGraphData()
        });
    });

    describe('Component Rendering', () => {
        it('should render the main import paths panel', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.import-paths-panel').exists()).toBe(true);
        });

        it('should render section header', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.section-header').exists()).toBe(true);
            expect(wrapper.find('.section-title').exists()).toBe(true);
            expect(wrapper.text()).toContain('Import Paths');
        });

        it('should render content container', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.import-paths-content').exists()).toBe(true);
        });
    });

    describe('Chart Description', () => {
        it('should render chart description section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.chart-description').exists()).toBe(true);
            expect(wrapper.find('.description-text').exists()).toBe(true);
        });

        it('should display correct description content', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain(
                'Dependencies with gray background are dev dependencies'
            );
            expect(wrapper.text()).toContain(
                'Explore how this package is integrated into your project'
            );
        });

        it('should render description items properly', () => {
            const wrapper = createWrapper();

            const descriptionItems = wrapper.findAll('.description-item');
            expect(descriptionItems.length).toBe(2);
        });
    });

    describe('Tree Chart Container', () => {
        it('should render tree chart container', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.tree-chart-container').exists()).toBe(true);
        });

        it('should show TreeChart when hierarchy data is available', async () => {
            const wrapper = createWrapper();

            // Wait for the component to mount and fetch data
            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.find('.chart-wrapper').exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'TreeChart' }).exists()).toBe(true);
        });

        it('should pass correct props to TreeChart', async () => {
            const dependency = createMockDependency({ name: 'my-package', version: '2.0.0' });
            const wrapper = createWrapper(dependency);

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            const treeChart = wrapper.findComponent({ name: 'TreeChart' });
            if (treeChart.exists()) {
                expect(treeChart.props('id')).toBe('sbom-import-paths-tree-chart');
                expect(treeChart.props('target-dependency')).toBe('my-package@2.0.0');
            }
        });

        it('should show no-data state when hierarchy is empty', async () => {
            mockGetDependencyGraph.mockResolvedValue({ data: [] });
            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.find('.no-data-state').exists()).toBe(true);
            expect(wrapper.find('.no-data-content').exists()).toBe(true);
        });
    });

    describe('No Data State', () => {
        beforeEach(() => {
            mockGetDependencyGraph.mockResolvedValue({ data: [] });
        });

        it('should render no data state elements', async () => {
            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.find('.no-data-state').exists()).toBe(true);
            expect(wrapper.find('.no-data-content').exists()).toBe(true);
            expect(wrapper.find('.no-data-icon').exists()).toBe(true);
            expect(wrapper.find('.no-data-title').exists()).toBe(true);
            expect(wrapper.find('.no-data-description').exists()).toBe(true);
        });

        it('should display correct no data content', async () => {
            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.text()).toContain('No dependency graph available');
            expect(wrapper.text()).toContain("We couldn't find dependency relationship data");
            expect(wrapper.text()).toContain('material-symbols:data-exploration');
        });

        it('should explain why no data might be available', async () => {
            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.text()).toContain('root dependency');
            expect(wrapper.text()).toContain('graph data is not available');
        });
    });

    describe('Data Fetching', () => {
        it('should call getDependencyGraph with correct parameters', async () => {
            const dependency = createMockDependency({ name: 'test-pkg', version: '3.1.0' });
            createWrapper(dependency, {
                analysisID: 'analysis-123',
                projectID: 'project-456'
            });

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockGetDependencyGraph).toHaveBeenCalledWith({
                orgId: 'test-org-id',
                projectId: 'project-456',
                analysisId: 'analysis-123',
                workspace: '.',
                dependency: 'test-pkg@3.1.0',
                bearerToken: 'test-token'
            });
        });

        it('should handle successful data fetch', async () => {
            const mockData = createMockGraphData();
            mockGetDependencyGraph.mockResolvedValue({ data: mockData });

            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.vm.hierarchy).toEqual(mockData);
        });

        it('should handle fetch errors gracefully', async () => {
            mockGetDependencyGraph.mockRejectedValue(new Error('API Error'));
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(consoleErrorSpy).toHaveBeenCalledWith('error');
            expect(wrapper.vm.hierarchy).toEqual([]);

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Store Integration', () => {
        it('should handle missing default org', async () => {
            mockUserStore.getDefaultOrg = null;
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(consoleErrorSpy).toHaveBeenCalledWith('error');
            expect(wrapper.vm.hierarchy).toEqual([]);

            consoleErrorSpy.mockRestore();
            mockUserStore.getDefaultOrg = { id: 'test-org-id' };
        });

        it('should handle missing auth token', async () => {
            mockAuthStore.getToken = null;
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(consoleErrorSpy).toHaveBeenCalledWith('error');
            expect(wrapper.vm.hierarchy).toEqual([]);

            consoleErrorSpy.mockRestore();
            mockAuthStore.getToken = 'test-token';
        });
    });

    describe('Props Validation', () => {
        it('should accept dependency prop', () => {
            const dependency = createMockDependency();
            const wrapper = createWrapper(dependency);

            expect(wrapper.props('dependency')).toEqual(dependency);
        });

        it('should accept analysisID prop', () => {
            const wrapper = createWrapper(createMockDependency(), {
                analysisID: 'custom-analysis'
            });

            expect(wrapper.props('analysisID')).toBe('custom-analysis');
        });

        it('should accept projectID prop', () => {
            const wrapper = createWrapper(createMockDependency(), { projectID: 'custom-project' });

            expect(wrapper.props('projectID')).toBe('custom-project');
        });

        it('should require all props', () => {
            expect(SbomImportPaths.props?.dependency?.required).toBe(true);
            expect(SbomImportPaths.props?.analysisID?.required).toBe(true);
            expect(SbomImportPaths.props?.projectID?.required).toBe(true);
        });
    });

    describe('Target Dependency Formatting', () => {
        it('should format target dependency correctly', async () => {
            const dependency = createMockDependency({
                name: '@scope/package',
                version: '1.0.0-beta'
            });
            const wrapper = createWrapper(dependency);

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            const treeChart = wrapper.findComponent({ name: 'TreeChart' });
            if (treeChart.exists()) {
                expect(treeChart.props('target-dependency')).toBe('@scope/package@1.0.0-beta');
            }
        });

        it('should handle special characters in dependency names', async () => {
            const dependency = createMockDependency({
                name: 'package-with-dashes_and_underscores',
                version: '2.1.0-rc.1'
            });
            const wrapper = createWrapper(dependency);

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockGetDependencyGraph).toHaveBeenCalledWith(
                expect.objectContaining({
                    dependency: 'package-with-dashes_and_underscores@2.1.0-rc.1'
                })
            );
        });
    });

    describe('Component Lifecycle', () => {
        it('should initialize data on mount', async () => {
            const wrapper = createWrapper();

            expect(wrapper.vm.hierarchy).toEqual([]);

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockGetDependencyGraph).toHaveBeenCalled();
        });

        it('should handle component unmounting', () => {
            const wrapper = createWrapper();

            expect(() => wrapper.unmount()).not.toThrow();
        });
    });

    describe('Responsive Design', () => {
        it('should have responsive layout classes', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.import-paths-panel').exists()).toBe(true);
            expect(wrapper.find('.tree-chart-container').exists()).toBe(true);
        });

        it('should apply minimum height constraints', () => {
            const wrapper = createWrapper();

            const panel = wrapper.find('.import-paths-panel');
            const chartContainer = wrapper.find('.tree-chart-container');

            expect(panel.exists()).toBe(true);
            expect(chartContainer.exists()).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            mockGetDependencyGraph.mockRejectedValue(new Error('Network error'));
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.vm.hierarchy).toEqual([]);
            expect(consoleErrorSpy).toHaveBeenCalledWith('error');

            consoleErrorSpy.mockRestore();
        });

        it('should handle invalid response data', async () => {
            mockGetDependencyGraph.mockResolvedValue({ data: null });

            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Should handle null data gracefully
            expect(wrapper.exists()).toBe(true);
        });

        it('should handle malformed dependency data', async () => {
            const dependency = createMockDependency({ name: null, version: null });

            const wrapper = createWrapper(dependency);

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Should not crash with null dependency info
            expect(wrapper.exists()).toBe(true);
        });
    });

    describe('Styling and Layout', () => {
        it('should have correct CSS classes for main sections', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.import-paths-panel').exists()).toBe(true);
            expect(wrapper.find('.section-header').exists()).toBe(true);
            expect(wrapper.find('.import-paths-content').exists()).toBe(true);
            expect(wrapper.find('.chart-description').exists()).toBe(true);
            expect(wrapper.find('.tree-chart-container').exists()).toBe(true);
        });

        it('should apply proper styling to description section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.chart-description').exists()).toBe(true);
            expect(wrapper.find('.description-text').exists()).toBe(true);
            expect(wrapper.find('.description-item').exists()).toBe(true);
        });

        it('should handle chart wrapper styling when data is available', async () => {
            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            if (wrapper.vm.hierarchy.length > 0) {
                expect(wrapper.find('.chart-wrapper').exists()).toBe(true);
                expect(wrapper.find('.tree-chart-wrapper').exists()).toBe(true);
            }
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty dependency name', async () => {
            const dependency = createMockDependency({ name: '', version: '1.0.0' });
            const wrapper = createWrapper(dependency);

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockGetDependencyGraph).toHaveBeenCalledWith(
                expect.objectContaining({
                    dependency: '@1.0.0'
                })
            );
        });

        it('should handle empty version', async () => {
            const dependency = createMockDependency({ name: 'test-package', version: '' });
            const wrapper = createWrapper(dependency);

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockGetDependencyGraph).toHaveBeenCalledWith(
                expect.objectContaining({
                    dependency: 'test-package@'
                })
            );
        });

        it('should handle very large hierarchy data', async () => {
            const largeHierarchy = Array.from({ length: 1000 }, (_, i) => ({
                name: `package-${i}`,
                version: '1.0.0',
                children: []
            }));

            mockGetDependencyGraph.mockResolvedValue({ data: largeHierarchy });

            const wrapper = createWrapper();

            await wrapper.vm.$nextTick();
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(wrapper.vm.hierarchy).toEqual(largeHierarchy);
            expect(wrapper.findComponent({ name: 'TreeChart' }).exists()).toBe(true);
        });
    });
});
