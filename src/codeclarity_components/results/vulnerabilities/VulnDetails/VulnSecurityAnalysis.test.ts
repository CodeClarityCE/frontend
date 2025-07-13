import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VulnSecurityAnalysis from './VulnSecurityAnalysis.vue';
import { VulnerabilityDetails } from './VulnDetails';

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        props: ['icon'],
        template: '<span class="mock-icon">{{ icon }}</span>'
    }
}));

// Mock Badge component
vi.mock('@/shadcn/ui/badge/Badge.vue', () => ({
    default: {
        name: 'Badge',
        props: ['variant', 'title'],
        template: '<span class="mock-badge" :class="variant"><slot></slot></span>'
    }
}));

describe('VulnSecurityAnalysis.vue', () => {
    const createMockFinding = (overrides = {}) => {
        const finding = new VulnerabilityDetails();
        finding.vulnerability_info = {
            vulnerability_id: 'CVE-2021-1234',
            description: 'Test vulnerability description',
            published: '2021-01-01',
            last_modified: '2021-01-02',
            sources: [],
            aliases: [],
            version_info: {
                affected_versions_string: '>= 1.0.0, < 2.0.0',
                patched_versions_string: '>= 2.0.0',
                versions: []
            }
        };

        return Object.assign(finding, overrides);
    };

    const mockGetSeverityLevel = vi.fn();
    const mockGetCriticalHighCount = vi.fn();
    const mockGetMediumLowCount = vi.fn();

    const createWrapper = (finding = createMockFinding(), overrides = {}) => {
        return mount(VulnSecurityAnalysis, {
            props: {
                finding,
                getSeverityLevel: mockGetSeverityLevel,
                getCriticalHighCount: mockGetCriticalHighCount,
                getMediumLowCount: mockGetMediumLowCount,
                ...overrides
            }
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSeverityLevel.mockReturnValue('medium');
        mockGetCriticalHighCount.mockReturnValue(0);
        mockGetMediumLowCount.mockReturnValue('1 medium, 0 low');
    });

    describe('Component Rendering', () => {
        it('should render the main vulnerability content container', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.vulnerability-content').exists()).toBe(true);
        });

        it('should render severity breakdown section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.severity-breakdown').exists()).toBe(true);
            expect(wrapper.text()).toContain('Severity Distribution');
        });

        it('should render security recommendations section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.security-recommendations').exists()).toBe(true);
            expect(wrapper.text()).toContain('Recommendations');
        });

        it('should render vulnerability identifier section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.vulnerability-list').exists()).toBe(true);
            expect(wrapper.text()).toContain('Vulnerability Identifier');
        });
    });

    describe('Severity Grid', () => {
        it('should render all four severity levels', () => {
            const wrapper = createWrapper();

            const severityItems = wrapper.findAll('.severity-item');
            expect(severityItems.length).toBe(4);

            expect(wrapper.text()).toContain('Critical');
            expect(wrapper.text()).toContain('High');
            expect(wrapper.text()).toContain('Medium');
            expect(wrapper.text()).toContain('Low');
        });

        it('should display count of 1 for matching severity level', () => {
            mockGetSeverityLevel.mockReturnValue('critical');
            const wrapper = createWrapper();

            const criticalItem = wrapper.find('.severity-item.critical .severity-count');
            expect(criticalItem.text()).toBe('1');

            const highItem = wrapper.find('.severity-item.high .severity-count');
            expect(highItem.text()).toBe('0');
        });

        it('should display count of 0 for non-matching severity levels', () => {
            mockGetSeverityLevel.mockReturnValue('high');
            const wrapper = createWrapper();

            const criticalItem = wrapper.find('.severity-item.critical .severity-count');
            expect(criticalItem.text()).toBe('0');

            const highItem = wrapper.find('.severity-item.high .severity-count');
            expect(highItem.text()).toBe('1');

            const mediumItem = wrapper.find('.severity-item.medium .severity-count');
            expect(mediumItem.text()).toBe('0');

            const lowItem = wrapper.find('.severity-item.low .severity-count');
            expect(lowItem.text()).toBe('0');
        });

        it('should render appropriate icons for each severity level', () => {
            const wrapper = createWrapper();

            const icons = wrapper.findAll('.mock-icon');
            expect(icons.length).toBeGreaterThan(4); // At least 4 for severity items, plus recommendation icons

            expect(wrapper.text()).toContain('solar:danger-triangle-bold');
            expect(wrapper.text()).toContain('solar:shield-warning-bold');
            expect(wrapper.text()).toContain('solar:shield-check-bold');
            expect(wrapper.text()).toContain('solar:shield-bold');
        });
    });

    describe('Recommendations', () => {
        it('should show critical recommendation when critical/high count > 0', () => {
            mockGetCriticalHighCount.mockReturnValue(2);
            const wrapper = createWrapper();

            const criticalRecommendation = wrapper.find('.recommendation-item.critical');
            expect(criticalRecommendation.exists()).toBe(true);
            expect(wrapper.text()).toContain('Immediate Attention Required');
            expect(wrapper.text()).toContain('2 critical/high severity vulnerabilities');
        });

        it('should not show critical recommendation when critical/high count is 0', () => {
            mockGetCriticalHighCount.mockReturnValue(0);
            const wrapper = createWrapper();

            const criticalRecommendation = wrapper.find('.recommendation-item.critical');
            expect(criticalRecommendation.exists()).toBe(false);
        });

        it('should render recommendation icon', () => {
            mockGetCriticalHighCount.mockReturnValue(1);
            const wrapper = createWrapper();

            const recommendationIcon = wrapper.find('.recommendation-icon');
            expect(recommendationIcon.exists()).toBe(true);
        });
    });

    describe('Vulnerability Badge', () => {
        it('should render vulnerability ID badge', () => {
            const wrapper = createWrapper();

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.exists()).toBe(true);
            expect(badge.props('variant')).toBe('destructive');
            expect(badge.text()).toContain('CVE-2021-1234');
        });

        it('should have correct title attribute on badge', () => {
            const wrapper = createWrapper();

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.props('title')).toBe('Click to view details for CVE-2021-1234');
        });

        it('should handle different vulnerability IDs', () => {
            const finding = createMockFinding({
                vulnerability_info: {
                    vulnerability_id: 'CVE-2022-5678',
                    version_info: {
                        affected_versions_string: '*',
                        patched_versions_string: 'None'
                    }
                }
            });

            const wrapper = createWrapper(finding);

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.text()).toContain('CVE-2022-5678');
            expect(badge.props('title')).toBe('Click to view details for CVE-2022-5678');
        });
    });

    describe('Function Integration', () => {
        it('should call getSeverityLevel function for each severity item', () => {
            const finding = createMockFinding();
            createWrapper(finding);

            expect(mockGetSeverityLevel).toHaveBeenCalledWith(finding);
            expect(mockGetSeverityLevel).toHaveBeenCalledTimes(4); // Once for each severity level
        });

        it('should call getCriticalHighCount function', () => {
            const finding = createMockFinding();
            createWrapper(finding);

            expect(mockGetCriticalHighCount).toHaveBeenCalledWith(finding);
        });

        it('should handle different severity levels correctly', () => {
            ['critical', 'high', 'medium', 'low', 'none'].forEach((severity) => {
                mockGetSeverityLevel.mockReturnValue(severity as any);
                const wrapper = createWrapper();

                // Check that the correct severity item shows count of 1
                const severityItems = wrapper.findAll('.severity-count');
                const counts = severityItems.map((item) => item.text());

                if (severity === 'none') {
                    expect(counts).toEqual(['0', '0', '0', '0']);
                } else {
                    const expectedCounts = ['0', '0', '0', '0'];
                    const severityIndex = ['critical', 'high', 'medium', 'low'].indexOf(severity);
                    if (severityIndex !== -1) {
                        expectedCounts[severityIndex] = '1';
                    }
                    expect(counts).toEqual(expectedCounts);
                }
            });
        });
    });

    describe('Styling and Layout', () => {
        it('should have correct CSS classes for layout', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.vulnerability-content').exists()).toBe(true);
            expect(wrapper.find('.severity-grid').exists()).toBe(true);
            expect(wrapper.find('.recommendation-list').exists()).toBe(true);
            expect(wrapper.find('.vulnerability-items').exists()).toBe(true);
        });

        it('should apply severity-specific styling', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.severity-item.critical').exists()).toBe(true);
            expect(wrapper.find('.severity-item.high').exists()).toBe(true);
            expect(wrapper.find('.severity-item.medium').exists()).toBe(true);
            expect(wrapper.find('.severity-item.low').exists()).toBe(true);
        });

        it('should use grid layout for severity items', () => {
            const wrapper = createWrapper();

            const severityGrid = wrapper.find('.severity-grid');
            expect(severityGrid.exists()).toBe(true);

            const severityItems = wrapper.findAll('.severity-item');
            expect(severityItems.length).toBe(4);
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing vulnerability_info', () => {
            const finding = createMockFinding({
                vulnerability_info: null
            });

            const wrapper = createWrapper(finding);

            // Should not crash, but badge might not render correctly
            expect(wrapper.exists()).toBe(true);
        });

        it('should handle empty vulnerability ID', () => {
            const finding = createMockFinding({
                vulnerability_info: {
                    vulnerability_id: '',
                    version_info: {
                        affected_versions_string: '*',
                        patched_versions_string: 'None'
                    }
                }
            });

            const wrapper = createWrapper(finding);

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.exists()).toBe(true);
        });

        it('should handle large critical/high counts', () => {
            mockGetCriticalHighCount.mockReturnValue(99);
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('99 critical/high severity vulnerabilities');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            const wrapper = createWrapper();

            const headings = wrapper.findAll('.breakdown-title');
            expect(headings.length).toBe(3);

            expect(wrapper.text()).toContain('Severity Distribution');
            expect(wrapper.text()).toContain('Recommendations');
            expect(wrapper.text()).toContain('Vulnerability Identifier');
        });

        it('should have descriptive text for screen readers', () => {
            const wrapper = createWrapper();

            const severityLabels = wrapper.findAll('.severity-label');
            expect(severityLabels.length).toBe(4);

            severityLabels.forEach((label) => {
                expect(label.text()).toMatch(/^(Critical|High|Medium|Low)$/);
            });
        });
    });
});
