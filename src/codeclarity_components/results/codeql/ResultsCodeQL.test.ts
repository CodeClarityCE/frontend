import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
// Pinia imports removed to prevent plugin duplication warnings
import ResultsCodeQL from './ResultsCodeQL.vue';
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { Analyzer } from '@/codeclarity_components/organizations/analyzers/Analyzer';
import { AnalysisStatus } from '@/codeclarity_components/analyses/analysis.entity';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '../results.repository';
import { Result } from '../result.entity';
import type { CodeQLResult } from './codeql.entity';
import type { DataResponse } from '@/utils/api/responses/DataResponse';

// Mock modules
vi.mock('../results.repository');

// Mock stores
vi.mock('@/stores/user', () => ({
    useUserStore: vi.fn()
}));

vi.mock('@/stores/auth', () => ({
    useAuthStore: vi.fn()
}));

// Mock BaseRepository to avoid dependency issues
vi.mock('@/utils/api/BaseRepository', () => ({
    BaseRepository: class MockBaseRepository {
        constructor() {}
    }
}));

// Mock UI components
vi.mock('@/shadcn/ui/alert/Alert.vue', () => ({
    default: {
        name: 'Alert',
        template: '<div data-testid="alert"><slot></slot></div>',
        props: ['class']
    }
}));

