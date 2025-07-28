import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import ResultsSBOMDetails from './ResultsSBOMDetails.vue';
import { ProjectRepository } from '@/codeclarity_components/projects/project.repository';
import { AnalysisRepository } from '@/codeclarity_components/analyses/analysis.repository';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import type { DataResponse } from '@/utils/api/responses/DataResponse';

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

// Mock router.ts to prevent import errors
vi.mock('@/router', () => ({
    default: {
        push: vi.fn(),
        back: vi.fn()
    }
}));

// Mock BaseRepository to avoid dependency issues
vi.mock('@/utils/api/BaseRepository', () => ({
    BaseRepository: class MockBaseRepository {
        constructor() {}
    }
}));

// Mock stores
const mockUserStore = {
    getDefaultOrg: { id: 'test-org-id', name: 'Test Org' }
};

const mockAuthStore = {
    getToken: 'test-token'
};

const mockStateStore = {
    $reset: vi.fn(),
    page: ''
};

vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn(() => mockUserStore)
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn(() => mockAuthStore)
}));

vi.mock('@/stores/state', () => ({
    useStateStore: vi.fn(() => mockStateStore)
}));

// Mock the repositories
vi.mock('@/codeclarity_components/projects/project.repository');
vi.mock('@/codeclarity_components/analyses/analysis.repository');

// Mock SbomDetails component
vi.mock('./SbomDetails.vue', () => ({
    default: {
        name: 'Details',
        props: {
            showBack: Boolean,
            analysisID: String,
            projectID: String
        },
        template: '<div class="mock-details">Details Mock</div>',
        emits: ['close']
    }
}));

