import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DataTableDropDown from './DataTableDropDown.vue';

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn()
    }
});

// Mock URL parameters
const mockURLSearchParams = vi.fn();
mockURLSearchParams.prototype.get = vi.fn();
global.URLSearchParams = mockURLSearchParams;

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        search: '?analysis_id=test-analysis&project_id=test-project'
    },
    writable: true
});

// Mock shadcn components
vi.mock('@/shadcn/ui/dropdown-menu', () => ({
    DropdownMenu: {
        name: 'DropdownMenu',
        template: '<div data-testid="dropdown-menu"><slot></slot></div>'
    },
    DropdownMenuContent: {
        name: 'DropdownMenuContent',
        template: '<div data-testid="dropdown-menu-content"><slot></slot></div>',
        props: ['align']
    },
    DropdownMenuItem: {
        name: 'DropdownMenuItem',
        template:
            '<div data-testid="dropdown-menu-item" @click="$emit(\'click\')"><slot></slot></div>',
        emits: ['click']
    },
    DropdownMenuLabel: {
        name: 'DropdownMenuLabel',
        template: '<div data-testid="dropdown-menu-label"><slot></slot></div>'
    },
    DropdownMenuSeparator: {
        name: 'DropdownMenuSeparator',
        template: '<div data-testid="dropdown-menu-separator"></div>'
    },
    DropdownMenuTrigger: {
        name: 'DropdownMenuTrigger',
        template: '<div data-testid="dropdown-menu-trigger"><slot></slot></div>',
        props: ['asChild']
    }
}));

vi.mock('@/shadcn/ui/button', () => ({
    Button: {
        name: 'Button',
        template: '<button data-testid="button" :class="variant"><slot></slot></button>',
        props: ['variant']
    }
}));

// Mock lucide-vue-next
vi.mock('lucide-vue-next', () => ({
    MoreHorizontal: {
        name: 'MoreHorizontal',
        template: '<span data-testid="more-horizontal-icon"></span>'
    }
}));

// Mock RouterLink
const mockRouterLink = {
    name: 'RouterLink',
    template: '<a data-testid="router-link" :href="to.name" :title="title"><slot></slot></a>',
    props: ['to', 'title']
};

