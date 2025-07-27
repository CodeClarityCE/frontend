import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResultsVulnerabilities from './ResultsVulnerabilities.vue';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';

// Mock child components
vi.mock('./VulnList.vue', () => ({
    default: {
        name: 'VulnList',
        template: '<div data-testid="vuln-list">Vuln List Component</div>',
        props: [
            'selected_workspace',
            'highlightElem',
            'pageLimit',
            'forceOpenNewTab',
            'analysisID',
            'projectID'
        ],
        emits: ['update:selected_workspace']
    }
}));

vi.mock('./VulnTable.vue', () => ({
    default: {
        name: 'VulnTable',
        template: '<div data-testid="vuln-table">Vuln Table Component</div>',
        props: [
            'selected_workspace',
            'highlightElem',
            'forceOpenNewTab',
            'analysisID',
            'projectID'
        ],
        emits: ['update:selected_workspace']
    }
}));

vi.mock('./VulnContent.vue', () => ({
    default: {
        name: 'VulnContent',
        template: '<div data-testid="vuln-content">Vuln Content Component</div>',
        props: ['selected_workspace', 'analysisID', 'projectID'],
        emits: ['update:selected_workspace']
    }
}));

// Mock Shadcn components
vi.mock('@/shadcn/ui/tabs', () => ({
    Tabs: {
        name: 'Tabs',
        template: '<div data-testid="tabs"><slot></slot></div>',
        props: ['default-value']
    },
    TabsContent: {
        name: 'TabsContent',
        template: '<div data-testid="tabs-content"><slot></slot></div>',
        props: ['value']
    },
    TabsList: {
        name: 'TabsList',
        template: '<div data-testid="tabs-list"><slot></slot></div>'
    },
    TabsTrigger: {
        name: 'TabsTrigger',
        template: '<button data-testid="tabs-trigger"><slot></slot></button>',
        props: ['value']
    }
}));

vi.mock('@/shadcn/ui/card', () => ({
    Card: {
        name: 'Card',
        template: '<div data-testid="card"><slot></slot></div>'
    },
    CardContent: {
        name: 'CardContent',
        template: '<div data-testid="card-content"><slot></slot></div>'
    },
    CardHeader: {
        name: 'CardHeader',
        template: '<div data-testid="card-header"><slot></slot></div>',
        props: ['class']
    }
}));

vi.mock('@/shadcn/ui/alert', () => ({
    Alert: {
        name: 'Alert',
        template: '<div data-testid="alert"><slot></slot></div>'
    },
    AlertDescription: {
        name: 'AlertDescription',
        template: '<div data-testid="alert-description"><slot></slot></div>'
    },
    AlertTitle: {
        name: 'AlertTitle',
        template: '<div data-testid="alert-title"><slot></slot></div>'
    }
}));

