import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import VulnDetails from './VulnDetails.vue';
import { VulnerabilityDetails } from './VulnDetails/VulnDetails';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { ResultsRepository } from '../results.repository';
import type { DataResponse } from '@/utils/api/responses/DataResponse';

// Mock modules
vi.mock('@/router.ts', () => ({
    default: {
        back: vi.fn()
    }
}));

vi.mock('../results.repository');
vi.mock('@/stores/user');
vi.mock('@/stores/auth');

// Mock child components
vi.mock('./VulnDetails/VulnDetailsHeader.vue', () => ({
    default: {
        name: 'VulnDetailsHeader',
        template: '<div data-testid="vuln-details-header">VulnDetailsHeader</div>'
    }
}));

vi.mock('./VulnDetails/VulnSummaryContent.vue', () => ({
    default: {
        name: 'VulnSummaryContent',
        template: '<div data-testid="vuln-summary-content">VulnSummaryContent</div>'
    }
}));

vi.mock('./VulnDetails/VulnerabilitySeverities.vue', () => ({
    default: {
        name: 'VulnerabilitySeverities',
        template: '<div data-testid="vulnerability-severities">VulnerabilitySeverities</div>'
    }
}));

vi.mock('./VulnDetails/VulnDetailsLoader.vue', () => ({
    default: {
        name: 'VulnDetailsLoader',
        template: '<div data-testid="vuln-details-loader">Loading...</div>'
    }
}));

vi.mock('./VulnDetails/VulnReferences.vue', () => ({
    default: {
        name: 'VulnReferences',
        template: '<div data-testid="vuln-references">VulnReferences</div>'
    }
}));

vi.mock('./VulnDetails/VulnSecurityAnalysis.vue', () => ({
    default: {
        name: 'VulnSecurityAnalysis',
        template: '<div data-testid="vuln-security-analysis">VulnSecurityAnalysis</div>'
    }
}));

vi.mock('@/base_components/ui/modals/CenteredModal.vue', () => ({
    default: {
        name: 'CenteredModal',
        template: '<div data-testid="centered-modal"><slot name="content"></slot></div>',
        methods: {
            show: vi.fn(),
            toggle: vi.fn()
        }
    }
}));

vi.mock('@/base_components/ui/modals/PositionedModal.vue', () => ({
    default: {
        name: 'PositionedModal',
        template: '<div data-testid="positioned-modal"><slot name="content"></slot></div>',
        methods: {
            toggle: vi.fn()
        }
    }
}));

vi.mock('@/base_components/ui/cards/InfoCard.vue', () => ({
    default: {
        name: 'InfoCard',
        template: '<div data-testid="info-card"><slot></slot></div>',
        props: ['title', 'description', 'icon', 'variant', 'class']
    }
}));

vi.mock('@/base_components/ui/cards/StatCard.vue', () => ({
    default: {
        name: 'StatCard',
        template: '<div data-testid="stat-card">{{ label }}: {{ value }}</div>',
        props: ['label', 'value', 'icon', 'variant', 'subtitle', 'subtitleIcon']
    }
}));

vi.mock('@/shadcn/ui/badge/Badge.vue', () => ({
    default: {
        name: 'Badge',
        template: '<div data-testid="badge"><slot></slot></div>',
        props: ['variant', 'title', 'class']
    }
}));

vi.mock('@/shadcn/ui/button/Button.vue', () => ({
    default: {
        name: 'Button',
        template: '<button data-testid="button"><slot></slot></button>',
        props: ['variant']
    }
}));

vi.mock('@/base_components/ui/InfoMarkdown.vue', () => ({
    default: {
        name: 'InfoMarkdown',
        template: '<div data-testid="info-markdown">{{ markdown }}</div>',
        props: ['markdown', 'class']
    }
}));

