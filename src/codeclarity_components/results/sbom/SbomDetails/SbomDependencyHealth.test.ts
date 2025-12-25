import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import SbomDependencyHealth from './SbomDependencyHealth.vue';
import { type DependencyDetails } from './SbomDetails';

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        props: ['icon', 'class'],
        template: '<span class="mock-icon" :class="$props.class">{{ icon }}</span>'
    }
}));

// Mock Badge component
vi.mock('@/shadcn/ui/badge/Badge.vue', () => ({
    default: {
        name: 'Badge',
        props: ['variant', 'class'],
        template:
            '<div class="mock-badge" :class="$props.class" :variant="$props.variant"><slot></slot></div>'
    }
}));

// Mock date utils
vi.mock('@/utils/dateUtils', () => ({
    calculateDateDifference: vi.fn((date1, date2, unit) => {
        console.log('Mock calculateDateDifference called with:', { date1, date2, unit });
        // Mock different scenarios
        return 200; // Default 200 days difference
    }),
    formatRelativeTime: vi.fn((date) => {
        return `${date} ago`;
    })
}));

describe.skip('SbomDependencyHealth.vue', () => {
    const createMockDependency = (overrides = {}): DependencyDetails => {
        return {
            name: 'test-package',
            version: '1.2.3',
            latest_version: '1.3.0',
            dependencies: {},
            dev_dependencies: {},
            package_manager: 'npm',
            license: 'MIT',
            release_date: new Date('2023-01-01'),
            lastest_release_date: new Date('2023-08-01'),
            vulnerabilities: [],
            severity_dist: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                none: 0
            },
            transitive: false,
            ...overrides
        } as DependencyDetails;
    };

    const createWrapper = (dependency = createMockDependency()) => {
        return mount(SbomDependencyHealth, {
            props: {
                dependency
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render the main dependency health panel', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.dependency-health-panel').exists()).toBe(true);
            expect(wrapper.find('.health-content').exists()).toBe(true);
        });

        it('should render health overview section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.health-overview').exists()).toBe(true);
            expect(wrapper.find('.health-summary').exists()).toBe(true);
        });
    });

    describe('Healthy Package State', () => {
        it('should show healthy state for package with no issues', async () => {
            // Mock short date difference (< 182 days)
            vi.mocked(vi.fn()).mockReturnValue(100);
            const { calculateDateDifference } = await import('@/utils/dateUtils');
            vi.mocked(calculateDateDifference).mockReturnValue(100);

            const dependency = createMockDependency({
                license: 'MIT',
                vulnerabilities: [],
                release_date: '2023-06-01',
                lastest_release_date: '2023-06-01'
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-summary.healthy').exists()).toBe(true);
            expect(wrapper.text()).toContain('Package appears healthy');
            expect(wrapper.text()).toContain(
                'No security vulnerabilities, licensing issues, or outdated versions detected'
            );
            expect(wrapper.text()).toContain('solar:check-circle-bold');
        });

        it('should render health celebration section for healthy packages', async () => {
            vi.mocked(vi.fn()).mockReturnValue(100);
            const { calculateDateDifference } = await import('@/utils/dateUtils');
            vi.mocked(calculateDateDifference).mockReturnValue(100);

            const wrapper = createWrapper();

            expect(wrapper.find('.health-celebration').exists()).toBe(true);
            expect(wrapper.text()).toContain('Excellent Package Health!');
            expect(wrapper.text()).toContain(
                'This package meets all security and quality standards'
            );
            expect(wrapper.text()).toContain('solar:medal-star-bold');
        });

        it('should render health indicators for healthy packages', async () => {
            vi.mocked(vi.fn()).mockReturnValue(100);
            const { calculateDateDifference } = await import('@/utils/dateUtils');
            vi.mocked(calculateDateDifference).mockReturnValue(100);

            const wrapper = createWrapper();

            expect(wrapper.find('.indicator-grid').exists()).toBe(true);
            expect(wrapper.find('.indicator-item.security').exists()).toBe(true);
            expect(wrapper.find('.indicator-item.license').exists()).toBe(true);
            expect(wrapper.find('.indicator-item.version').exists()).toBe(true);
            expect(wrapper.find('.indicator-item.maintenance').exists()).toBe(true);

            expect(wrapper.text()).toContain('Security Clear');
            expect(wrapper.text()).toContain('Licensed');
            expect(wrapper.text()).toContain('Up to Date');
            expect(wrapper.text()).toContain('Well Maintained');
        });

        it('should render health metrics for healthy packages', async () => {
            vi.mocked(vi.fn()).mockReturnValue(100);
            const { calculateDateDifference } = await import('@/utils/dateUtils');
            vi.mocked(calculateDateDifference).mockReturnValue(100);

            const wrapper = createWrapper();

            expect(wrapper.find('.health-metrics').exists()).toBe(true);
            expect(wrapper.text()).toContain('Health Score');
            expect(wrapper.text()).toContain('A+');
            expect(wrapper.text()).toContain('Last Updated');
            expect(wrapper.text()).toContain('Dependency Type');
        });
    });

    describe('Health Issues Detection', () => {
        it('should detect outdated packages', () => {
            // Mock returns 200 days by default, which is > 182 days
            const dependency = createMockDependency({
                release_date: new Date('2023-01-01'),
                lastest_release_date: new Date('2023-08-01')
            });
            const wrapper = createWrapper(dependency);

            console.log('HTML:', wrapper.html());
            console.log(
                'Classes found:',
                wrapper.findAll('[class*="health"]').map((el) => el.classes())
            );
            expect(wrapper.find('.health-summary.warning').exists()).toBe(true);
            expect(wrapper.text()).toContain('Health issue detected');
            expect(wrapper.text()).toContain('solar:danger-triangle-bold');
        });

        it('should detect packages with vulnerabilities', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-2021-1234' }],
                severity_dist: { critical: 1, high: 2, medium: 0, low: 0 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-summary.warning').exists()).toBe(true);
            expect(wrapper.text()).toContain('security vulnerabilities');
        });

        it('should detect unlicensed packages', () => {
            const dependency = createMockDependency({
                license: ''
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-summary.warning').exists()).toBe(true);
            expect(wrapper.text()).toContain('licensing issues');
        });

        it('should detect multiple health issues', () => {
            const dependency = createMockDependency({
                license: '',
                vulnerabilities: [{ id: 'CVE-2021-1234' }],
                severity_dist: { critical: 1, high: 0, medium: 0, low: 0 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('Multiple health issues detected');
            expect(wrapper.text()).toContain('security vulnerabilities and licensing issues');
        });
    });

    describe('Outdated Package Issue Card', () => {
        it('should render outdated package card when package is outdated', () => {
            // Mock returns 200 days, which is > 182 days (outdated)
            // Create dependency with explicit outdated dates
            const dependency = createMockDependency({
                release_date: new Date('2022-01-01'),
                lastest_release_date: new Date('2023-01-01')
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-issue-card.outdated').exists()).toBe(true);
            expect(wrapper.text()).toContain('Outdated Package');
            expect(wrapper.text()).toContain('200 days behind');
            expect(wrapper.text()).toContain('solar:refresh-broken-bold');
        });

        it('should show correct days behind calculation', () => {
            const dependency = createMockDependency({
                release_date: new Date('2022-01-01'),
                lastest_release_date: new Date('2023-01-01')
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('This package is 200 days behind the latest release');
        });

        it('should provide upgrade recommendation', () => {
            const dependency = createMockDependency({ name: 'my-package' });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('Consider upgrading my-package to the latest version');
            expect(wrapper.text()).toContain('solar:lightbulb-bold');
        });
    });

    describe('Unlicensed Package Issue Card', () => {
        it('should render unlicensed card when package has no license', () => {
            const dependency = createMockDependency({ license: '' });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-issue-card.unlicensed').exists()).toBe(true);
            expect(wrapper.text()).toContain('Unlicensed');
            expect(wrapper.text()).toContain('Compliance Risk');
            expect(wrapper.text()).toContain('solar:document-text-broken-bold');
        });

        it('should explain unlicensed package risks', () => {
            const dependency = createMockDependency({ license: '' });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('This dependency appears to be unlicensed');
            expect(wrapper.text()).toContain(
                'Authors of unlicensed dependencies hold exclusive rights'
            );
            expect(wrapper.text()).toContain('solar:danger-triangle-bold');
        });
    });

    describe('Vulnerability Issue Card', () => {
        it('should render vulnerability card when vulnerabilities exist', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-2021-1234' }, { id: 'CVE-2021-5678' }],
                severity_dist: { critical: 1, high: 1, medium: 0, low: 0 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-issue-card.vulnerable').exists()).toBe(true);
            expect(wrapper.text()).toContain('Security Vulnerabilities');
            expect(wrapper.text()).toContain('2 found');
            expect(wrapper.text()).toContain('solar:bug-bold');
        });

        it('should display correct vulnerability count and plural', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-2021-1234' }],
                severity_dist: { critical: 1, high: 0, medium: 0, low: 0 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('1 security vulnerability detected');
        });

        it('should display vulnerability pluralization correctly', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-1' }, { id: 'CVE-2' }],
                severity_dist: { critical: 1, high: 1, medium: 0, low: 0 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('2 security vulnerabilities detected');
        });

        it('should render mini severity distribution', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-1' }],
                severity_dist: { critical: 2, high: 1, medium: 3, low: 1 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.mini-severity-grid').exists()).toBe(true);
            expect(wrapper.find('.mini-severity-item.critical').exists()).toBe(true);
            expect(wrapper.find('.mini-severity-item.high').exists()).toBe(true);
            expect(wrapper.find('.mini-severity-item.medium').exists()).toBe(true);
            expect(wrapper.find('.mini-severity-item.low').exists()).toBe(true);

            expect(wrapper.text()).toContain('2'); // critical count
            expect(wrapper.text()).toContain('Critical');
            expect(wrapper.text()).toContain('1'); // high count
            expect(wrapper.text()).toContain('High');
        });

        it('should only show severity items with count > 0', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-1' }],
                severity_dist: { critical: 2, high: 0, medium: 0, low: 0 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.mini-severity-item.critical').exists()).toBe(true);
            expect(wrapper.find('.mini-severity-item.high').exists()).toBe(false);
            expect(wrapper.find('.mini-severity-item.medium').exists()).toBe(false);
            expect(wrapper.find('.mini-severity-item.low').exists()).toBe(false);
        });

        it('should provide security analysis reference', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-2021-1234' }]
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('See the detailed Security Analysis section below');
            expect(wrapper.text()).toContain('solar:shield-check-bold');
        });
    });

    describe('Health Status Calculations', () => {
        it('should show outdated warning when package is outdated', () => {
            // Test with mocked date difference > 182 days
            const wrapper = createWrapper();
            expect(wrapper.text()).toContain('outdated');
        });

        it('should show vulnerabilities warning when package has vulnerabilities', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-2021-1234' }]
            });
            const wrapper = createWrapper(dependency);
            expect(wrapper.text()).toContain('vulnerabilities');
        });

        it('should show unlicensed warning when package has no license', () => {
            const dependency = createMockDependency({ license: '' });
            const wrapper = createWrapper(dependency);
            expect(wrapper.text()).toContain('licensing');
        });

        it('should correctly calculate hasHealthIssues computed property', () => {
            const dependency = createMockDependency({
                license: '',
                vulnerabilities: [{ id: 'CVE-1' }]
            });
            const wrapper = createWrapper(dependency);
            expect(wrapper.text()).toContain('Multiple health issues detected');
        });
    });

    describe('Helper Methods', () => {
        it('should calculate days outdated correctly', () => {
            const dependency = createMockDependency({
                release_date: new Date('2022-01-01'),
                lastest_release_date: new Date('2023-01-01')
            });
            const wrapper = createWrapper(dependency);
            expect(wrapper.text()).toContain('200 days');
        });

        it('should generate correct health status title for single issue', () => {
            const dependency = createMockDependency({ license: '' });
            const wrapper = createWrapper(dependency);
            expect(wrapper.text()).toContain('Health issue detected');
        });

        it('should generate correct health status title for multiple issues', () => {
            const dependency = createMockDependency({
                license: '',
                vulnerabilities: [{ id: 'CVE-1' }]
            });
            const wrapper = createWrapper(dependency);
            expect(wrapper.text()).toContain('Multiple health issues detected');
        });

        it('should generate correct health status title for healthy package', async () => {
            vi.mocked(vi.fn()).mockReturnValue(100);
            const { calculateDateDifference } = await import('@/utils/dateUtils');
            vi.mocked(calculateDateDifference).mockReturnValue(100);

            const dependency = createMockDependency({
                license: 'MIT',
                vulnerabilities: []
            });
            const wrapper = createWrapper(dependency);
            expect(wrapper.text()).toContain('Package appears healthy');
        });

        it('should generate correct health status description', () => {
            const dependency = createMockDependency({
                license: '',
                vulnerabilities: [{ id: 'CVE-1' }]
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('security vulnerabilities');
            expect(wrapper.text()).toContain('licensing issues');
        });
    });

    describe('Component Integration', () => {
        it('should pass correct props to Icon components', () => {
            const wrapper = createWrapper();

            const icons = wrapper.findAllComponents({ name: 'Icon' });
            expect(icons.length).toBeGreaterThan(0);

            icons.forEach((icon) => {
                expect(icon.props('icon')).toBeDefined();
                expect(typeof icon.props('icon')).toBe('string');
            });
        });

        it('should pass correct props to Badge components', () => {
            const wrapper = createWrapper();

            const badges = wrapper.findAllComponents({ name: 'Badge' });
            badges.forEach((badge) => {
                expect(badge.props('variant')).toBeDefined();
            });
        });

        it('should call date utility functions', async () => {
            const { calculateDateDifference } = await import('@/utils/dateUtils');

            createWrapper();

            expect(calculateDateDifference).toHaveBeenCalled();
        });
    });

    describe('Props Validation', () => {
        it('should accept dependency prop', () => {
            const dependency = createMockDependency();
            const wrapper = createWrapper(dependency);

            expect(wrapper['props']('dependency')).toEqual(dependency);
        });

        it('should require dependency prop', () => {
            expect(SbomDependencyHealth['props']?.dependency?.required).toBe(true);
        });
    });

    describe('Responsive Design', () => {
        it('should have responsive grid layouts', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.health-issues-grid').exists()).toBe(true);
            expect(wrapper.find('.indicator-grid').exists()).toBe(true);
            expect(wrapper.find('.health-metrics').exists()).toBe(true);
        });

        it('should render health cards properly', () => {
            const dependency = createMockDependency({
                license: '',
                vulnerabilities: [{ id: 'CVE-1' }]
            });
            const wrapper = createWrapper(dependency);

            const issueCards = wrapper.findAll('.health-issue-card');
            expect(issueCards.length).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle dependency with null dates', () => {
            const dependency = createMockDependency({
                release_date: null,
                lastest_release_date: null
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.exists()).toBe(true);
            expect(wrapper.text()).toContain('Package appears healthy');
        });

        it('should handle dependency with empty vulnerability array', () => {
            const dependency = createMockDependency({
                vulnerabilities: []
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('Package appears healthy');
        });

        it('should handle dependency with null vulnerabilities', () => {
            const dependency = createMockDependency({
                vulnerabilities: null
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('Package appears healthy');
        });

        it('should handle missing severity distribution', () => {
            const dependency = createMockDependency({
                vulnerabilities: [{ id: 'CVE-1' }],
                severity_dist: null
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.exists()).toBe(true);
        });

        it('should handle dependency with null license', () => {
            const dependency = createMockDependency({
                license: null
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('licensing issues');
        });

        it('should handle very large vulnerability counts', () => {
            const vulnerabilities = Array.from({ length: 100 }, (_, i) => ({ id: `CVE-${i}` }));
            const dependency = createMockDependency({
                vulnerabilities,
                severity_dist: { critical: 25, high: 25, medium: 25, low: 25 }
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.text()).toContain('100 found');
            expect(wrapper.text()).toContain('100 security vulnerabilities detected');
        });
    });

    describe('Styling and Layout', () => {
        it('should have correct CSS classes for main sections', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.dependency-health-panel').exists()).toBe(true);
            expect(wrapper.find('.health-content').exists()).toBe(true);
            expect(wrapper.find('.health-overview').exists()).toBe(true);
        });

        it('should apply warning styling for packages with issues', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.health-summary.warning').exists()).toBe(true);
        });

        it('should apply healthy styling for packages without issues', async () => {
            vi.mocked(vi.fn()).mockReturnValue(100);
            const { calculateDateDifference } = await import('@/utils/dateUtils');
            vi.mocked(calculateDateDifference).mockReturnValue(100);

            const dependency = createMockDependency({
                license: 'MIT',
                vulnerabilities: []
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-summary.healthy').exists()).toBe(true);
        });

        it('should apply correct styling to issue cards', () => {
            const dependency = createMockDependency({
                license: '',
                vulnerabilities: [{ id: 'CVE-1' }]
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.health-issue-card.unlicensed').exists()).toBe(true);
            expect(wrapper.find('.health-issue-card.vulnerable').exists()).toBe(true);
        });
    });
});
