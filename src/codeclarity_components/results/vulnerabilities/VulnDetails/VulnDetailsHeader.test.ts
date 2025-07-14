import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VulnDetailsHeader from './VulnDetailsHeader.vue';
import { VulnerabilityDetails } from './VulnDetails';

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        props: ['icon'],
        template: '<span class="mock-icon">{{ icon }}</span>'
    }
}));

// Mock PositionedModal
vi.mock('@/base_components/ui/modals/PositionedModal.vue', () => ({
    default: {
        name: 'PositionedModal',
        template: '<div class="mock-positioned-modal"></div>'
    }
}));

describe('VulnDetailsHeader.vue', () => {
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
        } as any;
        finding.weaknesses = [
            {
                id: 'CWE-79',
                name: 'Cross-site Scripting (XSS)',
                description: 'Cross-site scripting vulnerability description'
            }
        ] as any;
        finding.dependency_info = {
            name: 'test-package',
            version: '1.5.0',
            published: '',
            description: '',
            keywords: [],
            package_manager_links: []
        } as any;

        return Object.assign(finding, overrides);
    };

    const createWrapper = (finding = createMockFinding()) => {
        return mount(VulnDetailsHeader, {
            props: {
                finding,
                versionsModalRef: {
                    show: vi.fn(),
                    hide: vi.fn(),
                    toggle: vi.fn()
                }
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render vulnerability ID', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('CVE-2021-1234');
        });

        it('should render vulnerability type and package name', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('Cross-site Scripting (XSS)');
            expect(wrapper.text()).toContain('in');
            expect(wrapper.text()).toContain('test-package@1.5.0');
        });

        it('should render affected versions', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('Affected versions of test-package:');
            expect(wrapper.text()).toContain('>= 1.0.0, < 2.0.0');
        });

        it('should show warning for universal vulnerability (affected versions = "*")', () => {
            const finding = createMockFinding({
                vulnerability_info: {
                    vulnerability_id: 'CVE-2021-5678',
                    description: 'Universal vulnerability description',
                    published: '2021-01-01',
                    last_modified: '2021-01-02',
                    sources: [],
                    aliases: [],
                    version_info: {
                        affected_versions_string: '*',
                        patched_versions_string: 'None',
                        versions: []
                    }
                }
            });

            const wrapper = createWrapper(finding);

            expect(wrapper.text()).toContain(
                'This vulnerability affects all versions of the library and might be a false positive'
            );
            expect(wrapper.find('.text-red-500').exists()).toBe(true);
            expect(wrapper.find('.mock-icon').exists()).toBe(true);
        });

        it('should not show warning for specific affected versions', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).not.toContain('This vulnerability affects all versions');
            expect(wrapper.find('.text-red-500').exists()).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing weakness name', () => {
            const finding = createMockFinding({
                weaknesses: []
            });

            const wrapper = createWrapper(finding);

            expect(wrapper.text()).toContain('in');
            expect(wrapper.text()).toContain('test-package@1.5.0');
        });

        it('should handle missing dependency info', () => {
            const finding = createMockFinding({
                dependency_info: null
            });

            const wrapper = createWrapper(finding);

            expect(wrapper.text()).toContain('CVE-2021-1234');
            expect(wrapper.text()).toContain('Affected versions of');
        });

        it('should handle empty vulnerability ID', () => {
            const finding = createMockFinding({
                vulnerability_info: {
                    vulnerability_id: '',
                    description: 'Empty ID vulnerability description',
                    published: '2021-01-01',
                    last_modified: '2021-01-02',
                    sources: [],
                    aliases: [],
                    version_info: {
                        affected_versions_string: '>= 1.0.0',
                        patched_versions_string: '>= 2.0.0',
                        versions: []
                    }
                }
            });

            const wrapper = createWrapper(finding);

            expect(wrapper.find('.text-3xl').exists()).toBe(true);
        });

        it('should handle multiple weaknesses', () => {
            const finding = createMockFinding({
                weaknesses: [
                    {
                        id: 'CWE-79',
                        name: 'Cross-site Scripting (XSS)',
                        description: 'XSS vulnerability description'
                    },
                    {
                        id: 'CWE-89',
                        name: 'SQL Injection',
                        description: 'SQL injection vulnerability description'
                    }
                ]
            });

            const wrapper = createWrapper(finding);

            // Should display only the first weakness
            expect(wrapper.text()).toContain('Cross-site Scripting (XSS)');
            expect(wrapper.text()).not.toContain('SQL Injection');
        });
    });

    describe('Styling and Layout', () => {
        it('should have correct CSS classes applied', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.header').exists()).toBe(true);
            expect(wrapper.find('.bg-white').exists()).toBe(true);
            expect(wrapper.find('.shadow-md').exists()).toBe(true);
            expect(wrapper.find('.rounded-lg').exists()).toBe(true);
        });

        it('should apply theme-primary color to package name', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.text-theme-primary').exists()).toBe(true);
            expect(wrapper.find('.text-theme-primary').text()).toContain('test-package@1.5.0');
        });

        it('should apply correct text sizes', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.text-3xl').exists()).toBe(true);
            expect(wrapper.find('.text-gray-600').exists()).toBe(true);
            expect(wrapper.find('.text-gray-700').exists()).toBe(true);
            expect(wrapper.find('.text-gray-800').exists()).toBe(true);
        });
    });

    describe('Props Validation', () => {
        it('should accept finding prop', () => {
            const finding = createMockFinding();
            const wrapper = createWrapper(finding);

            expect(wrapper.props('finding')).toEqual(finding);
        });

        it('should accept versionsModalRef prop', () => {
            const wrapper = createWrapper();

            expect(wrapper.props('versionsModalRef')).toBeDefined();
        });
    });

    describe('Icon Integration', () => {
        it('should render warning icon for universal vulnerabilities', () => {
            const finding = createMockFinding({
                vulnerability_info: {
                    vulnerability_id: 'CVE-2021-5678',
                    description: 'Universal vulnerability for icon test',
                    published: '2021-01-01',
                    last_modified: '2021-01-02',
                    sources: [],
                    aliases: [],
                    version_info: {
                        affected_versions_string: '*',
                        patched_versions_string: 'None',
                        versions: []
                    }
                }
            });

            const wrapper = createWrapper(finding);
            const icon = wrapper.find('.mock-icon');

            expect(icon.exists()).toBe(true);
            expect(icon.text()).toContain('tabler:alert-triangle-filled');
        });
    });
});
