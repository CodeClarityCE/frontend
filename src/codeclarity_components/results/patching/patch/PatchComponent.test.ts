import { SeverityType, Impact, type PatchInfo } from '@/codeclarity_components/results/patching/Patching';
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PatchComponent from './PatchComponent.vue';

// Mock child components
vi.mock('./PatchInformation.vue', () => ({
    default: {
        name: 'PatchInformation',
        template:
            '<div data-testid="patch-information" :data-patch-type="patch.Vulnerability?.Severity?.ConfidentialityImpact">{{ patch.DependencyName }}</div>',
        props: ['patch', 'patchInfo']
    }
}));

// Mock shadcn components
vi.mock('@/shadcn/ui/badge/Badge.vue', () => ({
    default: {
        name: 'Badge',
        template: '<span data-testid="badge" class="badge"><slot></slot></span>'
    }
}));

vi.mock('@/shadcn/ui/card/Card.vue', () => ({
    default: {
        name: 'Card',
        template: '<div data-testid="card" class="card"><slot></slot></div>'
    }
}));

vi.mock('@/shadcn/ui/card/CardContent.vue', () => ({
    default: {
        name: 'CardContent',
        template: '<div data-testid="card-content" class="card-content"><slot></slot></div>',
        props: ['class']
    }
}));

vi.mock('@/shadcn/ui/tabs/Tabs.vue', () => ({
    default: {
        name: 'Tabs',
        template: '<div data-testid="tabs" class="tabs"><slot></slot></div>',
        props: ['defaultValue']
    }
}));

vi.mock('@/shadcn/ui/tabs/TabsList.vue', () => ({
    default: {
        name: 'TabsList',
        template: '<div data-testid="tabs-list" class="tabs-list"><slot></slot></div>',
        props: ['class']
    }
}));

vi.mock('@/shadcn/ui/tabs/TabsTrigger.vue', () => ({
    default: {
        name: 'TabsTrigger',
        template:
            '<button data-testid="tabs-trigger" :data-value="value" class="tabs-trigger"><slot></slot></button>',
        props: ['value']
    }
}));

vi.mock('@/shadcn/ui/tabs/TabsContent.vue', () => ({
    default: {
        name: 'TabsContent',
        template:
            '<div data-testid="tabs-content" :data-value="value" class="tabs-content"><slot></slot></div>',
        props: ['value']
    }
}));

vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<span data-testid="icon" :data-icon="icon" class="icon"></span>',
        props: ['icon']
    }
}));

