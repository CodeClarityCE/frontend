import { SeverityType, Impact, type PatchInfo, type ToPatch } from '@/codeclarity_components/results/patching/Patching';
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PatchInformation from './PatchInformation.vue';

// Mock child components
vi.mock('@/base_components/utilities/SemverToString.vue', () => ({
    default: {
        name: 'SemverToString',
        template:
            '<span data-testid="semver-to-string">{{ semver?.Major }}.{{ semver?.Minor }}.{{ semver?.Patch }}</span>',
        props: ['semver']
    }
}));

// Mock shadcn breadcrumb components
vi.mock('@/shadcn/ui/breadcrumb/Breadcrumb.vue', () => ({
    default: {
        name: 'Breadcrumb',
        template: '<nav data-testid="breadcrumb" class="breadcrumb"><slot></slot></nav>'
    }
}));

vi.mock('@/shadcn/ui/breadcrumb/BreadcrumbList.vue', () => ({
    default: {
        name: 'BreadcrumbList',
        template: '<ol data-testid="breadcrumb-list" class="breadcrumb-list"><slot></slot></ol>'
    }
}));

vi.mock('@/shadcn/ui/breadcrumb/BreadcrumbItem.vue', () => ({
    default: {
        name: 'BreadcrumbItem',
        template: '<li data-testid="breadcrumb-item" class="breadcrumb-item"><slot></slot></li>'
    }
}));

vi.mock('@/shadcn/ui/breadcrumb/BreadcrumbPage.vue', () => ({
    default: {
        name: 'BreadcrumbPage',
        template: '<span data-testid="breadcrumb-page" class="breadcrumb-page"><slot></slot></span>'
    }
}));

vi.mock('@/shadcn/ui/breadcrumb/BreadcrumbSeparator.vue', () => ({
    default: {
        name: 'BreadcrumbSeparator',
        template: '<span data-testid="breadcrumb-separator" class="breadcrumb-separator">/</span>'
    }
}));

// Mock Badge component (imported globally)
(globalThis as any).Badge = {
    name: 'Badge',
    template: '<span data-testid="badge" class="badge"><slot></slot></span>'
};

