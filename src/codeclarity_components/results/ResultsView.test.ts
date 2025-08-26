import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ResultsView from './ResultsView.vue';
import { AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';

// Mock vue router
vi.mock('vue-router', () => ({
    useRoute: () => ({
        params: {},
        query: {}
    }),
    useRouter: () => ({
        push: vi.fn(),
        back: vi.fn()
    })
}));

// Mock stores
const mockStateStore = {
    $reset: vi.fn(),
    page: 'results'
};

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

vi.mock('@/stores/state', () => ({
    useStateStore: vi.fn(() => mockStateStore)
}));

vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn(() => mockUserStore)
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => mockAuthStore)
}));

// Mock repositories with proper responses
const mockProjectResponse = {
    data: {
        id: 'proj-1',
        name: 'Test Project',
        description: 'Test Description',
        integration_id: 'int-1',
        type: 'GITHUB',
        url: 'https://github.com/test/repo',
        upload_id: 'upload-1',
        added_on: new Date(),
        organization_id: 'org-1'
    }
};

const mockAnalysisResponse = {
    data: {
        id: 'analysis-1',
        created_on: new Date(),
        analyzer: { id: 'analyzer-1', name: 'Test Analyzer' },
        status: AnalysisStatus.SUCCESS,
        steps: [
            [
                { Name: 'js-sbom', Status: 'success', Result: 'result-1' },
                { Name: 'vuln-finder', Status: 'success', Result: 'result-2' }
            ]
        ],
        branch: 'main'
    }
};

vi.mock('@/codeclarity_components/projects/project.repository', () => ({
    ProjectRepository: vi.fn().mockImplementation(() => ({
        getProjectById: vi.fn().mockResolvedValue(mockProjectResponse)
    }))
}));

vi.mock('@/codeclarity_components/analyses/analysis.repository', () => ({
    AnalysisRepository: vi.fn().mockImplementation(() => ({
        getProjectById: vi.fn().mockResolvedValue(mockAnalysisResponse)
    }))
}));

// Mock child components
vi.mock('@/base_components/ui/loaders/LoadingComponent.vue', () => ({
    default: {
        name: 'LoadingComponent',
        template: '<div>Loading...</div>'
    }
}));

vi.mock('@/base_components/utilities/ErrorComponent.vue', () => ({
    default: {
        name: 'ErrorComponent',
        template: '<div>Error</div>'
    }
}));

// Mock Shadcn tabs components
vi.mock('@/shadcn/ui/tabs', () => ({
    Tabs: {
        name: 'Tabs',
        template: '<div data-testid="tabs"><slot></slot></div>',
        props: ['defaultValue']
    },
    TabsList: {
        name: 'TabsList',
        template: '<div data-testid="tabs-list"><slot></slot></div>'
    },
    TabsTrigger: {
        name: 'TabsTrigger',
        template: '<button data-testid="tabs-trigger"><slot></slot></button>',
        props: ['value']
    },
    TabsContent: {
        name: 'TabsContent',
        template: '<div data-testid="tabs-content"><slot></slot></div>',
        props: ['value']
    }
}));