describe('VulnDetails.vue', () => {
    let mockUserStore: any;
    let mockAuthStore: any;
    let mockResultsRepository: any;

    beforeEach(() => {
        setActivePinia(createPinia());

        mockUserStore = {
            getDefaultOrg: { id: 'org-123' }
        };
        mockAuthStore = {
            getToken: 'mock-token'
        };

        vi.mocked(useUserStore).mockReturnValue(mockUserStore);
        vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);

        mockResultsRepository = {
            getFinding: vi.fn()
        };
        vi.mocked(ResultsRepository).mockImplementation(() => mockResultsRepository);

        // Mock URL params
        Object.defineProperty(window, 'location', {
            value: {
                search: '?finding_id=vuln-123'
            },
            writable: true
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createMockVulnerabilityDetails = (): VulnerabilityDetails => {
        const vuln = new VulnerabilityDetails();
        vuln.vulnerability_info = {
            vulnerability_id: 'CVE-2023-1234',
            version_info: {
                versions: [
                    { version: '1.0.0', status: 'affected', release: '2023-01-01' },
                    { version: '1.1.0', status: 'not_affected', release: '2023-02-01' }
                ]
            }
        };
        vuln.dependency_info = {
            version: '1.0.0'
        };
        vuln.severities = {
            cvss_31: { base_score: 7.5 },
            cvss_3: null,
            cvss_2: null
        };
        vuln.references = [{ url: 'https://example.com', type: 'advisory' }];
        vuln.other = {
            package_manager: 'npm'
        };
        return vuln;
    };

    const createWrapper = (props = {}) => {
        const defaultProps = {
            analysisID: 'analysis-123',
            projectID: 'project-123',
            showBack: false
        };

        return mount(VulnDetails, {
            props: { ...defaultProps, ...props },
            global: {
                stubs: {
                    Icon: true,
                    CenteredModal: true,
                    PositionedModal: true,
                    InfoCard: true,
                    StatCard: true,
                    Badge: true,
                    Button: true,
                    InfoMarkdown: true
                }
            }
        });
    };

    it('renders loading state initially', () => {
        const wrapper = createWrapper();
        expect(wrapper.find('[data-testid="vuln-details-loader"]').exists()).toBe(true);
    });

    it('renders back button when showBack is true', () => {
        const wrapper = createWrapper({ showBack: true });
        expect(wrapper.find('[data-testid="badge"]').exists()).toBe(true);
    });

    it('does not render back button when showBack is false', () => {
        const wrapper = createWrapper({ showBack: false });
        expect(wrapper.find('.navigation-section').exists()).toBe(false);
    });

    it('fetches vulnerability details on mount', async () => {
        const mockVuln = createMockVulnerabilityDetails();
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        createWrapper();

        expect(mockResultsRepository.getFinding).toHaveBeenCalledWith({
            orgId: 'org-123',
            projectId: 'project-123',
            analysisId: 'analysis-123',
            vulnerability_id: 'vuln-123',
            bearerToken: 'mock-token',
            handleBusinessErrors: true,
            workspace: '.'
        });
    });

    it('renders content after successful data fetch', async () => {
        const mockVuln = createMockVulnerabilityDetails();
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper = createWrapper();

        // Wait for async operation
        await vi.waitFor(() => {
            expect(wrapper.vm.render).toBe(true);
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.find('[data-testid="info-card"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="stat-card"]').exists()).toBe(true);
    });

    it('handles missing default organization', async () => {
        mockUserStore.getDefaultOrg = null;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        createWrapper();

        await vi.waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
    });

    it('handles missing auth token', async () => {
        mockAuthStore.getToken = null;
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        createWrapper();

        await vi.waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
    });

    it('calculates base score correctly for CVSS 3.1', () => {
        const mockVuln = createMockVulnerabilityDetails();
        mockVuln.severities.cvss_31 = { base_score: 8.5 };
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper = createWrapper();
        expect(wrapper.vm.getBaseScore(mockVuln)).toBe(8.5);
    });

    it('calculates base score correctly for CVSS 3.0', () => {
        const mockVuln = createMockVulnerabilityDetails();
        mockVuln.severities.cvss_31 = null;
        mockVuln.severities.cvss_3 = { base_score: 6.5 };
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper = createWrapper();
        expect(wrapper.vm.getBaseScore(mockVuln)).toBe(6.5);
    });

    it('calculates base score correctly for CVSS 2.0', () => {
        const mockVuln = createMockVulnerabilityDetails();
        mockVuln.severities.cvss_31 = null;
        mockVuln.severities.cvss_3 = null;
        mockVuln.severities.cvss_2 = { base_score: 4.5 };
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper = createWrapper();
        expect(wrapper.vm.getBaseScore(mockVuln)).toBe(4.5);
    });

    it('returns null for missing base score', () => {
        const mockVuln = createMockVulnerabilityDetails();
        mockVuln.severities = { cvss_31: null, cvss_3: null, cvss_2: null };
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper = createWrapper();
        expect(wrapper.vm.getBaseScore(mockVuln)).toBeNull();
    });

    it('determines severity level correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        // Test critical
        mockVuln.severities.cvss_31 = { base_score: 9.5 };
        expect(wrapper.vm.getSeverityLevel(mockVuln)).toBe('critical');

        // Test high
        mockVuln.severities.cvss_31 = { base_score: 8.0 };
        expect(wrapper.vm.getSeverityLevel(mockVuln)).toBe('high');

        // Test medium
        mockVuln.severities.cvss_31 = { base_score: 5.5 };
        expect(wrapper.vm.getSeverityLevel(mockVuln)).toBe('medium');

        // Test low
        mockVuln.severities.cvss_31 = { base_score: 2.5 };
        expect(wrapper.vm.getSeverityLevel(mockVuln)).toBe('low');

        // Test none
        mockVuln.severities.cvss_31 = { base_score: 0 };
        expect(wrapper.vm.getSeverityLevel(mockVuln)).toBe('none');
    });

    it('calculates security score correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        // Test critical -> F
        mockVuln.severities.cvss_31 = { base_score: 9.5 };
        expect(wrapper.vm.calculateSecurityScore(mockVuln)).toBe('F');

        // Test high -> D
        mockVuln.severities.cvss_31 = { base_score: 8.0 };
        expect(wrapper.vm.calculateSecurityScore(mockVuln)).toBe('D');

        // Test medium -> B
        mockVuln.severities.cvss_31 = { base_score: 5.5 };
        expect(wrapper.vm.calculateSecurityScore(mockVuln)).toBe('B');

        // Test low -> A
        mockVuln.severities.cvss_31 = { base_score: 2.5 };
        expect(wrapper.vm.calculateSecurityScore(mockVuln)).toBe('A');
    });

    it('gets security score variant correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        // Test A -> success
        mockVuln.severities.cvss_31 = { base_score: 2.5 };
        expect(wrapper.vm.getSecurityScoreVariant(mockVuln)).toBe('success');

        // Test F -> danger
        mockVuln.severities.cvss_31 = { base_score: 9.5 };
        expect(wrapper.vm.getSecurityScoreVariant(mockVuln)).toBe('danger');

        // Test D -> danger
        mockVuln.severities.cvss_31 = { base_score: 8.0 };
        expect(wrapper.vm.getSecurityScoreVariant(mockVuln)).toBe('danger');

        // Test B -> default
        mockVuln.severities.cvss_31 = { base_score: 5.5 };
        expect(wrapper.vm.getSecurityScoreVariant(mockVuln)).toBe('default');
    });

    it('gets security score description correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        mockVuln.severities.cvss_31 = { base_score: 2.5 };
        expect(wrapper.vm.getSecurityScoreDescription(mockVuln)).toBe('Excellent security');

        mockVuln.severities.cvss_31 = { base_score: 9.5 };
        expect(wrapper.vm.getSecurityScoreDescription(mockVuln)).toBe('Critical security issues');
    });

    it('counts critical and high vulnerabilities correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        // Critical
        mockVuln.severities.cvss_31 = { base_score: 9.5 };
        expect(wrapper.vm.getCriticalHighCount(mockVuln)).toBe(1);

        // High
        mockVuln.severities.cvss_31 = { base_score: 8.0 };
        expect(wrapper.vm.getCriticalHighCount(mockVuln)).toBe(1);

        // Medium
        mockVuln.severities.cvss_31 = { base_score: 5.5 };
        expect(wrapper.vm.getCriticalHighCount(mockVuln)).toBe(0);
    });

    it('gets medium/low count description correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        // Medium
        mockVuln.severities.cvss_31 = { base_score: 5.5 };
        expect(wrapper.vm.getMediumLowCount(mockVuln)).toBe('1 medium, 0 low');

        // Low
        mockVuln.severities.cvss_31 = { base_score: 2.5 };
        expect(wrapper.vm.getMediumLowCount(mockVuln)).toBe('0 medium, 1 low');

        // Critical
        mockVuln.severities.cvss_31 = { base_score: 9.5 };
        expect(wrapper.vm.getMediumLowCount(mockVuln)).toBe('0 medium, 0 low');
    });

    it('gets version status correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        mockVuln.dependency_info = { version: '1.2.3' };
        expect(wrapper.vm.getVersionStatus(mockVuln)).toBe('v1.2.3');

        mockVuln.dependency_info = null;
        expect(wrapper.vm.getVersionStatus(mockVuln)).toBe('Unknown');
    });

    it('gets package manager correctly', () => {
        const wrapper = createWrapper();
        const mockVuln = createMockVulnerabilityDetails();

        mockVuln.other = { package_manager: 'npm' };
        expect(wrapper.vm.getPackageManager(mockVuln)).toBe('npm');

        mockVuln.other = {};
        expect(wrapper.vm.getPackageManager(mockVuln)).toBe('Unknown');
    });

    it('toggles references limit correctly', async () => {
        const mockVuln = createMockVulnerabilityDetails();
        mockVuln.references = new Array(15).fill(0).map((_, i) => ({
            url: `https://example${i}.com`,
            type: 'advisory'
        }));

        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.vm.render).toBe(true);
        });

        // Initially shows 8 references
        expect(wrapper.vm.references_limit).toBe(8);

        // Toggle to show all
        wrapper.vm.toggleReferences();
        expect(wrapper.vm.references_limit).toBe(15);

        // Toggle back to show 8
        wrapper.vm.toggleReferences();
        expect(wrapper.vm.references_limit).toBe(8);
    });

    it('opens CVSS modal correctly', () => {
        const wrapper = createWrapper();
        const mockData = {
            cvss_field: 'AV',
            cvss_field_value: 'N',
            cvss_field_version: '3.1',
            cvss_info: { AV: { full_name: 'Attack Vector' } }
        };

        wrapper.vm.openModal(mockData);

        expect(wrapper.vm.cvss_field).toBe('AV');
        expect(wrapper.vm.cvss_field_value).toBe('N');
        expect(wrapper.vm.cvss_field_version).toBe('3.1');
        expect(wrapper.vm.cvss_info).toEqual({ AV: { full_name: 'Attack Vector' } });
    });

    it('uses analysisID when no finding_id in URL params', async () => {
        Object.defineProperty(window, 'location', {
            value: {
                search: ''
            },
            writable: true
        });

        const mockVuln = createMockVulnerabilityDetails();
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        createWrapper({ analysisID: 'custom-analysis-id' });

        expect(mockResultsRepository.getFinding).toHaveBeenCalledWith({
            orgId: 'org-123',
            projectId: 'project-123',
            analysisId: 'custom-analysis-id',
            vulnerability_id: 'custom-analysis-id',
            bearerToken: 'mock-token',
            handleBusinessErrors: true,
            workspace: '.'
        });
    });

    it('handles API error gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mockResultsRepository.getFinding.mockRejectedValue(new Error('API Error'));

        createWrapper();

        await vi.waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        });

        consoleSpy.mockRestore();
    });

    it('sets chart version based on CVSS data', async () => {
        const mockVuln = createMockVulnerabilityDetails();

        // Test CVSS 3.1
        mockVuln.severities.cvss_31 = { base_score: 7.5 };
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper.vm.chart_version).toBe('cvss31');
        });

        // Test CVSS 3.0
        mockVuln.severities.cvss_31 = null;
        mockVuln.severities.cvss_3 = { base_score: 7.5 };
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper2 = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper2.vm.chart_version).toBe('cvss3');
        });

        // Test CVSS 2.0
        mockVuln.severities.cvss_31 = null;
        mockVuln.severities.cvss_3 = null;
        mockVuln.severities.cvss_2 = { base_score: 7.5 };
        mockResultsRepository.getFinding.mockResolvedValue({
            data: mockVuln
        } as DataResponse<VulnerabilityDetails>);

        const wrapper3 = createWrapper();

        await vi.waitFor(() => {
            expect(wrapper3.vm.chart_version).toBe('cvss2');
        });
    });
});