describe('PatchInformation.vue', () => {
    let wrapper: any;

    const mockToPatch: ToPatch = {
        DependencyName: 'express',
        DependencyVersion: '4.17.0',
        Path: ['node_modules', 'express', 'lib'],
        Vulnerability: {
            Id: 'vuln-id-1',
            Sources: [],
            AffectedDependency: 'express',
            AffectedVersion: '4.17.0',
            VulnerabilityId: 'CVE-2021-1234',
            Severity: {
                Severity: 7.5,
                SeverityType: SeverityType.CvssV3,
                Vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
                Impact: 7.5,
                Exploitability: 8.6,
                ConfidentialityImpact: Impact.High,
                IntegrityImpact: Impact.None,
                AvailabilityImpact: Impact.None
            },
            Weaknesses: [],
            OSVMatch: {
                Vulnerability: null,
                Dependency: null,
                AffectedInfo: null,
                VulnerableEvidenceRange: null,
                VulnerableEvidenceExact: null,
                VulnerableEvidenceUniversal: null,
                VulnerableEvidenceType: null,
                Vulnerable: null,
                ConflictFlag: null,
                Severity: null,
                SeverityType: null
            },
            NVDMatch: {
                Vulnerability: null,
                Dependency: null,
                AffectedInfo: null,
                VulnerableEvidenceRange: null,
                VulnerableEvidenceExact: null,
                VulnerableEvidenceUniversal: null,
                VulnerableEvidenceType: null,
                Vulnerable: null,
                ConflictFlag: null,
                Severity: null,
                SeverityType: null
            }
        }
    };

    const mockPatchInfo: PatchInfo = {
        TopLevelVulnerable: false,
        IsPatchable: 'FULL',
        Patchable: [],
        Unpatchable: [],
        Introduced: [],
        Patches: {
            'express@4.17.0': {
                Major: 4,
                Minor: 18,
                Patch: 0,
                PreReleaseTag: '',
                MetaData: ''
            }
        },
        Update: {
            Major: 1,
            Minor: 0,
            Patch: 0,
            PreReleaseTag: '',
            MetaData: ''
        }
    };

    const mockEmptyPathPatch: ToPatch = {
        ...mockToPatch,
        Path: []
    };

    const mockLongPathPatch: ToPatch = {
        ...mockToPatch,
        Path: ['node_modules', '@scoped', 'package', 'nested', 'lib', 'components', 'index.js']
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    const createWrapper = (props = {}) => {
        return mount(PatchInformation, {
            props: {
                patch: mockToPatch,
                patchInfo: mockPatchInfo,
                ...props
            },
            global: {
                components: {
                    Badge: (globalThis as any).Badge
                }
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render the main container', () => {
            wrapper = createWrapper();

            expect(wrapper.find('.flex.gap-2.items-center.justify-between').exists()).toBe(true);
        });

        it('should render breadcrumb navigation', () => {
            wrapper = createWrapper();

            expect(wrapper.findComponent({ name: 'Breadcrumb' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'BreadcrumbList' }).exists()).toBe(true);
        });

        it('should render vulnerability badge', () => {
            wrapper = createWrapper();

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.exists()).toBe(true);
            expect(badge.text()).toBe('CVE-2021-1234');
        });

        it('should render impact information', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Impact: 7.5');
        });

        it('should render patched version section', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Patched version:');
            expect(wrapper.findComponent({ name: 'SemverToString' }).exists()).toBe(true);
        });
    });

    describe('Breadcrumb Navigation', () => {
        it('should render root breadcrumb item', () => {
            wrapper = createWrapper();

            const breadcrumbItems = wrapper.findAllComponents({ name: 'BreadcrumbItem' });
            expect(breadcrumbItems.length).toBeGreaterThan(0);

            const rootItem = breadcrumbItems[0];
            expect(rootItem.text()).toContain('Root');
        });

        it('should render path elements as breadcrumb items', () => {
            wrapper = createWrapper();

            const breadcrumbItems = wrapper.findAllComponents({ name: 'BreadcrumbItem' });
            // Root + 3 path elements
            expect(breadcrumbItems).toHaveLength(4);

            expect(wrapper.text()).toContain('node_modules');
            expect(wrapper.text()).toContain('express');
            expect(wrapper.text()).toContain('lib');
        });

        it('should render breadcrumb separators', () => {
            wrapper = createWrapper();

            const separators = wrapper.findAllComponents({ name: 'BreadcrumbSeparator' });
            // Should have separators between path elements (not after root, but between others)
            expect(separators.length).toBeGreaterThan(0);
        });

        it('should handle empty path array', () => {
            wrapper = createWrapper({ patch: mockEmptyPathPatch });

            const breadcrumbItems = wrapper.findAllComponents({ name: 'BreadcrumbItem' });
            // Only root item should be present
            expect(breadcrumbItems).toHaveLength(1);
            expect(breadcrumbItems[0].text()).toContain('Root');
        });

        it('should handle long paths', () => {
            wrapper = createWrapper({ patch: mockLongPathPatch });

            const breadcrumbItems = wrapper.findAllComponents({ name: 'BreadcrumbItem' });
            // Root + 7 path elements
            expect(breadcrumbItems).toHaveLength(8);

            expect(wrapper.text()).toContain('@scoped');
            expect(wrapper.text()).toContain('package');
            expect(wrapper.text()).toContain('nested');
            expect(wrapper.text()).toContain('components');
            expect(wrapper.text()).toContain('index.js');
        });

        it('should render breadcrumb pages correctly', () => {
            wrapper = createWrapper();

            const breadcrumbPages = wrapper.findAllComponents({ name: 'BreadcrumbPage' });
            expect(breadcrumbPages.length).toBeGreaterThan(0);

            const pageTexts = breadcrumbPages.map((page: any) => page.text());
            expect(pageTexts).toContain('Root');
            expect(pageTexts).toContain('node_modules');
            expect(pageTexts).toContain('express');
            expect(pageTexts).toContain('lib');
        });
    });

    describe('Vulnerability Information', () => {
        it('should display vulnerability ID in badge', () => {
            wrapper = createWrapper();

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.text()).toBe('CVE-2021-1234');
        });

        it('should display vulnerability severity impact', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Impact: 7.5');
        });

        it('should handle different impact levels', () => {
            const mediumImpactPatch = {
                ...mockToPatch,
                Vulnerability: {
                    ...mockToPatch.Vulnerability,
                    VulnerabilityId: 'CVE-2021-5678',
                    Severity: {
                        ...mockToPatch.Vulnerability.Severity,
                        Impact: 5.5
                    }
                }
            };

            wrapper = createWrapper({ patch: mediumImpactPatch });

            expect(wrapper.text()).toContain('Impact: 5.5');

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.text()).toBe('CVE-2021-5678');
        });

        it('should handle missing severity information gracefully', () => {
            const noSeverityPatch = {
                ...mockToPatch,
                Vulnerability: {
                    ...mockToPatch.Vulnerability,
                    VulnerabilityId: 'CVE-2021-9999',
                    Severity: {
                        ...mockToPatch.Vulnerability.Severity,
                        Impact: 0
                    }
                }
            };

            wrapper = createWrapper({ patch: noSeverityPatch });

            expect(wrapper.text()).toContain('Impact:'); // Should still render the label
        });
    });

    describe('Patched Version Information', () => {
        it('should display patched version label', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Patched version:');
        });

        it('should render SemverToString component', () => {
            wrapper = createWrapper();

            const semverComponent = wrapper.findComponent({ name: 'SemverToString' });
            expect(semverComponent.exists()).toBe(true);
        });

        it('should pass correct semver data to SemverToString', () => {
            wrapper = createWrapper();

            const semverComponent = wrapper.findComponent({ name: 'SemverToString' });
            const expectedSemver = mockPatchInfo.Patches['express@4.17.0'];
            expect(semverComponent.props('semver')).toEqual(expectedSemver);
        });

        it('should handle dependency key generation', () => {
            wrapper = createWrapper();

            const semverComponent = wrapper.findComponent({ name: 'SemverToString' });
            // Should use DependencyName@DependencyVersion as key
            expect(semverComponent.props('semver')).toEqual({
                Major: 4,
                Minor: 18,
                Patch: 0,
                PreReleaseTag: '',
                MetaData: ''
            });
        });

        it('should handle missing patch information', () => {
            const noPatchesPatchInfo = {
                ...mockPatchInfo,
                Patches: {}
            };

            wrapper = createWrapper({ patchInfo: noPatchesPatchInfo });

            const semverComponent = wrapper.findComponent({ name: 'SemverToString' });
            expect(semverComponent.props('semver')).toBeUndefined();
        });

        it('should handle different dependency names and versions', () => {
            const differentDependency = {
                ...mockToPatch,
                DependencyName: 'lodash',
                DependencyVersion: '4.17.20'
            };

            const patchInfoWithLodash = {
                ...mockPatchInfo,
                Patches: {
                    'lodash@4.17.20': {
                        Major: 4,
                        Minor: 17,
                        Patch: 21,
                        PreReleaseTag: '',
                        MetaData: ''
                    }
                }
            };

            wrapper = createWrapper({
                patch: differentDependency,
                patchInfo: patchInfoWithLodash
            });

            const semverComponent = wrapper.findComponent({ name: 'SemverToString' });
            expect(semverComponent.props('semver')).toEqual({
                Major: 4,
                Minor: 17,
                Patch: 21,
                PreReleaseTag: '',
                MetaData: ''
            });
        });
    });

    describe('Props Handling', () => {
        it('should accept patch prop', () => {
            wrapper = createWrapper();
            expect(wrapper.props('patch')).toEqual(mockToPatch);
        });

        it('should accept patchInfo prop', () => {
            wrapper = createWrapper();
            expect(wrapper.props('patchInfo')).toEqual(mockPatchInfo);
        });

        it('should handle prop updates', async () => {
            wrapper = createWrapper();

            const newPatch = {
                ...mockToPatch,
                DependencyName: 'react',
                DependencyVersion: '18.0.0'
            };

            await wrapper.setProps({ patch: newPatch });

            expect(wrapper.props('patch')).toEqual(newPatch);
        });
    });

    describe('Layout and Styling', () => {
        it('should apply correct layout classes', () => {
            wrapper = createWrapper();

            expect(wrapper.find('.flex.gap-2.items-center.justify-between').exists()).toBe(true);
        });

        it('should have proper component structure', () => {
            wrapper = createWrapper();

            // Main container
            const container = wrapper.find('.flex.gap-2.items-center.justify-between');
            expect(container.exists()).toBe(true);

            // Should contain breadcrumb, badge, impact, and version sections
            expect(container.findComponent({ name: 'Breadcrumb' }).exists()).toBe(true);
            expect(container.findComponent({ name: 'Badge' }).exists()).toBe(true);
            expect(container.text()).toContain('Impact:');
            expect(container.text()).toContain('Patched version:');
        });
    });

    describe('Component Integration', () => {
        it('should properly integrate with breadcrumb components', () => {
            wrapper = createWrapper();

            expect(wrapper.findComponent({ name: 'Breadcrumb' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'BreadcrumbList' }).exists()).toBe(true);
            expect(wrapper.findAllComponents({ name: 'BreadcrumbItem' }).length).toBeGreaterThan(0);
            expect(wrapper.findAllComponents({ name: 'BreadcrumbPage' }).length).toBeGreaterThan(0);
            expect(
                wrapper.findAllComponents({ name: 'BreadcrumbSeparator' }).length
            ).toBeGreaterThan(0);
        });

        it('should properly integrate with SemverToString component', () => {
            wrapper = createWrapper();

            const semverComponent = wrapper.findComponent({ name: 'SemverToString' });
            expect(semverComponent.exists()).toBe(true);
            expect(semverComponent.props('semver')).toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle special characters in dependency names', () => {
            const specialCharsPatch = {
                ...mockToPatch,
                DependencyName: '@scoped/package-name_with.special-chars',
                DependencyVersion: '1.0.0-beta.1'
            };

            const specialPatchInfo = {
                ...mockPatchInfo,
                Patches: {
                    '@scoped/package-name_with.special-chars@1.0.0-beta.1': {
                        Major: 1,
                        Minor: 0,
                        Patch: 0,
                        PreReleaseTag: '',
                        MetaData: ''
                    }
                }
            };

            wrapper = createWrapper({
                patch: specialCharsPatch,
                patchInfo: specialPatchInfo
            });

            const semverComponent = wrapper.findComponent({ name: 'SemverToString' });
            expect(semverComponent.props('semver')).toEqual({
                Major: 1,
                Minor: 0,
                Patch: 0,
                PreReleaseTag: '',
                MetaData: ''
            });
        });

        it('should handle paths with special characters', () => {
            const specialPathPatch = {
                ...mockToPatch,
                Path: ['node_modules', '@scoped/package', 'dist', 'es2015.module.js']
            };

            wrapper = createWrapper({ patch: specialPathPatch });

            expect(wrapper.text()).toContain('@scoped/package');
            expect(wrapper.text()).toContain('es2015.module.js');
        });

        it('should handle very long vulnerability IDs', () => {
            const longVulnPatch = {
                ...mockToPatch,
                Vulnerability: {
                    VulnerabilityId: 'CVE-2021-1234567890-VERY-LONG-VULNERABILITY-IDENTIFIER',
                    Severity: {
                        Impact: 'CRITICAL'
                    }
                }
            };

            wrapper = createWrapper({ patch: longVulnPatch });

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.text()).toBe('CVE-2021-1234567890-VERY-LONG-VULNERABILITY-IDENTIFIER');
        });

        it('should handle undefined vulnerability properties', () => {
            const undefinedVulnPatch = {
                ...mockToPatch,
                Vulnerability: {
                    ...mockToPatch.Vulnerability,
                    VulnerabilityId: 'CVE-2021-TEST',
                    Severity: {
                        ...mockToPatch.Vulnerability.Severity,
                        Impact: undefined as any
                    }
                }
            };

            wrapper = createWrapper({ patch: undefinedVulnPatch });

            expect(wrapper.text()).toContain('Impact:');
            expect(wrapper.text()).toContain('CVE-2021-TEST');
        });
    });
});
