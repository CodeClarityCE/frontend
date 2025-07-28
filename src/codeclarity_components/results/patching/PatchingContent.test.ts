import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import PatchingContent from './PatchingContent.vue';
import { PatchingStats } from '@/codeclarity_components/results/stats.entity';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '../results.repository';
import type { DataResponse } from '@/utils/api/responses/DataResponse';

// Mock modules
vi.mock('../results.repository');
vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn()
}));
vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn()
}));

// Mock child components
vi.mock('./PatchingPatches.vue', () => ({
    default: {
        name: 'Patches',
        template: '<div data-testid="patches">Patches</div>',
        props: ['analysisID', 'projectID']
    }
}));

vi.mock('./PatchingTable.vue', () => ({
    default: {
        name: 'PatchesTable',
        template: '<div data-testid="patches-table">Patches Table</div>',
        props: ['analysisID', 'projectID']
    }
}));

vi.mock('../SelectWorkspace.vue', () => ({
    default: {
        name: 'SelectWorkspace',
        template: '<div data-testid="select-workspace">Select Workspace</div>',
        props: ['projectID', 'analysisID', 'error', 'selectedWorkspace'],
        emits: ['update:error', 'update:selectedWorkspace']
    }
}));

vi.mock('@/base_components/ui/loaders/TextLoader.vue', () => ({
    default: {
        name: 'TextLoader',
        template: '<div data-testid="text-loader">Loading...</div>'
    }
}));

vi.mock('@/base_components/ui/loaders/BoxLoader.vue', () => ({
    default: {
        name: 'BoxLoader',
        template: '<div data-testid="box-loader">Loading...</div>',
        props: ['dimensions']
    }
}));

vi.mock('@/base_components/data-display/charts/RadarChart.vue', () => ({
    default: {
        name: 'RadarChart',
        template: '<div data-testid="radar-chart">Radar Chart</div>',
        props: ['id', 'data', 'options']
    }
}));

vi.mock('@/base_components/data-display/charts/GroupedBarChart.vue', () => ({
    default: {
        name: 'GroupedBarChart',
        template: '<div data-testid="grouped-bar-chart">Grouped Bar Chart</div>',
        props: ['id', 'data', 'options']
    }
}));

vi.mock('@/shadcn/ui/card', () => ({
    Card: {
        name: 'Card',
        template: '<div data-testid="card"><slot></slot></div>',
        props: ['class']
    },
    CardContent: {
        name: 'CardContent',
        template: '<div data-testid="card-content"><slot></slot></div>',
        props: ['class']
    },
    CardDescription: {
        name: 'CardDescription',
        template: '<div data-testid="card-description"><slot></slot></div>'
    },
    CardHeader: {
        name: 'CardHeader',
        template: '<div data-testid="card-header"><slot></slot></div>'
    },
    CardTitle: {
        name: 'CardTitle',
        template: '<div data-testid="card-title"><slot></slot></div>'
    }
}));