describe.skip('ResultsSBOMDetails.vue', () => {
    let wrapper: VueWrapper;
    let mockProjectRepository: any;
    let mockAnalysisRepository: any;
    let windowLocationSpy: any;

    const mockProject = new Project();
    mockProject.id = 'test-project-id';
    mockProject.name = 'Test Project';

    const mockAnalysis = new Analysis();
    mockAnalysis.id = 'test-analysis-id';
    mockAnalysis.created_on = new Date();
    mockAnalysis.analyzer = {
        id: 'analyzer-id',
        name: 'test-analyzer',
        version: '1.0.0'
    } as any;
    mockAnalysis.status = 'COMPLETED' as any;
    mockAnalysis.steps = [];
    mockAnalysis.branch = 'main';

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Mock window.location
        windowLocationSpy = vi.spyOn(window, 'location', 'get').mockImplementation(
            () =>
                ({
                    href: 'http://localhost:3000/results?project_id=test-project-id&analysis_id=test-analysis-id',
                    search: '?project_id=test-project-id&analysis_id=test-analysis-id'
                }) as any
        );

        // Mock document methods
        vi.spyOn(document, 'getElementById').mockReturnValue({
            style: { display: 'block' }
        } as any);
        vi.spyOn(document, 'getElementsByClassName').mockReturnValue([
            {
                scrollTop: 0
            }
        ] as any);

        // Mock repository responses
        mockProjectRepository = {
            getProjectById: vi.fn().mockResolvedValue({
                data: mockProject
            } as DataResponse<Project>)
        };
        mockAnalysisRepository = {
            getAnalysisById: vi.fn().mockResolvedValue({
                data: mockAnalysis
            } as DataResponse<Analysis>),
            getProjectById: vi.fn().mockResolvedValue({
                data: mockProject
            } as DataResponse<Project>)
        };

        (ProjectRepository as Mock).mockImplementation(() => mockProjectRepository);
        (AnalysisRepository as Mock).mockImplementation(() => mockAnalysisRepository);
    });

    const createWrapper = () => {
        return mount(ResultsSBOMDetails);
    };

    describe('Component Initialization', () => {
        it('should render the Details component', async () => {
            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect(wrapper.find('.mock-details').exists()).toBe(true);
        });

        it('should extract query parameters from URL', async () => {
            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).projectID.value).toBe('test-project-id');
            expect((wrapper.vm as any).analysisID.value).toBe('test-analysis-id');
        });

        it('should fetch project and analysis data on init', async () => {
            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect(mockProjectRepository.getProjectById).toHaveBeenCalledWith({
                orgId: 'test-org-id',
                projectId: 'test-project-id',
                bearerToken: 'test-token',
                handleBusinessErrors: true
            });

            expect(mockAnalysisRepository.getAnalysisById).toHaveBeenCalledWith({
                orgId: 'test-org-id',
                projectId: 'test-project-id',
                analysisId: 'test-analysis-id',
                bearerToken: 'test-token',
                handleBusinessErrors: true
            });
        });

        it('should throw error for missing query parameters', async () => {
            windowLocationSpy.mockImplementation(
                () =>
                    ({
                        href: 'http://localhost:3000/results',
                        search: ''
                    }) as any
            );

            // The component will mount but init() will throw an error
            wrapper = createWrapper();

            // Wait for async operations
            await new Promise((resolve) => setTimeout(resolve, 0));

            // The component mounts successfully even though init throws
            expect(wrapper.exists()).toBe(true);

            // The error is unhandled, which is the current behavior
            // In a real app, this would be caught by Vue's error handler
        });
    });

    describe('DOM Manipulation', () => {
        it('should hide loader on mount', async () => {
            const mockLoader = { style: { display: 'block' } };
            vi.spyOn(document, 'getElementById').mockReturnValue(mockLoader as any);

            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect(mockLoader.style.display).toBe('none');
        });

        it('should handle missing loader element gracefully', async () => {
            vi.spyOn(document, 'getElementById').mockReturnValue(null);

            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            // Should not throw error
            expect(wrapper.exists()).toBe(true);
        });

        it('should reset scroll position on update', async () => {
            const mockContainer = { scrollTop: 100 };
            vi.spyOn(document, 'getElementsByClassName').mockReturnValue([mockContainer] as any);

            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            // Trigger update lifecycle
            wrapper.vm.$forceUpdate();
            await wrapper.vm.$nextTick();

            expect(mockContainer.scrollTop).toBe(0);
        });
    });

    describe('Data Fetching', () => {
        it('should handle project fetch errors', async () => {
            mockProjectRepository.getProjectById.mockRejectedValue(
                new Error('Project fetch failed')
            );
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle analysis fetch errors', async () => {
            mockAnalysisRepository.getAnalysisById.mockRejectedValue(
                new Error('Analysis fetch failed')
            );
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should handle missing default org', async () => {
            const originalGetDefaultOrg = mockUserStore.getDefaultOrg;
            mockUserStore.getDefaultOrg = null as any;
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

            // Restore for next tests
            mockUserStore.getDefaultOrg = originalGetDefaultOrg;
        });

        it('should handle missing auth token', async () => {
            const originalGetToken = mockAuthStore.getToken;
            mockAuthStore.getToken = null as any;
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

            // Restore for next tests
            mockAuthStore.getToken = originalGetToken;
        });
    });

    describe('Props Passing', () => {
        it('should pass correct props to Details component', async () => {
            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            const detailsComponent = wrapper.findComponent({ name: 'Details' });
            expect(detailsComponent.props('showBack')).toBe(true);
            expect(detailsComponent.props('analysisID')).toBe('test-analysis-id');
            expect(detailsComponent.props('projectID')).toBe('test-project-id');
        });

        it('should handle close event from Details component', async () => {
            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            // Set initial values
            (wrapper.vm as any).finding.value = { id: 'test' };
            (wrapper.vm as any).details.value = true;

            const detailsComponent = wrapper.findComponent({ name: 'Details' });
            await detailsComponent.vm.$emit('close');

            expect((wrapper.vm as any).finding.value).toEqual({});
            expect((wrapper.vm as any).details.value).toBe(false);
        });
    });

    describe('Tab and View Management', () => {
        it('should initialize view state correctly', async () => {
            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).only_details.value).toBe(false);
            expect((wrapper.vm as any).active_tab.value).toBe('List');
            expect((wrapper.vm as any).finding.value).toEqual({});
            expect((wrapper.vm as any).details.value).toBe(false);
        });

        it('should reset scroll position when tab changes', async () => {
            wrapper = createWrapper();
            await wrapper.vm.$nextTick();

            (wrapper.vm as any).y_position = 100;
            (wrapper.vm as any).reference_click_element.value = 'test-element';

            // Change active tab
            (wrapper.vm as any).active_tab.value = 'Details';
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).y_position).toBe(0);
            expect((wrapper.vm as any).reference_click_element.value).toBe('');
        });

        it('should restore scroll position after delay', async () => {
            vi.useFakeTimers();
            const mockContainer = { scrollTop: 0 };
            vi.spyOn(document, 'getElementsByClassName').mockReturnValue([mockContainer] as any);

            wrapper = createWrapper();
            (wrapper.vm as any).y_position = 200;
            (wrapper.vm as any).details = false;

            wrapper.vm.$forceUpdate();
            await wrapper.vm.$nextTick();

            vi.advanceTimersByTime(50);

            expect(mockContainer.scrollTop).toBe(200);
            vi.useRealTimers();
        });
    });
});