vi.mock('@/shadcn/ui/alert/AlertTitle.vue', () => ({
    default: {
        name: 'AlertTitle',
        template: '<div data-testid="alert-title"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/alert/AlertDescription.vue', () => ({
    default: {
        name: 'AlertDescription',
        template: '<div data-testid="alert-description"><slot></slot></div>'
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

vi.mock('@/shadcn/ui/badge', () => ({
    Badge: {
        name: 'Badge',
        template: '<div data-testid="badge"><slot></slot></div>',
        props: ['variant', 'class']
    }
}));

vi.mock('lucide-vue-next', () => ({
    Rocket: {
        name: 'Rocket',
        template: '<div data-testid="rocket-icon"></div>',
        props: ['class']
    }
}));

describe('ResultsCodeQL.vue', () => {
    let mockUserStore: any;
    let mockAuthStore: any;
    let mockResultsRepository: any;

    beforeEach(() => {

        mockUserStore = {
            getDefaultOrg: { id: 'org-123' }
        };
        mockAuthStore = {
            getToken: 'mock-token'
        };

        vi.mocked(useUserStore).mockReturnValue(mockUserStore);
        vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);

        mockResultsRepository = {
            getResultByType: vi.fn().mockResolvedValue({ data: null })
        };
        vi.mocked(ResultsRepository).mockImplementation(() => mockResultsRepository);
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

    const createMockCodeQLResult = (): CodeQLResult => {
        return {
            ruleId: 'js/unused-variable',
            ruleIndex: 0,
            message: {
                text: 'Unused variable detected'
            },
            locations: [
                {
                    physicalLocation: {
                        artifactLocation: {
                            uri: 'src/main.js',
                            uriBaseId: 'base',
                            index: 0
                        },
                        region: {
                            startLine: 10,
                            endLine: 10,
                            startColumn: 5,
                            endColumn: 15
                        }
                    }
                }
            ]
        };
    };

    const createMockResult = (codeqlResults: CodeQLResult[] = []): Result => {
        const result = new Result();
        result.result = {
            workspaces: {
                '.': {
                    results: codeqlResults
                }
            }
        };
        return result;
    };

    const createWrapper = (props = {}) => {
        const defaultProps = {
            analysis: createMockAnalysis(),
            project: createMockProject()
        };

        return mount(ResultsCodeQL, {
            props: { ...defaultProps, ...props }
        });
    };

    it('renders correctly with required props', () => {
        const wrapper = createWrapper();
        expect(wrapper.exists()).toBe(true);
    });

    it('shows "Well done" alert when no CodeQL results', async () => {
        const mockResult = createMockResult([]);
        mockResultsRepository.getResultByType.mockResolvedValue({
            data: mockResult
        } as DataResponse<Result>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.find('[data-testid="alert"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="alert-title"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="alert-description"]').exists()).toBe(true);
        });

        const alertTitle = wrapper.find('[data-testid="alert-title"]');
        const alertDescription = wrapper.find('[data-testid="alert-description"]');
        expect(alertTitle.text()).toBe('Well done!');
        expect(alertDescription.text()).toBe("Everything looks fine! CodeQL didn't find anything");
    });

    it('renders CodeQL results when available', async () => {
        const mockCodeQLResults = [createMockCodeQLResult()];
        const mockResult = createMockResult(mockCodeQLResults);

        mockResultsRepository.getResultByType.mockResolvedValue({
            data: mockResult
        } as DataResponse<Result>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.find('[data-testid="card"]').exists()).toBe(true);
        });

        expect(wrapper.findAll('[data-testid="card"]')).toHaveLength(1);
        expect(wrapper.find('[data-testid="card-title"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="card-description"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="card-content"]').exists()).toBe(true);
    });

    it('displays correct CodeQL result information', async () => {
        const mockCodeQLResults = [createMockCodeQLResult()];
        const mockResult = createMockResult(mockCodeQLResults);

        mockResultsRepository.getResultByType.mockResolvedValue({
            data: mockResult
        } as DataResponse<Result>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.find('[data-testid="card-title"]').exists()).toBe(true);
        });

        const cardTitle = wrapper.find('[data-testid="card-title"]');
        const cardDescription = wrapper.find('[data-testid="card-description"]');

        expect(cardTitle.text()).toBe('js/unused-variable');
        expect(cardDescription.text()).toBe('Unused variable detected');
    });

    it('renders multiple CodeQL results', async () => {
        const mockCodeQLResults = [
            createMockCodeQLResult(),
            {
                ...createMockCodeQLResult(),
                ruleId: 'js/security-issue',
                ruleIndex: 1,
                message: { text: 'Security vulnerability found' }
            }
        ];
        const mockResult = createMockResult(mockCodeQLResults);

        mockResultsRepository.getResultByType.mockResolvedValue({
            data: mockResult
        } as DataResponse<Result>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.findAll('[data-testid="card"]')).toHaveLength(2);
        });

        expect(wrapper.findAll('[data-testid="card-title"]')).toHaveLength(2);
        expect(wrapper.findAll('[data-testid="card-description"]')).toHaveLength(2);
    });

    it('renders location badges correctly', async () => {
        const mockCodeQLResults = [createMockCodeQLResult()];
        const mockResult = createMockResult(mockCodeQLResults);

        mockResultsRepository.getResultByType.mockResolvedValue({
            data: mockResult
        } as DataResponse<Result>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.findAll('[data-testid="badge"]').length).toBeGreaterThan(0);
        });

        // Should have badges for file, start line, end line, start column, end column
        expect(wrapper.findAll('[data-testid="badge"]').length).toBeGreaterThanOrEqual(5);
    });

    it('calls API with correct parameters', async () => {
        const mockProject = createMockProject();
        const mockAnalysis = createMockAnalysis();

        mockResultsRepository.getResultByType.mockResolvedValue({
            data: createMockResult([])
        } as DataResponse<Result>);

        createWrapper({ analysis: mockAnalysis, project: mockProject });

        expect(mockResultsRepository.getResultByType).toHaveBeenCalledWith({
            orgId: 'org-123',
            projectId: 'project-123',
            analysisId: 'analysis-123',
            type: 'codeql',
            bearerToken: 'mock-token'
        });
    });

    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockResultsRepository.getResultByType.mockRejectedValue(new Error('API Error'));

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        // Should show the "Well done" alert when there's an error (empty results)
        expect(wrapper.find('[data-testid="alert"]').exists()).toBe(true);

        consoleSpy.mockRestore();
    });

    it('handles missing default organization', async () => {
        mockUserStore.getDefaultOrg = null;

        createWrapper();

        expect(mockResultsRepository.getResultByType).toHaveBeenCalledWith({
            orgId: '',
            projectId: 'project-123',
            analysisId: 'analysis-123',
            type: 'codeql',
            bearerToken: 'mock-token'
        });
    });

    it('handles missing auth token', async () => {
        mockAuthStore.getToken = null;

        createWrapper();

        expect(mockResultsRepository.getResultByType).toHaveBeenCalledWith({
            orgId: 'org-123',
            projectId: 'project-123',
            analysisId: 'analysis-123',
            type: 'codeql',
            bearerToken: ''
        });
    });

    it('has correct grid layout for results', async () => {
        const mockCodeQLResults = [createMockCodeQLResult()];
        const mockResult = createMockResult(mockCodeQLResults);

        mockResultsRepository.getResultByType.mockResolvedValue({
            data: mockResult
        } as DataResponse<Result>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.find('.grid.md\\:grid-cols-2.xl\\:grid-cols-3.gap-2').exists()).toBe(
                true
            );
        });
    });

    it('has correct alert layout when no results', async () => {
        const mockResult = createMockResult([]);
        mockResultsRepository.getResultByType.mockResolvedValue({
            data: mockResult
        } as DataResponse<Result>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.find('.flex.justify-center').exists()).toBe(true);
        });
    });
});
