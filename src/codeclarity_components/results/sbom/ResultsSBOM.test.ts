import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import ResultsSBOM from './ResultsSBOM.vue';
import { AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import { Analyzer } from '@/codeclarity_components/organizations/analyzers/Analyzer';

// Mock child components
vi.mock('./SbomContent.vue', () => ({
    default: {
        name: 'SbomContent',
        template: '<div data-testid="sbom-content">SBOM Content Component</div>',
        props: ['analysisID', 'projectID']
    }
}));

// Mock Shadcn Alert components
vi.mock('@/shadcn/ui/alert', () => ({
    Alert: {
        name: 'Alert',
        template: '<div data-testid="alert"><slot></slot></div>'
    },
    AlertDescription: {
        name: 'AlertDescription',
        template: '<div data-testid="alert-description"><slot></slot></div>'
    }
}));

// Mock DOM manipulation
Object.defineProperty(document, 'getElementById', {
    value: vi.fn((id: string) => {
        if (id === 'main-container') {
            return {
                scrollTop: 0
            };
        }
        return null;
    }),
    writable: true
});

describe('ResultsSBOM', () => {
    let wrapper: any;
    let pinia: any;

    const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        description: 'Test Description',
        integration_id: 'int-1',
        type: IntegrationProvider.GITHUB,
        url: 'https://github.com/test/repo',
        upload_id: 'upload-1',
        added_on: new Date(),
        organization_id: 'org-1'
    };

    const mockAnalysis = {
        id: 'analysis-1',
        created_on: new Date(),
        analyzer: {
            id: 'analyzer-1',
            name: 'Test Analyzer',
            description: 'Test Description',
            created_on: new Date(),
            steps: [],
            organization_id: 'org-1'
        } as Analyzer,
        status: AnalysisStatus.SUCCESS,
        steps: [
            [
                {
                    Name: 'js-sbom',
                    Version: '1.0',
                    Status: AnalysisStatus.SUCCESS,
                    Result: 'result-1'
                }
            ]
        ],
        branch: 'main'
    };

    beforeEach(() => {
        pinia = createPinia();
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly with project and analysis props', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('#main-container').exists()).toBe(true);
    });

    it('renders SbomContent component with correct props', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        const sbomContent = wrapper.findComponent({ name: 'SbomContent' });
        expect(sbomContent.exists()).toBe(true);
        expect(sbomContent.props('analysisID')).toBe('analysis-1');
        expect(sbomContent.props('projectID')).toBe('project-1');
    });

    it('has correct initial reactive state', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.vm.bill_of_materials).toEqual([]);
        expect(wrapper.vm.details).toBe(false);
        expect(wrapper.vm.reference_click_element).toBe('');
        expect(wrapper.vm.is_loading).toBe(true);
        expect(wrapper.vm.only_details).toBe(false);
        expect(wrapper.vm.activeTab).toBe('SBOM');
    });

    it('accepts required project and analysis props', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        expect(wrapper.props('project')).toEqual(mockProject);
        expect(wrapper.props('analysis')).toEqual(mockAnalysis);
    });

    it('validates component structure with proper CSS classes', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        const mainContainer = wrapper.find('#main-container');
        expect(mainContainer.classes()).toContain('w-full');
        expect(mainContainer.classes()).toContain('flex');
        expect(mainContainer.classes()).toContain('flex-col');
        expect(mainContainer.classes()).toContain('gap-14');
    });

    it('handles DOM scroll manipulation without errors', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        // This should not throw an error even with mocked DOM
        expect(() => wrapper.vm.$forceUpdate()).not.toThrow();
    });

    it('passes correct props to SbomContent component', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        const sbomContent = wrapper.findComponent({ name: 'SbomContent' });
        expect(sbomContent.exists()).toBe(true);
        // In Vue, kebab-case props are accessible as camelCase
        expect(sbomContent.props('analysisID')).toBe('analysis-1');
        expect(sbomContent.props('projectID')).toBe('project-1');
    });

    it('has proper component structure and layout', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        // Check that the main container is visible by default
        const mainContainer = wrapper.find('#main-container');
        expect(mainContainer.exists()).toBe(true);
        expect(mainContainer.isVisible()).toBe(true);
    });

    it('contains SbomContent as the main content area', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        const sbomContent = wrapper.find('[data-testid="sbom-content"]');
        expect(sbomContent.exists()).toBe(true);
        expect(sbomContent.text()).toBe('SBOM Content Component');
    });

    it('validates that required props are passed correctly', () => {
        expect(() => {
            mount(ResultsSBOM, {
                props: {
                    project: mockProject,
                    analysis: mockAnalysis
                },
                global: {
                    plugins: [pinia]
                }
            });
        }).not.toThrow();
    });

    it('has appropriate component layout structure', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        const container = wrapper.find('#main-container');
        expect(container.exists()).toBe(true);

        // Verify it contains the SbomContent component
        const sbomContent = wrapper.findComponent({ name: 'SbomContent' });
        expect(sbomContent.exists()).toBe(true);
    });

    it('renders without throwing errors', async () => {
        expect(() => {
            wrapper = mount(ResultsSBOM, {
                props: {
                    project: mockProject,
                    analysis: mockAnalysis
                },
                global: {
                    plugins: [pinia]
                }
            });
        }).not.toThrow();

        await flushPromises();
        expect(wrapper.exists()).toBe(true);
    });

    it('has correct component name and structure', () => {
        wrapper = mount(ResultsSBOM, {
            props: {
                project: mockProject,
                analysis: mockAnalysis
            },
            global: {
                plugins: [pinia]
            }
        });

        // Verify the component has the expected structure
        expect(wrapper.vm).toBeTruthy();
        expect(wrapper.element.tagName).toBe('DIV');
    });
});