describe.skip('PatchingContent.vue', () => {
    let mockUserStore: any;
    let mockAuthStore: any;
    let mockResultsRepository: any;

    beforeEach(() => {
        createPinia();
        // setActivePinia removed to prevent plugin duplication warnings

        mockUserStore = {
            getDefaultOrg: { id: 'org-123' }
        };
        mockAuthStore = {
            getAuthenticated: true,
            getToken: 'mock-token'
        };

        vi.mocked(useUserStore).mockReturnValue(mockUserStore);
        vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);

        mockResultsRepository = {
            getPatchesStat: vi.fn().mockResolvedValue({ data: null })
        };
        vi.mocked(ResultsRepository).mockImplementation(() => mockResultsRepository);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createMockPatchingStats = (): PatchingStats => {
        const stats = new PatchingStats();
        stats.before_patch_number_of_critical = 5;
        stats.after_patch_number_of_critical = 2;
        stats.before_patch_number_of_high = 8;
        stats.after_patch_number_of_high = 3;
        stats.before_patch_number_of_medium = 12;
        stats.after_patch_number_of_medium = 6;
        stats.before_patch_number_of_low = 3;
        stats.after_patch_number_of_low = 1;
        stats.before_patch_number_of_none = 0;
        stats.after_patch_number_of_none = 0;
        stats.before_patch_overall_confidentiality_impact = 0.8;
        stats.after_patch_overall_confidentiality_impact = 0.4;
        stats.before_patch_overall_integrity_impact = 0.7;
        stats.after_patch_overall_integrity_impact = 0.3;
        stats.before_patch_overall_availability_impact = 0.6;
        stats.after_patch_overall_availability_impact = 0.2;
        stats.before_patch_number_of_issues = 28;
        stats.after_patch_number_of_issues = 12;
        stats.before_patch_number_of_vulnerabilities = 28;
        stats.after_patch_number_of_vulnerabilities = 12;
        stats.before_patch_number_of_vulnerable_dependencies = 15;
        stats.after_patch_number_of_vulnerable_dependencies = 8;
        return stats;
    };

    const createWrapper = (props = {}) => {
        const defaultProps = {
            analysisID: 'analysis-123',
            projectID: 'project-123'
        };

        return mount(PatchingContent, {
            props: { ...defaultProps, ...props },
            global: {
                stubs: {
                    Icon: true
                }
            }
        });
    };

    it('renders workspace selector', () => {
        const wrapper = createWrapper();
        expect(wrapper.find('[data-testid="select-workspace"]').exists()).toBe(true);
    });

    it('renders loading state initially', () => {
        const wrapper = createWrapper();
        expect(wrapper.find('[data-testid="text-loader"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="box-loader"]').exists()).toBe(true);
    });

    it('renders cards structure', () => {
        const wrapper = createWrapper();
        expect(wrapper.findAll('[data-testid="card"]').length).toBeGreaterThan(0);
        expect(wrapper.find('[data-testid="card-title"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="card-content"]').exists()).toBe(true);
    });

    it('renders patches table and patches components', () => {
        const wrapper = createWrapper();
        expect(wrapper.find('[data-testid="patches-table"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="patches"]').exists()).toBe(true);
    });

    it('fetches patching stats on mount', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        createWrapper();

        expect(mockResultsRepository.getPatchesStat).toHaveBeenCalledWith({
            orgId: 'org-123',
            projectId: 'project-123',
            analysisId: 'analysis-123',
            workspace: '.',
            bearerToken: 'mock-token',
            handleBusinessErrors: true
        });
    });

    it('handles missing default organization', async () => {
        mockUserStore.getDefaultOrg = null;

        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        expect(mockResultsRepository.getPatchesStat).not.toHaveBeenCalled();
    });

    it('handles unauthenticated user', async () => {
        mockAuthStore.getAuthenticated = false;

        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        expect(mockResultsRepository.getPatchesStat).not.toHaveBeenCalled();
    });

    it('handles missing token', async () => {
        mockAuthStore.getToken = null;

        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        expect(mockResultsRepository.getPatchesStat).not.toHaveBeenCalled();
    });

    it('handles empty project or analysis ID', async () => {
        const wrapper = createWrapper({ projectID: '', analysisID: '' });
        await wrapper.vm.$nextTick();

        expect(mockResultsRepository.getPatchesStat).not.toHaveBeenCalled();
    });

    it('renders severity data after successful fetch', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.find('[data-testid="grouped-bar-chart"]').exists()).toBe(true);
    });

    it('renders radar chart after successful fetch', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.find('[data-testid="radar-chart"]').exists()).toBe(true);
    });

    it('creates severity chart data correctly', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        const severityData = (wrapper.vm as any).severity_data;
        expect(severityData.categories).toContain('Critical');
        expect(severityData.categories).toContain('High');
        expect(severityData.categories).toContain('Medium');
        expect(severityData.categories).toContain('Low');
        expect(severityData.groups).toHaveLength(2);
        expect(severityData.groups[0].name).toBe('Before Patch');
        expect(severityData.groups[1].name).toBe('After Patch');
    });

    it('creates CIA radar chart data correctly', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        const ciaData = (wrapper.vm as any).cia_data;
        expect(ciaData).toHaveLength(2);
        expect(ciaData[0].name).toBe('Before Patch');
        expect(ciaData[1].name).toBe('After Patch');
        expect(ciaData[0].axes).toHaveLength(3);
        expect(ciaData[0].axes.map((axis: any) => axis.axis)).toEqual([
            'Confidentiality',
            'Integrity',
            'Availability'
        ]);
    });

    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockResultsRepository.getPatchesStat.mockRejectedValue(new Error('API Error'));

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).error).toBe(true);
            expect((wrapper.vm as any).render).toBe(false);
        });

        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('watches for workspace changes', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        // Clear initial call
        mockResultsRepository.getPatchesStat.mockClear();

        // Change workspace
        (wrapper.vm as any).selected_workspace = '/src';
        await wrapper.vm.$nextTick();

        expect(mockResultsRepository.getPatchesStat).toHaveBeenCalledWith({
            orgId: 'org-123',
            projectId: 'project-123',
            analysisId: 'analysis-123',
            workspace: '/src',
            bearerToken: 'mock-token',
            handleBusinessErrors: true
        });
    });

    it('watches for projectID changes', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        // Clear initial call
        mockResultsRepository.getPatchesStat.mockClear();

        // Change projectID
        await wrapper.setProps({ projectID: 'new-project-456' });

        expect(mockResultsRepository.getPatchesStat).toHaveBeenCalledTimes(1);
    });

    it('watches for analysisID changes', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        // Clear initial call
        mockResultsRepository.getPatchesStat.mockClear();

        // Change analysisID
        await wrapper.setProps({ analysisID: 'new-analysis-789' });

        expect(mockResultsRepository.getPatchesStat).toHaveBeenCalledTimes(1);
    });

    it('displays correct severity statistics', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        await wrapper.vm.$nextTick();

        const html = wrapper.html();
        expect(html).toContain('5'); // before_patch_number_of_critical
        expect(html).toContain('2'); // after_patch_number_of_critical
        expect(html).toContain('8'); // before_patch_number_of_high
        expect(html).toContain('3'); // after_patch_number_of_high
    });

    it('displays correct CIA impact statistics', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        await wrapper.vm.$nextTick();

        const html = wrapper.html();
        expect(html).toContain('0.8'); // before_patch_overall_confidentiality_impact
        expect(html).toContain('0.4'); // after_patch_overall_confidentiality_impact
    });

    it('displays correct issue and vulnerability counts', async () => {
        const mockStats = createMockPatchingStats();
        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        await wrapper.vm.$nextTick();

        const html = wrapper.html();
        expect(html).toContain('12'); // after_patch_number_of_issues
        expect(html).toContain('28'); // before_patch_number_of_issues
    });

    it('skips categories with zero values in severity chart', async () => {
        const mockStats = createMockPatchingStats();
        // Set some categories to zero
        mockStats.before_patch_number_of_none = 0;
        mockStats.after_patch_number_of_none = 0;

        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        const severityData = (wrapper.vm as any).severity_data;
        expect(severityData.categories).not.toContain('None');
    });

    it('includes categories with non-zero values in severity chart', async () => {
        const mockStats = createMockPatchingStats();

        mockResultsRepository.getPatchesStat.mockResolvedValue({
            data: mockStats
        } as DataResponse<PatchingStats>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect((wrapper.vm as any).render).toBe(true);
        });

        const severityData = (wrapper.vm as any).severity_data;
        expect(severityData.categories).toContain('Critical');
        expect(severityData.categories).toContain('High');
        expect(severityData.categories).toContain('Medium');
        expect(severityData.categories).toContain('Low');
    });
});