describe('PatchComponent.vue', () => {
    let wrapper: any;

    const mockPatchInfo: PatchInfo = {
        TopLevelVulnerable: false,
        IsPatchable: 'FULL',
        Patchable: [
            {
                DependencyName: 'express',
                DependencyVersion: '4.17.0',
                Path: ['node_modules', 'express'],
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
            }
        ],
        Unpatchable: [
            {
                DependencyName: 'lodash',
                DependencyVersion: '4.17.20',
                Path: ['node_modules', 'lodash'],
                Vulnerability: {
                    Id: 'vuln-id-2',
                    Sources: [],
                    AffectedDependency: 'lodash',
                    AffectedVersion: '4.17.20',
                    VulnerabilityId: 'CVE-2021-5678',
                    Severity: {
                        Severity: 5.5,
                        SeverityType: SeverityType.CvssV3,
                        Vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
                        Impact: 5.5,
                        Exploitability: 8.6,
                        ConfidentialityImpact: Impact.Low,
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
            }
        ],
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

    const mockPartialPatchInfo: PatchInfo = {
        ...mockPatchInfo,
        IsPatchable: 'PARTIAL'
    };

    const mockNoPatchInfo: PatchInfo = {
        ...mockPatchInfo,
        IsPatchable: 'NONE'
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
        return mount(PatchComponent, {
            props: {
                patch: mockPatchInfo,
                name: 'Test Patch',
                type: 'prod',
                ...props
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render the main card container', () => {
            wrapper = createWrapper();

            expect(wrapper.findComponent({ name: 'Card' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'CardContent' }).exists()).toBe(true);
        });

        it('should render the header section with badge, name, and status', () => {
            wrapper = createWrapper();

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.exists()).toBe(true);
            expect(badge.text()).toBe('prod');

            expect(wrapper.text()).toContain('Test Patch');
        });

        it('should render tabs component', () => {
            wrapper = createWrapper();

            const tabs = wrapper.findComponent({ name: 'Tabs' });
            expect(tabs.exists()).toBe(true);
            expect(tabs.props('defaultValue')).toBe('patches');
        });

        it('should render tabs list and triggers', () => {
            wrapper = createWrapper();

            expect(wrapper.findComponent({ name: 'TabsList' }).exists()).toBe(true);

            const triggers = wrapper.findAllComponents({ name: 'TabsTrigger' });
            expect(triggers).toHaveLength(2);
            expect(triggers[0].props('value')).toBe('patches');
            expect(triggers[1].props('value')).toBe('tree');
        });

        it('should render tab content areas', () => {
            wrapper = createWrapper();

            const contents = wrapper.findAllComponents({ name: 'TabsContent' });
            expect(contents).toHaveLength(2);
            expect(contents[0].props('value')).toBe('patches');
            expect(contents[1].props('value')).toBe('tree');
        });

        it('should display tab labels with icons', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Patches');
            expect(wrapper.text()).toContain('Tree');

            const icons = wrapper.findAllComponents({ name: 'Icon' });
            const iconProps = icons.map((icon: any) => icon.props('icon'));
            expect(iconProps).toContain('bi:list');
            expect(iconProps).toContain('ri:node-tree');
        });
    });

    describe('Patch Status Display', () => {
        it('should display full patch status', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Full patch available');

            const fullPatchIcon = wrapper.findAll('[data-icon="bi:shield-fill-check"]');
            expect(fullPatchIcon).toHaveLength(1);
        });

        it('should display partial patch status', () => {
            wrapper = createWrapper({ patch: mockPartialPatchInfo });

            expect(wrapper.text()).toContain('Partial patch available');

            const partialPatchIcon = wrapper.findAll('[data-icon="bi:shield-fill-minus"]');
            expect(partialPatchIcon).toHaveLength(1);
        });

        it('should display no patch status', () => {
            wrapper = createWrapper({ patch: mockNoPatchInfo });

            expect(wrapper.text()).toContain('No patch available');

            const noPatchIcon = wrapper.findAll('[data-icon="bi:shield-fill-exclamation"]');
            expect(noPatchIcon).toHaveLength(1);
        });

        it('should apply correct CSS classes for patch status', () => {
            wrapper = createWrapper();

            const fullPatchElement = wrapper.find('.text-severity-low');
            expect(fullPatchElement.exists()).toBe(true);
        });

        it('should apply correct CSS classes for partial patch status', () => {
            wrapper = createWrapper({ patch: mockPartialPatchInfo });

            const partialPatchElement = wrapper.find('.text-severity-medium');
            expect(partialPatchElement.exists()).toBe(true);
        });

        it('should apply correct CSS classes for no patch status', () => {
            wrapper = createWrapper({ patch: mockNoPatchInfo });

            const noPatchElement = wrapper.find('.text-severity-high');
            expect(noPatchElement.exists()).toBe(true);
        });
    });

    describe('Patch Information Components', () => {
        it('should render PatchInformation components for unpatchable items', () => {
            wrapper = createWrapper();

            const patchInfoComponents = wrapper.findAllComponents({ name: 'PatchInformation' });
            expect(patchInfoComponents.length).toBeGreaterThan(0);

            // Check that unpatchable patches are rendered
            const unpatchableComponent = patchInfoComponents.find(
                (comp: any) => comp.props('patch').DependencyName === 'lodash'
            );
            expect(unpatchableComponent).toBeDefined();
        });

        it('should render PatchInformation components for patchable items', () => {
            wrapper = createWrapper();

            const patchInfoComponents = wrapper.findAllComponents({ name: 'PatchInformation' });

            // Check that patchable patches are rendered
            const patchableComponent = patchInfoComponents.find(
                (comp: any) => comp.props('patch').DependencyName === 'express'
            );
            expect(patchableComponent).toBeDefined();
        });

        it('should pass correct props to PatchInformation components', () => {
            wrapper = createWrapper();

            const patchInfoComponents = wrapper.findAllComponents({ name: 'PatchInformation' });

            patchInfoComponents.forEach((component: any) => {
                expect(component.props('patchInfo')).toEqual(mockPatchInfo);
                expect(component.props('patch')).toBeDefined();
            });
        });

        it('should render all unpatchable and patchable items', () => {
            wrapper = createWrapper();

            const patchInfoComponents = wrapper.findAllComponents({ name: 'PatchInformation' });
            expect(patchInfoComponents).toHaveLength(2); // 1 patchable + 1 unpatchable
        });
    });

    describe('Props Handling', () => {
        it('should accept patch prop', () => {
            wrapper = createWrapper();
            expect(wrapper.props('patch')).toEqual(mockPatchInfo);
        });

        it('should accept name prop as string', () => {
            wrapper = createWrapper({ name: 'Custom Patch Name' });
            expect(wrapper.props('name')).toBe('Custom Patch Name');
            expect(wrapper.text()).toContain('Custom Patch Name');
        });

        it('should accept name prop as number', () => {
            wrapper = createWrapper({ name: 42 });
            expect(wrapper.props('name')).toBe(42);
            expect(wrapper.text()).toContain('42');
        });

        it('should accept type prop', () => {
            wrapper = createWrapper({ type: 'dev' });
            expect(wrapper.props('type')).toBe('dev');

            const badge = wrapper.findComponent({ name: 'Badge' });
            expect(badge.text()).toBe('dev');
        });
    });

    describe('Empty Data Handling', () => {
        it('should handle patch with no patchable items', () => {
            const noPatchableInfo = {
                ...mockPatchInfo,
                Patchable: []
            };

            wrapper = createWrapper({ patch: noPatchableInfo });

            const patchInfoComponents = wrapper.findAllComponents({ name: 'PatchInformation' });
            expect(patchInfoComponents).toHaveLength(1); // Only unpatchable items
        });

        it('should handle patch with no unpatchable items', () => {
            const noUnpatchableInfo = {
                ...mockPatchInfo,
                Unpatchable: []
            };

            wrapper = createWrapper({ patch: noUnpatchableInfo });

            const patchInfoComponents = wrapper.findAllComponents({ name: 'PatchInformation' });
            expect(patchInfoComponents).toHaveLength(1); // Only patchable items
        });

        it('should handle patch with no items at all', () => {
            const noItemsInfo = {
                ...mockPatchInfo,
                Patchable: [],
                Unpatchable: []
            };

            wrapper = createWrapper({ patch: noItemsInfo });

            const patchInfoComponents = wrapper.findAllComponents({ name: 'PatchInformation' });
            expect(patchInfoComponents).toHaveLength(0);
        });
    });

    describe('Layout and Styling', () => {
        it('should apply correct flex layout classes', () => {
            wrapper = createWrapper();

            expect(wrapper.find('.flex.flex-col.gap-4').exists()).toBe(true);
            expect(wrapper.find('.flex.flex-row.items-center.gap-8.font-bold').exists()).toBe(true);
        });

        it('should have proper card styling', () => {
            wrapper = createWrapper();

            const cardContent = wrapper.findComponent({ name: 'CardContent' });
            expect(cardContent.props('class')).toContain('pt-4');
        });

        it('should have proper tabs styling', () => {
            wrapper = createWrapper();

            const tabs = wrapper.findComponent({ name: 'Tabs' });
            expect(tabs.exists()).toBe(true);

            const tabsList = wrapper.findComponent({ name: 'TabsList' });
            expect(tabsList.exists()).toBe(true);
        });
    });

    describe('Component Integration', () => {
        it('should properly integrate with shadcn components', () => {
            wrapper = createWrapper();

            // Verify all shadcn components are present
            expect(wrapper.findComponent({ name: 'Card' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'CardContent' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'Tabs' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'TabsList' }).exists()).toBe(true);
            expect(wrapper.findAllComponents({ name: 'TabsTrigger' })).toHaveLength(2);
            expect(wrapper.findAllComponents({ name: 'TabsContent' })).toHaveLength(2);
        });

        it('should properly integrate with Icon component', () => {
            wrapper = createWrapper();

            const icons = wrapper.findAllComponents({ name: 'Icon' });
            expect(icons.length).toBeGreaterThan(0);

            // Check specific icons are present
            const iconNames = icons.map((icon: any) => icon.props('icon'));
            expect(iconNames).toContain('bi:shield-fill-check');
            expect(iconNames).toContain('bi:list');
            expect(iconNames).toContain('ri:node-tree');
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined IsPatchable gracefully', () => {
            const undefinedPatchableInfo = {
                ...mockPatchInfo,
                IsPatchable: undefined as any
            };

            wrapper = createWrapper({ patch: undefinedPatchableInfo });

            // Should default to "No patch available" case
            expect(wrapper.text()).toContain('No patch available');
        });

        it('should handle very long patch names', () => {
            const longName =
                'Very long patch name that might overflow the container and cause layout issues';

            wrapper = createWrapper({ name: longName });

            expect(wrapper.text()).toContain(longName);
        });

        it('should handle special characters in patch name', () => {
            const specialName = '@scoped/package-name-with-special-chars_123';

            wrapper = createWrapper({ name: specialName });

            expect(wrapper.text()).toContain(specialName);
        });
    });
});