describe('ResultsVulnerabilities', () => {
    let wrapper: any;
    let mockAnalysis: Analysis;
    let mockProject: Project;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create mock Analysis
        mockAnalysis = {
            id: 'analysis-123',
            created_on: new Date(),
            analyzer: { id: 'analyzer-123', name: 'Test Analyzer' } as any,
            status: 'COMPLETED' as any,
            steps: [],
            branch: 'main'
        } as Analysis;

        // Create mock Project
        mockProject = {
            id: 'project-123',
            name: 'Test Project',
            description: 'Test project description',
            organization_id: 'org-123',
            integration_id: 'integration-123',
            type: IntegrationProvider.GITHUB,
            url: 'https://github.com/test/repo',
            upload_id: 'upload-123',
            added_on: new Date()
        } as Project;

        // Mock DOM elements
        Object.defineProperty(document, 'getElementById', {
            value: vi.fn((id: string) => {
                if (id === 'loader') {
                    return {
                        style: {
                            display: 'block'
                        }
                    };
                }
                if (id === 'main-container') {
                    return { scrollTop: 0 };
                }
                return null;
            }),
            writable: true
        });

        // Mock setTimeout
        global.setTimeout = vi.fn((callback: () => void) => {
            callback();
            return 1;
        }) as any;
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly with required props', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        expect(wrapper.exists()).toBe(true);
    });

    it('renders VulnContent component', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const vulnContent = wrapper.find('[data-testid="vuln-content"]');
        expect(vulnContent.exists()).toBe(true);
    });

    it('renders Card component with tabs', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const card = wrapper.find('[data-testid="card"]');
        const tabs = wrapper.find('[data-testid="tabs"]');
        expect(card.exists()).toBe(true);
        expect(tabs.exists()).toBe(true);
    });

    it('renders List and Table tab triggers', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const tabTriggers = wrapper.findAll('[data-testid="tabs-trigger"]');
        expect(tabTriggers.length).toBe(2);
        expect(tabTriggers[0].text()).toBe('List');
        expect(tabTriggers[1].text()).toBe('Table');
    });

    it('renders VulnList component in list tab', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const vulnList = wrapper.findComponent({ name: 'VulnList' });
        expect(vulnList.exists()).toBe(true);
    });

    it('renders VulnTable component in table tab', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const vulnTable = wrapper.findComponent({ name: 'VulnTable' });
        expect(vulnTable.exists()).toBe(true);
    });

    it('initializes with correct default state', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        expect(wrapper.vm.active_tab).toBe('List');
        expect(wrapper.vm.selected_workspace).toBe('.');
        expect(wrapper.vm.details).toBe(false);
        expect(wrapper.vm.reference_click_element).toBe('');
    });

    it('passes correct props to VulnContent', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const vulnContent = wrapper.findComponent({ name: 'VulnContent' });
        expect(vulnContent.props('analysisID')).toBe('analysis-123');
        expect(vulnContent.props('projectID')).toBe('project-123');
    });

    it('passes correct props to VulnList', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const vulnList = wrapper.findComponent({ name: 'VulnList' });
        expect(vulnList.props('analysisID')).toBe('analysis-123');
        expect(vulnList.props('projectID')).toBe('project-123');
        expect(vulnList.props('pageLimit')).toBe(20);
        expect(vulnList.props('forceOpenNewTab')).toBe(false);
    });

    it('passes correct props to VulnTable', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        const vulnTable = wrapper.findComponent({ name: 'VulnTable' });
        expect(vulnTable.props('analysisID')).toBe('analysis-123');
        expect(vulnTable.props('projectID')).toBe('project-123');
        expect(vulnTable.props('forceOpenNewTab')).toBe(false);
    });

    it('handles workspace model updates', async () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        // Test reactive workspace binding
        wrapper.vm.selected_workspace = 'test-workspace';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selected_workspace).toBe('test-workspace');
    });

    it('resets position and reference when active tab changes', async () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        // Set some values
        wrapper.vm.y_position = 100;
        wrapper.vm.reference_click_element = 'test-element';

        // Change tab
        wrapper.vm.active_tab = 'Table';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.y_position).toBe(0);
        expect(wrapper.vm.reference_click_element).toBe('');
    });

    it('handles DOM manipulation in onMounted', () => {
        const mockLoader = { style: { display: 'block' } };
        document.getElementById = vi.fn().mockReturnValue(mockLoader);

        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        expect(document.getElementById).toHaveBeenCalledWith('loader');
        expect(mockLoader.style.display).toBe('none');
    });

    it('handles scroll position in onUpdated', async () => {
        const mockMainContainer = { scrollTop: 100 };
        const mockLoader = { style: { display: 'block' } };

        document.getElementById = vi.fn().mockImplementation((id: string) => {
            if (id === 'loader') return mockLoader;
            if (id === 'main-container') return mockMainContainer;
            return null;
        });

        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        // Trigger onUpdated by updating a reactive property
        wrapper.vm.selected_workspace = 'new-workspace';
        await wrapper.vm.$nextTick();

        expect(mockMainContainer.scrollTop).toBe(0);
    });

    it('shows main container when details is false', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        wrapper.vm.details = false;
        expect(wrapper.vm.details).toBe(false);

        const mainContainer = wrapper.find('#main-container');
        expect(mainContainer.exists()).toBe(true);
    });

    it('has correct no_deps constant', () => {
        wrapper = mount(ResultsVulnerabilities, {
            props: {
                analysis: mockAnalysis,
                project: mockProject
            },
            global: {
                plugins: []
            }
        });

        expect(wrapper.vm.no_deps).toBe(false);
    });
});
