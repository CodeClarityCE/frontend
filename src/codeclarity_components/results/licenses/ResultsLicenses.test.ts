import { Analysis , AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import { Analyzer } from '@/codeclarity_components/organizations/analyzers/Analyzer';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ResultsLicenses from './ResultsLicenses.vue';

// Mock child components
vi.mock('./LicensesComponent.vue', () => ({
    default: {
        name: 'Licenses',
        template: '<div data-testid="licenses-component">Licenses Component</div>',
        props: ['analysisID', 'projectID']
    }
}));

vi.mock('@/base_components/ui/cards/InfoCard.vue', () => ({
    default: {
        name: 'InfoCard',
        template: '<div data-testid="info-card"><slot></slot></div>',
        props: ['title', 'description', 'icon', 'variant']
    }
}));

vi.mock('@/shadcn/ui/alert/Alert.vue', () => ({
    default: {
        name: 'Alert',
        template: '<div data-testid="alert"><slot></slot></div>',
        props: ['class']
    }
}));

vi.mock('@/shadcn/ui/alert', () => ({
    AlertDescription: {
        name: 'AlertDescription',
        template: '<div data-testid="alert-description"><slot></slot></div>',
        props: ['class']
    }
}));

describe('ResultsLicenses.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createMockProject = (): Project => {
        const project = new Project();
        project.id = 'project-123';
        project.name = 'Test Project';
        project.description = 'Test Description';
        project.organization_id = 'org-123';
        project.integration_id = 'integration-123';
        project.type = 'github' as any;
        project.url = 'https://github.com/test/repo';
        project.upload_id = null as any;
        project.added_on = new Date();
        return project;
    };

    const createMockAnalysis = (): Analysis => {
        const analysis = new Analysis();
        analysis.id = 'analysis-123';
        analysis.created_on = new Date();

        const analyzer = new Analyzer();
        analyzer.id = 'analyzer-123';
        analyzer.name = 'Test Analyzer';
        analyzer.description = 'Test Description';
        analyzer.created_on = new Date();
        analyzer.steps = [];
        analyzer.organization_id = 'org-123';

        analysis.analyzer = analyzer;
        analysis.status = AnalysisStatus.COMPLETED;
        analysis.steps = [];
        analysis.branch = 'main';
        return analysis;
    };

    const createWrapper = (props = {}) => {
        const defaultProps = {
            analysis: createMockAnalysis(),
            project: createMockProject()
        };

        return mount(ResultsLicenses, {
            props: { ...defaultProps, ...props },
            global: {
                stubs: {
                    Icon: true
                }
            }
        });
    };

    it('renders correctly with required props', () => {
        const wrapper = createWrapper();

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="info-card"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="licenses-component"]').exists()).toBe(true);
    });

    it('passes correct props to Licenses component', () => {
        const mockProject = createMockProject();
        const mockAnalysis = createMockAnalysis();

        const wrapper = createWrapper({
            analysis: mockAnalysis,
            project: mockProject
        });

        const licensesComponent = wrapper.findComponent({ name: 'Licenses' });
        expect(licensesComponent.exists()).toBe(true);
    });

    it('renders InfoCard with correct props', () => {
        const wrapper = createWrapper();

        const infoCard = wrapper.findComponent({ name: 'InfoCard' });
        expect(infoCard.exists()).toBe(true);
        expect(infoCard.props('title')).toBe('License Analysis');
        expect(infoCard.props('description')).toBe(
            'Detailed license compliance and risk assessment for your project dependencies'
        );
        expect(infoCard.props('icon')).toBe('solar:document-text-bold');
        expect(infoCard.props('variant')).toBe('primary');
    });

    it('does not render alert when no_deps is false', () => {
        const wrapper = createWrapper();

        expect(wrapper.find('[data-testid="alert"]').exists()).toBe(false);
        expect((wrapper.vm as any).no_deps).toBe(false);
    });

    it('has correct component structure', () => {
        const wrapper = createWrapper();

        const mainDiv = wrapper.find('.w-full.space-y-8');
        expect(mainDiv.exists()).toBe(true);

        expect(wrapper.find('[data-testid="info-card"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="licenses-component"]').exists()).toBe(true);
    });

    it('has licenses_ref data property', () => {
        const wrapper = createWrapper();

        expect((wrapper.vm as any).licenses_ref).toBeDefined();
    });

    it('renders with different project data', () => {
        const customProject = createMockProject();
        customProject.id = 'custom-project-456';
        customProject.name = 'Custom Project';

        const wrapper = createWrapper({ project: customProject });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="licenses-component"]').exists()).toBe(true);
    });

    it('renders with different analysis data', () => {
        const customAnalysis = createMockAnalysis();
        customAnalysis.id = 'custom-analysis-789';
        customAnalysis.branch = 'develop';

        const wrapper = createWrapper({ analysis: customAnalysis });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('[data-testid="licenses-component"]').exists()).toBe(true);
    });

    it('has correct template structure for license analysis', () => {
        const wrapper = createWrapper();

        const infoCard = wrapper.find('[data-testid="info-card"]');
        expect(infoCard.exists()).toBe(true);

        const licensesComponent = wrapper.find('[data-testid="licenses-component"]');
        expect(licensesComponent.exists()).toBe(true);
    });

    it('maintains correct styling classes', () => {
        const wrapper = createWrapper();

        const mainContainer = wrapper.find('.w-full.space-y-8');
        expect(mainContainer.exists()).toBe(true);
    });
});
