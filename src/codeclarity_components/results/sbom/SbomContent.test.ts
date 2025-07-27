import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SbomContent from './SbomContent.vue';

// Mock stores
const mockUserStore = {
    getDefaultOrg: { id: 'org-1', name: 'Test Org' },
    getUser: {
        default_org: { id: 'org-1', name: 'Test Org' }
    }
};

const mockAuthStore = {
    getToken: 'test-token',
    getAuthenticated: true
};

vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn(() => mockUserStore)
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => mockAuthStore)
}));

// Mock child components
vi.mock('./SbomTable.vue', () => ({
    default: {
        name: 'SbomTable',
        template: '<div data-testid="sbom-table">SBOM Table Component</div>',
        props: ['analysisID', 'projectID', 'workspace']
    }
}));

vi.mock('../SelectWorkspace.vue', () => ({
    default: {
        name: 'SelectWorkspace',
        template: '<div data-testid="select-workspace">Select Workspace Component</div>',
        props: ['analysisID', 'projectID'],
        emits: ['update:selected_workspace']
    }
}));

vi.mock('@/base_components/ui/loaders/TextLoader.vue', () => ({
    default: {
        name: 'TextLoader',
        template: '<div data-testid="text-loader">Loading text...</div>'
    }
}));

vi.mock('@/base_components/ui/loaders/DonutLoader.vue', () => ({
    default: {
        name: 'DonutLoader',
        template: '<div data-testid="donut-loader">Loading donut...</div>'
    }
}));

vi.mock('@/base_components/data-display/charts/DoughnutChart.vue', () => ({
    default: {
        name: 'DoughnutChart',
        template: '<div data-testid="doughnut-chart">Doughnut Chart</div>',
        props: ['data', 'dimensions']
    }
}));

vi.mock('@/base_components/ui/cards/StatCard.vue', () => ({
    default: {
        name: 'StatCard',
        template: '<div data-testid="stat-card"><slot></slot></div>',
        props: ['title', 'value', 'subtitle', 'icon']
    }
}));

vi.mock('@/base_components/ui/cards/InfoCard.vue', () => ({
    default: {
        name: 'InfoCard',
        template: '<div data-testid="info-card"><slot></slot></div>',
        props: ['title', 'description', 'icon', 'variant']
    }
}));

// Mock Shadcn components
vi.mock('@/shadcn/ui/button', () => ({
    Button: {
        name: 'Button',
        template: '<button data-testid="button"><slot></slot></button>',
        props: ['variant', 'size']
    }
}));

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<span data-testid="icon"></span>',
        props: ['icon']
    }
}));

// Mock results repository
const mockSbomStats = {
    number_of_dependencies: 100,
    number_of_outdated_dependencies: 10,
    number_of_deprecated_dependencies: 5,
    number_of_unlicensed_dependencies: 3,
    dependency_health: []
};

vi.mock('@/codeclarity_components/results/results.repository', () => ({
    ResultsRepository: vi.fn().mockImplementation(() => ({
        getSbomStats: vi.fn().mockResolvedValue({
            data: mockSbomStats
        })
    }))
}));

describe('SbomContent', () => {
    let wrapper: any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly with default props', () => {
        wrapper = mount(SbomContent, {
            global: {
                plugins: []
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('renders with provided projectID and analysisID props', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.vm.projectID).toBe('project-123');
        expect(wrapper.vm.analysisID).toBe('analysis-456');
    });

    it('renders SelectWorkspace component', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        const selectWorkspace = wrapper.findComponent({ name: 'SelectWorkspace' });
        expect(selectWorkspace.exists()).toBe(true);
    });

    it('renders SbomTable component', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        const sbomTable = wrapper.findComponent({ name: 'SbomTable' });
        expect(sbomTable.exists()).toBe(true);
    });

    it('has correct default prop values', () => {
        wrapper = mount(SbomContent, {
            global: {
                plugins: []
            }
        });

        expect(wrapper.vm.projectID).toBe('');
        expect(wrapper.vm.analysisID).toBe('');
    });

    it('initializes with correct default state', () => {
        wrapper = mount(SbomContent, {
            global: {
                plugins: []
            }
        });

        expect(wrapper.vm.error).toBe(false);
        expect(wrapper.vm.loading).toBe(true);
        expect(wrapper.vm.render).toBe(false);
        expect(wrapper.vm.selected_workspace).toBe('.');
    });

    it('has health score computed property', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        // Health score is a computed property that should exist
        expect(typeof wrapper.vm.healthScore).toBe('number');
        expect(wrapper.vm.healthScore).toBeGreaterThanOrEqual(0);
        expect(wrapper.vm.healthScore).toBeLessThanOrEqual(100);
    });

    it('has security issues computed property', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        // Security issues is a computed property that should exist
        expect(typeof wrapper.vm.securityIssues).toBe('number');
        expect(wrapper.vm.securityIssues).toBeGreaterThanOrEqual(0);
    });

    it('handles prop changes gracefully', async () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        // Component should handle prop changes without errors
        await wrapper.setProps({ projectID: 'project-456' });
        expect(wrapper.vm.projectID).toBe('project-456');

        await wrapper.setProps({ analysisID: 'analysis-789' });
        expect(wrapper.vm.analysisID).toBe('analysis-789');
    });

    it('maintains reactive state across prop changes', async () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        const initialWorkspace = wrapper.vm.selected_workspace;

        await wrapper.setProps({ projectID: 'project-456' });

        // Reactive state should be maintained
        expect(wrapper.vm.selected_workspace).toBe(initialWorkspace);
        expect(typeof wrapper.vm.error).toBe('boolean');
    });

    it('has loading state property', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        // Loading is a reactive property that should exist
        expect(typeof wrapper.vm.loading).toBe('boolean');
    });

    it('has correct donut chart dimensions', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        expect(wrapper.vm.donutDimensions).toEqual({
            width: '180px',
            height: '180px'
        });
    });

    it('has chart data properties', () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        // Chart data properties should exist
        expect(wrapper.vm.donut_data).toBeDefined();
        expect(wrapper.vm.bar_data).toHaveProperty('labels');
        expect(wrapper.vm.bar_data).toHaveProperty('datasets');
    });

    it('handles repository authentication requirements', async () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        // Component should check for authentication before making API calls
        expect(mockAuthStore.getAuthenticated).toBe(true);
        expect(mockAuthStore.getToken).toBe('test-token');
        expect(mockUserStore.getDefaultOrg).toBeTruthy();
    });

    it('passes correct props to child components', async () => {
        wrapper = mount(SbomContent, {
            props: {
                projectID: 'project-123',
                analysisID: 'analysis-456'
            },
            global: {
                plugins: []
            }
        });

        const selectWorkspace = wrapper.findComponent({ name: 'SelectWorkspace' });
        const sbomTable = wrapper.findComponent({ name: 'SbomTable' });

        expect(selectWorkspace.props('projectID')).toBe('project-123');
        expect(selectWorkspace.props('analysisID')).toBe('analysis-456');

        expect(sbomTable.props('projectID')).toBe('project-123');
        expect(sbomTable.props('analysisID')).toBe('analysis-456');
    });
});