describe('DataTableDropDown.vue', () => {
    let wrapper: any;

    const mockDependency = {
        name: 'express',
        version: '4.18.0',
        vulnerabilities: ['CVE-2021-1234', 'CVE-2021-5678']
    };

    const mockDependencyNoVulns = {
        name: 'lodash',
        version: '4.17.21',
        vulnerabilities: []
    };

    const mockDependencyUndefinedVulns = {
        name: 'react',
        version: '18.2.0'
    };

    beforeEach(() => {
        // Setup URL search params mock
        mockURLSearchParams.mockImplementation(() => ({
            get: vi.fn((key: string) => {
                if (key === 'analysis_id') return 'test-analysis';
                if (key === 'project_id') return 'test-project';
                return null;
            })
        }));

        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    const createWrapper = (props = {}) => {
        return mount(DataTableDropDown, {
            props: {
                dependency: mockDependency,
                ...props
            },
            global: {
                components: {
                    RouterLink: mockRouterLink
                }
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render the dropdown menu', () => {
            wrapper = createWrapper();
            expect(wrapper.findComponent({ name: 'DropdownMenu' }).exists()).toBe(true);
        });

        it('should render the trigger button', () => {
            wrapper = createWrapper();

            const trigger = wrapper.findComponent({ name: 'DropdownMenuTrigger' });
            expect(trigger.exists()).toBe(true);

            const button = wrapper.findComponent({ name: 'Button' });
            expect(button.exists()).toBe(true);
            expect(button.props('variant')).toBe('ghost');
        });

        it('should render the MoreHorizontal icon', () => {
            wrapper = createWrapper();

            const icon = wrapper.findComponent({ name: 'MoreHorizontal' });
            expect(icon.exists()).toBe(true);
        });

        it('should render dropdown content', () => {
            wrapper = createWrapper();

            const content = wrapper.findComponent({ name: 'DropdownMenuContent' });
            expect(content.exists()).toBe(true);
            expect(content.props('align')).toBe('end');
        });

        it('should render dropdown label', () => {
            wrapper = createWrapper();

            const label = wrapper.findComponent({ name: 'DropdownMenuLabel' });
            expect(label.exists()).toBe(true);
            expect(label.text()).toBe('Actions');
        });

        it('should render dropdown items', () => {
            wrapper = createWrapper();

            const items = wrapper.findAllComponents({ name: 'DropdownMenuItem' });
            expect(items.length).toBe(2);
        });

        it('should render separator', () => {
            wrapper = createWrapper();

            const separator = wrapper.findComponent({ name: 'DropdownMenuSeparator' });
            expect(separator.exists()).toBe(true);
        });

        it('should display copy CVE ID option', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Copy CVE ID');
        });

        it('should display view dependency details option', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('View dependency details');
        });

        it('should render RouterLink for dependency details', () => {
            wrapper = createWrapper();

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            expect(routerLink.exists()).toBe(true);
            expect(routerLink.props('title')).toBe('View dependency details');
        });
    });

    describe('URL Parameters Handling', () => {
        it('should extract analysis_id from URL parameters', () => {
            wrapper = createWrapper();

            expect(wrapper.vm.analysis_id).toBe('test-analysis');
        });

        it('should extract project_id from URL parameters', () => {
            wrapper = createWrapper();

            expect(wrapper.vm.project_id).toBe('test-project');
        });

        it('should handle missing URL parameters', () => {
            mockURLSearchParams.mockImplementation(() => ({
                get: vi.fn(() => null)
            }));

            wrapper = createWrapper();

            expect(wrapper.vm.analysis_id).toBeNull();
            expect(wrapper.vm.project_id).toBeNull();
        });
    });

    describe('RouterLink Configuration', () => {
        it('should configure RouterLink with correct route name', () => {
            wrapper = createWrapper();

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            const linkTo = routerLink.props('to');

            expect(linkTo.name).toBe('results');
        });

        it('should pass correct query parameters to RouterLink', () => {
            wrapper = createWrapper();

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            const linkTo = routerLink.props('to');

            expect(linkTo.query.analysis_id).toBe('test-analysis');
            expect(linkTo.query.project_id).toBe('test-project');
            expect(linkTo.query.package_id).toBe('express@4.18.0');
        });

        it('should set correct route params', () => {
            wrapper = createWrapper();

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            const linkTo = routerLink.props('to');

            expect(linkTo.params.page).toBe('sbom_details');
        });

        it('should generate package_id from dependency name and version', () => {
            const testDependency = {
                name: 'vue',
                version: '3.2.0',
                vulnerabilities: []
            };

            wrapper = createWrapper({ dependency: testDependency });

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            const linkTo = routerLink.props('to');

            expect(linkTo.query.package_id).toBe('vue@3.2.0');
        });
    });

    describe('Copy Functionality', () => {
        it('should copy vulnerabilities when they exist', async () => {
            wrapper = createWrapper();

            const copyItem = wrapper.findAllComponents({ name: 'DropdownMenuItem' })[0];
            await copyItem.vm.$emit('click');

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                'CVE-2021-1234, CVE-2021-5678'
            );
        });

        it('should copy "No vulnerabilities found" when vulnerabilities array is empty', async () => {
            wrapper = createWrapper({ dependency: mockDependencyNoVulns });

            const copyItem = wrapper.findAllComponents({ name: 'DropdownMenuItem' })[0];
            await copyItem.vm.$emit('click');

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('No vulnerabilities found');
        });

        it('should copy "No vulnerabilities found" when vulnerabilities is undefined', async () => {
            wrapper = createWrapper({ dependency: mockDependencyUndefinedVulns });

            const copyItem = wrapper.findAllComponents({ name: 'DropdownMenuItem' })[0];
            await copyItem.vm.$emit('click');

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('No vulnerabilities found');
        });

        it('should handle single vulnerability', async () => {
            const singleVulnDep = {
                name: 'test-package',
                version: '1.0.0',
                vulnerabilities: ['CVE-2023-1234']
            };

            wrapper = createWrapper({ dependency: singleVulnDep });

            const copyItem = wrapper.findAllComponents({ name: 'DropdownMenuItem' })[0];
            await copyItem.vm.$emit('click');

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('CVE-2023-1234');
        });

        it('should handle multiple vulnerabilities with proper joining', async () => {
            const multiVulnDep = {
                name: 'test-package',
                version: '1.0.0',
                vulnerabilities: ['CVE-2023-1', 'CVE-2023-2', 'CVE-2023-3']
            };

            wrapper = createWrapper({ dependency: multiVulnDep });

            const copyItem = wrapper.findAllComponents({ name: 'DropdownMenuItem' })[0];
            await copyItem.vm.$emit('click');

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                'CVE-2023-1, CVE-2023-2, CVE-2023-3'
            );
        });
    });

    describe('Accessibility', () => {
        it('should have screen reader text for the trigger button', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Open menu');
            expect(wrapper.find('.sr-only').text()).toBe('Open menu');
        });

        it('should have proper title attribute on RouterLink', () => {
            wrapper = createWrapper();

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            expect(routerLink.props('title')).toBe('View dependency details');
        });
    });

    describe('Component Props', () => {
        it('should accept dependency prop with required fields', () => {
            wrapper = createWrapper();

            expect(wrapper.props('dependency')).toEqual(mockDependency);
            expect(wrapper.props('dependency').name).toBe('express');
            expect(wrapper.props('dependency').version).toBe('4.18.0');
            expect(wrapper.props('dependency').vulnerabilities).toEqual([
                'CVE-2021-1234',
                'CVE-2021-5678'
            ]);
        });

        it('should handle dependency prop without vulnerabilities', () => {
            wrapper = createWrapper({ dependency: mockDependencyUndefinedVulns });

            expect(wrapper.props('dependency').name).toBe('react');
            expect(wrapper.props('dependency').version).toBe('18.2.0');
            expect(wrapper.props('dependency').vulnerabilities).toBeUndefined();
        });

        it('should handle dependency prop with empty vulnerabilities', () => {
            wrapper = createWrapper({ dependency: mockDependencyNoVulns });

            expect(wrapper.props('dependency').vulnerabilities).toEqual([]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle special characters in dependency name', () => {
            const specialDep = {
                name: '@scoped/package-name',
                version: '1.0.0-beta.1',
                vulnerabilities: ['CVE-2023-1234']
            };

            wrapper = createWrapper({ dependency: specialDep });

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            const linkTo = routerLink.props('to');

            expect(linkTo.query.package_id).toBe('@scoped/package-name@1.0.0-beta.1');
        });

        it('should handle very long vulnerability lists', async () => {
            const longVulnList = Array.from(
                { length: 100 },
                (_, i) => `CVE-2023-${String(i).padStart(4, '0')}`
            );
            const longVulnDep = {
                name: 'vulnerable-package',
                version: '1.0.0',
                vulnerabilities: longVulnList
            };

            wrapper = createWrapper({ dependency: longVulnDep });

            const copyItem = wrapper.findAllComponents({ name: 'DropdownMenuItem' })[0];
            await copyItem.vm.$emit('click');

            const expectedText = longVulnList.join(', ');
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedText);
        });

        it('should handle empty dependency name', () => {
            const emptyNameDep = {
                name: '',
                version: '1.0.0',
                vulnerabilities: []
            };

            wrapper = createWrapper({ dependency: emptyNameDep });

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            const linkTo = routerLink.props('to');

            expect(linkTo.query.package_id).toBe('@1.0.0');
        });

        it('should handle empty version', () => {
            const emptyVersionDep = {
                name: 'test-package',
                version: '',
                vulnerabilities: []
            };

            wrapper = createWrapper({ dependency: emptyVersionDep });

            const routerLink = wrapper.findComponent({ name: 'RouterLink' });
            const linkTo = routerLink.props('to');

            expect(linkTo.query.package_id).toBe('test-package@');
        });
    });

    describe('Copy Function Unit Tests', () => {
        it('should return early for undefined vulnerabilities', () => {
            wrapper = createWrapper();

            wrapper.vm.copy(undefined);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('No vulnerabilities found');
        });

        it('should return early for empty vulnerabilities array', () => {
            wrapper = createWrapper();

            wrapper.vm.copy([]);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('No vulnerabilities found');
        });

        it('should join vulnerabilities with comma and space', () => {
            wrapper = createWrapper();

            wrapper.vm.copy(['CVE-1', 'CVE-2', 'CVE-3']);
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('CVE-1, CVE-2, CVE-3');
        });
    });
});
