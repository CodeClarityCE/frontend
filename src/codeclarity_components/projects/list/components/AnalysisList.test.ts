import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { AnalysisStatus, type Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import AnalysisList from './AnalysisList.vue';

// Mock child components
vi.mock('./AnalysisItem.vue', () => ({
    default: {
        name: 'AnalysisItem',
        template: '<div data-testid="analysis-item">Analysis Item</div>',
        props: ['analysis', 'projectID']
    }
}));

// Mock Shadcn components
vi.mock('@/shadcn/ui/collapsible/Collapsible.vue', () => ({
    default: {
        name: 'Collapsible',
        template: '<div data-testid="collapsible"><slot></slot></div>',
        props: ['open'],
        emits: ['update:open']
    }
}));

vi.mock('@/shadcn/ui/collapsible/CollapsibleContent.vue', () => ({
    default: {
        name: 'CollapsibleContent',
        template: '<div data-testid="collapsible-content"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/collapsible/CollapsibleTrigger.vue', () => ({
    default: {
        name: 'CollapsibleTrigger',
        template:
            '<button data-testid="collapsible-trigger" @click="$emit(\'click\')"><slot></slot></button>',
        emits: ['click']
    }
}));

describe('AnalysisList', () => {
    let wrapper: any;
    const mockAnalyses: Analysis[] = [
        {
            id: 'analysis-1',
            created_on: new Date('2023-01-01T00:00:00Z'),
            analyzer: { id: 'analyzer-1', name: 'Test Analyzer' } as any,
            status: AnalysisStatus.COMPLETED,
            steps: [],
            branch: 'main'
        },
        {
            id: 'analysis-2',
            created_on: new Date('2023-01-02T00:00:00Z'),
            analyzer: { id: 'analyzer-2', name: 'Test Analyzer 2' } as any,
            status: AnalysisStatus.STARTED,
            steps: [],
            branch: 'main'
        },
        {
            id: 'analysis-3',
            created_on: new Date('2023-01-03T00:00:00Z'),
            analyzer: { id: 'analyzer-3', name: 'Test Analyzer 3' } as any,
            status: AnalysisStatus.FINISHED,
            steps: [],
            branch: 'main'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'project-1'
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'Collapsible' }).exists()).toBe(true);
    });

    it('displays the most recent analysis by default', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'project-1'
            }
        });

        // The component shows all analysis items, but only the first one is visible by default
        // The rest are inside CollapsibleContent
        const analysisItems = wrapper.findAllComponents({ name: 'AnalysisItem' });
        expect(analysisItems.length).toBeGreaterThan(0);
        // The component sorts by date, so analysis-3 (most recent) should be first
        expect(analysisItems[0]!.props().analysis).toEqual(mockAnalyses[2]!);
        expect(analysisItems[0]!.props().projectID).toBe('project-1');
    });

    it('shows expand button when there are multiple analyses', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'project-1'
            }
        });

        const trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.exists()).toBe(true);
        expect(trigger.text()).toContain('Show 2 older analyses');
    });

    it('hides expand button when there is only one analysis', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: [mockAnalyses[0]!],
                projectID: 'project-1'
            }
        });

        const trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.exists()).toBe(false);
    });

    it('handles empty analyses array', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: [],
                projectID: 'project-1'
            }
        });

        const analysisItems = wrapper.findAllComponents({ name: 'AnalysisItem' });
        expect(analysisItems).toHaveLength(0);

        const trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.exists()).toBe(false);
    });

    it('uses correct singular/plural text for older analyses', () => {
        // Test with 2 total analyses (1 older)
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses.slice(0, 2),
                projectID: 'project-1'
            }
        });

        let trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.text()).toContain('Show 1 older analysis');

        wrapper.unmount();

        // Test with 3 total analyses (2 older)
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'project-1'
            }
        });

        trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.text()).toContain('Show 2 older analyses');
    });

    it('toggles between show and hide text', async () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'project-1'
            }
        });

        let trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.text()).toContain('Show 2 older analyses');

        // Simulate opening
        wrapper.vm.isOpen = true;
        await wrapper.vm.$nextTick();

        trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.text()).toContain('Hide 2 older analyses');
    });

    it('passes correct props to AnalysisItem', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'test-project-id'
            }
        });

        const analysisItem = wrapper.findComponent({ name: 'AnalysisItem' });
        // The component sorts by date, so analysis-3 (most recent) should be first
        expect(analysisItem?.props().analysis).toEqual(mockAnalyses[2]!);
        expect(analysisItem?.props().projectID).toBe('test-project-id');
    });

    it('uses default props when not provided', () => {
        wrapper = mount(AnalysisList);

        expect(wrapper.props().analyses).toEqual([]);
        expect(wrapper.props().projectID).toBe('');
    });

    it('has correct collapsible state management', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'project-1'
            }
        });

        expect(wrapper.vm.isOpen).toBe(false);

        wrapper.vm.isOpen = true;
        expect(wrapper.vm.isOpen).toBe(true);
    });

    it('applies correct CSS classes to trigger button', () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: mockAnalyses,
                projectID: 'project-1'
            }
        });

        const trigger = wrapper.findComponent({ name: 'CollapsibleTrigger' });
        expect(trigger.classes()).toContain('flex');
        expect(trigger.classes()).toContain('items-center');
        expect(trigger.classes()).toContain('justify-center');
    });

    it('maintains reactive state correctly', async () => {
        wrapper = mount(AnalysisList, {
            props: {
                analyses: [mockAnalyses[0]!],
                projectID: 'project-1'
            }
        });

        // Should not show trigger initially
        expect(wrapper.findComponent({ name: 'CollapsibleTrigger' }).exists()).toBe(false);

        // Update to multiple analyses
        await wrapper.setProps({ analyses: mockAnalyses });

        // Should now show trigger
        expect(wrapper.findComponent({ name: 'CollapsibleTrigger' }).exists()).toBe(true);
    });
});