describe('ResultsView', () => {
    let wrapper: any;
    let windowLocation: Location;

    beforeEach(() => {
        vi.clearAllMocks();

        // Save original window.location
        windowLocation = window.location;

        // Mock window.location
        delete (window as any).location;
        window.location = {
            ...windowLocation,
            href: 'http://localhost:3000/results?project_id=proj-1&analysis_id=analysis-1',
            search: '?project_id=proj-1&analysis_id=analysis-1'
        } as any;
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
        // Restore window.location
        Object.defineProperty(window, 'location', {
            value: windowLocation,
            writable: true,
            configurable: true
        });
    });

    it('renders correctly', async () => {
        wrapper = mount(ResultsView, {
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('Results');
    });

    it('displays project name after loading', async () => {
        wrapper = mount(ResultsView, {
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();
        expect(wrapper.text()).toContain('Test Project');
    });

    it('shows tabs based on successful analysis steps', async () => {
        wrapper = mount(ResultsView, {
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();

        const tabsTriggers = wrapper.findAll('[data-testid="tabs-trigger"]');
        expect(tabsTriggers.length).toBe(2); // SBOM and Vulnerabilities
        expect(tabsTriggers[0].text()).toContain('SBOM');
        expect(tabsTriggers[1].text()).toContain('Vulnerabilities');
    });

    it('shows vulnerabilities details page when page prop is set', async () => {
        wrapper = mount(ResultsView, {
            props: {
                page: 'vulnerabilities_details'
            },
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: {
                        template: '<div data-testid="vuln-details">Vulnerabilities Details</div>'
                    },
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();

        expect(wrapper.find('[data-testid="vuln-details"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="tabs"]').exists()).toBe(false);
    });

    it('shows SBOM details page when page prop is set', async () => {
        wrapper = mount(ResultsView, {
            props: {
                page: 'sbom_details'
            },
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: {
                        template: '<div data-testid="sbom-details">SBOM Details</div>'
                    },
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();

        expect(wrapper.find('[data-testid="sbom-details"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="tabs"]').exists()).toBe(false);
    });

    it('validates component initialization', async () => {
        wrapper = mount(ResultsView, {
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.text()).toContain('Results');
    });

    it('resets state store on mount', () => {
        wrapper = mount(ResultsView, {
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        expect(mockStateStore.$reset).toHaveBeenCalled();
        expect(mockStateStore.page).toBe('results');
    });

    it('shows only tabs for successful analysis steps', async () => {
        // Mock AnalysisRepository with mixed results
        const mockAnalysisRepo = {
            getProjectById: vi.fn().mockResolvedValue({
                data: {
                    ...mockAnalysisResponse.data,
                    steps: [
                        [
                            { Name: 'js-sbom', Status: 'success', Result: 'result-1' },
                            { Name: 'vuln-finder', Status: 'failed', Result: null },
                            { Name: 'js-patching', Status: 'success', Result: 'result-3' }
                        ]
                    ]
                }
            })
        };

        vi.mocked(AnalysisRepository).mockImplementation(() => mockAnalysisRepo as any);

        wrapper = mount(ResultsView, {
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();

        const tabsTriggers = wrapper.findAll('[data-testid="tabs-trigger"]');
        expect(tabsTriggers.length).toBe(2); // Only SBOM and Patches
        expect(tabsTriggers[0].text()).toContain('SBOM');
        expect(tabsTriggers[1].text()).toContain('Patches');
        expect(tabsTriggers.some((t: any) => t.text().includes('Vulnerabilities'))).toBe(false);
    });

    it('displays all tab types when all analyses succeed', async () => {
        // Mock AnalysisRepository with all successful steps
        const mockAnalysisRepo = {
            getProjectById: vi.fn().mockResolvedValue({
                data: {
                    ...mockAnalysisResponse.data,
                    steps: [
                        [
                            { Name: 'js-sbom', Status: 'success', Result: 'result-1' },
                            { Name: 'vuln-finder', Status: 'success', Result: 'result-2' },
                            { Name: 'js-patching', Status: 'success', Result: 'result-3' },
                            { Name: 'license-finder', Status: 'success', Result: 'result-4' },
                            { Name: 'codeql', Status: 'success', Result: 'result-5' }
                        ]
                    ]
                }
            })
        };

        vi.mocked(AnalysisRepository).mockImplementation(() => mockAnalysisRepo as any);

        wrapper = mount(ResultsView, {
            global: {
                plugins: [],
                stubs: {
                    ResultsSBOM: true,
                    ResultsSBOMDetails: true,
                    ResultsVulnerabilities: true,
                    ResultsVulnerabilitiesDetails: true,
                    ResultsPatching: true,
                    ResultsLicenses: true,
                    ResultsCodeQL: true
                }
            }
        });

        await flushPromises();

        const tabsTriggers = wrapper.findAll('[data-testid="tabs-trigger"]');
        expect(tabsTriggers.length).toBe(5);
        expect(tabsTriggers[0].text()).toContain('SBOM');
        expect(tabsTriggers[1].text()).toContain('Vulnerabilities');
        expect(tabsTriggers[2].text()).toContain('Patches');
        expect(tabsTriggers[3].text()).toContain('Licenses');
        expect(tabsTriggers[4].text()).toContain('CodeQL');
    });
});
