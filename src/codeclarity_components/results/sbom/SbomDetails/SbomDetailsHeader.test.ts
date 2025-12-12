import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import { type DependencyDetails } from './SbomDetails';
import SbomDetailsHeader from './SbomDetailsHeader.vue';

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        props: ['icon', 'class'],
        template: '<span class="mock-icon" :class="$props.class">{{ icon }}</span>'
    }
}));

// Mock Badge component
vi.mock('@/shadcn/ui/badge', () => ({
    Badge: {
        name: 'Badge',
        props: ['variant', 'class'],
        template: '<div class="mock-badge" :class="$props.class"><slot></slot></div>'
    }
}));

describe('SbomDetailsHeader.vue', () => {
    const createMockDependency = (overrides = {}): DependencyDetails => {
        return {
            name: 'test-package',
            version: '1.2.3',
            source: {
                Type: 'git',
                Url: 'git+https://github.com/test/test-package.git'
            },
            ...overrides
        } as DependencyDetails;
    };

    const createWrapper = (dependency = createMockDependency()) => {
        return mount(SbomDetailsHeader, {
            props: {
                dependency
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render the main header container', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.sbom-header').exists()).toBe(true);
        });

        it('should render package title section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.package-title-section').exists()).toBe(true);
            expect(wrapper.find('.package-name-version').exists()).toBe(true);
        });

        it('should render external links section', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.external-links').exists()).toBe(true);
        });
    });

    describe('Package Information Display', () => {
        it('should display package name correctly', () => {
            const dependency = createMockDependency({ name: 'my-awesome-package' });
            const wrapper = createWrapper(dependency);

            const packageName = wrapper.find('.package-name');
            expect(packageName.exists()).toBe(true);
            expect(packageName.text()).toBe('my-awesome-package');
        });

        it('should display package version correctly', () => {
            const dependency = createMockDependency({ version: '2.1.0' });
            const wrapper = createWrapper(dependency);

            const packageVersion = wrapper.find('.package-version');
            expect(packageVersion.exists()).toBe(true);
            expect(packageVersion.text()).toBe('@2.1.0');
        });

        it('should handle long package names', () => {
            const dependency = createMockDependency({
                name: 'very-long-package-name-that-might-cause-layout-issues'
            });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.package-name').text()).toBe(
                'very-long-package-name-that-might-cause-layout-issues'
            );
        });

        it('should handle complex version strings', () => {
            const dependency = createMockDependency({ version: '1.0.0-beta.1+build.123' });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.package-version').text()).toBe('@1.0.0-beta.1+build.123');
        });
    });

    describe('NPM Link', () => {
        it('should render NPM link badge', () => {
            const wrapper = createWrapper();

            const badges = wrapper.findAllComponents({ name: 'Badge' });
            expect(badges.length).toBeGreaterThanOrEqual(1);

            const npmLink = wrapper.find('a[href*="npmjs.com"]');
            expect(npmLink.exists()).toBe(true);
        });

        it('should generate correct NPM URL', () => {
            const dependency = createMockDependency({
                name: 'test-package',
                version: '1.2.3'
            });
            const wrapper = createWrapper(dependency);

            const npmLink = wrapper.find('a[href*="npmjs.com"]');
            expect(npmLink.attributes('href')).toBe(
                'https://www.npmjs.com/package/test-package/v/1.2.3'
            );
        });

        it('should have correct NPM link attributes', () => {
            const wrapper = createWrapper();

            const npmLink = wrapper.find('a[href*="npmjs.com"]');
            expect(npmLink.attributes('target')).toBe('_blank');
            expect(npmLink.attributes('title')).toBe('View on NPM (opens in new tab)');
        });

        it('should render NPM icon', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('akar-icons:npm-fill');
            expect(wrapper.text()).toContain('NPM');
        });
    });

    describe('Yarn Link', () => {
        it('should render Yarn link badge', () => {
            const wrapper = createWrapper();

            const yarnLink = wrapper.find('a[href*="yarnpkg.com"]');
            expect(yarnLink.exists()).toBe(true);
        });

        it('should generate correct Yarn URL', () => {
            const dependency = createMockDependency({
                name: 'test-package',
                version: '1.2.3'
            });
            const wrapper = createWrapper(dependency);

            const yarnLink = wrapper.find('a[href*="yarnpkg.com"]');
            expect(yarnLink.attributes('href')).toBe(
                'https://yarnpkg.com/package?name=test-package&version=1.2.3'
            );
        });

        it('should have correct Yarn link attributes', () => {
            const wrapper = createWrapper();

            const yarnLink = wrapper.find('a[href*="yarnpkg.com"]');
            expect(yarnLink.attributes('target')).toBe('_blank');
            expect(yarnLink.attributes('title')).toBe('View on Yarn (opens in new tab)');
        });

        it('should render Yarn icon', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('akar-icons:yarn-fill');
            expect(wrapper.text()).toContain('Yarn');
        });
    });

    describe('Repository Link', () => {
        it('should render GitHub repository link when source is GitHub', () => {
            const dependency = createMockDependency({
                source: {
                    Type: 'git',
                    Url: 'git+https://github.com/test/test-package.git'
                }
            });
            const wrapper = createWrapper(dependency);

            const repoLink = wrapper.find('a[href*="github.com"]');
            expect(repoLink.exists()).toBe(true);
            expect(wrapper.text()).toContain('akar-icons:github-fill');
            expect(wrapper.text()).toContain('GitHub');
        });

        it('should render GitLab repository link when source is GitLab', () => {
            const dependency = createMockDependency({
                source: {
                    Type: 'git',
                    Url: 'git+https://gitlab.com/test/test-package.git'
                }
            });
            const wrapper = createWrapper(dependency);

            const repoLink = wrapper.find('a[href*="gitlab.com"]');
            expect(repoLink.exists()).toBe(true);
            expect(wrapper.text()).toContain('akar-icons:gitlab-fill');
            expect(wrapper.text()).toContain('GitLab');
        });

        it('should clean git+ prefix from repository URL', () => {
            const dependency = createMockDependency({
                source: {
                    Type: 'git',
                    Url: 'git+https://github.com/test/test-package.git'
                }
            });
            const wrapper = createWrapper(dependency);

            const repoLink = wrapper.find('a[href*="github.com"]');
            expect(repoLink.attributes('href')).toBe('https://github.com/test/test-package.git');
        });

        it('should have correct repository link attributes', () => {
            const wrapper = createWrapper();

            const repoLink = wrapper.find('a[href*="github.com"]');
            expect(repoLink.attributes('target')).toBe('_blank');
            expect(repoLink.attributes('title')).toBe('View repository (opens in new tab)');
        });

        it('should not render repository link when source is missing', () => {
            const dependency = createMockDependency({ source: null });
            const wrapper = createWrapper(dependency);

            const repoLinks = wrapper.findAll('a[href*="github.com"], a[href*="gitlab.com"]');
            expect(repoLinks.length).toBe(0);
        });

        it('should not render repository link when source type is not git', () => {
            const dependency = createMockDependency({
                source: {
                    Type: 'npm',
                    Url: 'https://registry.npmjs.org/test-package'
                }
            });
            const wrapper = createWrapper(dependency);

            const repoLinks = wrapper.findAll('a[href*="github.com"], a[href*="gitlab.com"]');
            expect(repoLinks.length).toBe(0);
        });
    });

    describe('Badge Components', () => {
        it('should render all badges with correct variant', () => {
            const wrapper = createWrapper();

            const badges = wrapper.findAllComponents({ name: 'Badge' });
            expect(badges.length).toBeGreaterThanOrEqual(2); // NPM, Yarn, and possibly repo

            badges.forEach((badge) => {
                expect(badge.props('variant')).toBe('secondary');
                expect(badge.classes()).toContain('link-badge');
            });
        });

        it('should render minimum badges when no repository source', () => {
            const dependency = createMockDependency({ source: null });
            const wrapper = createWrapper(dependency);

            const badges = wrapper.findAllComponents({ name: 'Badge' });
            expect(badges.length).toBe(2); // Only NPM and Yarn
        });

        it('should render all badges when repository source present', () => {
            const wrapper = createWrapper();

            const badges = wrapper.findAllComponents({ name: 'Badge' });
            expect(badges.length).toBe(3); // NPM, Yarn, and GitHub
        });
    });

    describe('Icons Rendering', () => {
        it('should render all expected icons', () => {
            const wrapper = createWrapper();

            const icons = wrapper.findAllComponents({ name: 'Icon' });
            expect(icons.length).toBeGreaterThanOrEqual(3);

            const iconNames = icons.map((icon) => icon.props('icon'));
            expect(iconNames).toContain('akar-icons:npm-fill');
            expect(iconNames).toContain('akar-icons:yarn-fill');
            expect(iconNames).toContain('akar-icons:github-fill');
        });

        it('should apply correct icon classes', () => {
            const wrapper = createWrapper();

            const icons = wrapper.findAllComponents({ name: 'Icon' });
            icons.forEach((icon) => {
                expect(icon.classes()).toContain('link-icon');
            });
        });
    });

    describe('Link Content Structure', () => {
        it('should have correct link content structure', () => {
            const wrapper = createWrapper();

            const linkContents = wrapper.findAll('.link-content');
            expect(linkContents.length).toBeGreaterThanOrEqual(2);

            linkContents.forEach((linkContent) => {
                // Each link should have an icon and text
                const icon = linkContent.findComponent({ name: 'Icon' });
                expect(icon.exists()).toBe(true);

                const span = linkContent.find('span');
                expect(span.exists()).toBe(true);
            });
        });

        it('should have proper accessibility attributes', () => {
            const wrapper = createWrapper();

            const links = wrapper.findAll('a');
            links.forEach((link) => {
                expect(link.attributes('target')).toBe('_blank');
                expect(link.attributes('title')).toBeDefined();
                expect(link.attributes('title')).toMatch(/opens in new tab/);
            });
        });
    });

    describe('Props Validation', () => {
        it('should accept dependency prop', () => {
            const dependency = createMockDependency();
            const wrapper = createWrapper(dependency);

            expect(wrapper.props('dependency')).toEqual(dependency);
        });

        it('should require dependency prop', () => {
            // This would normally throw in real Vue but in tests we check component definition
            expect(SbomDetailsHeader.props?.dependency?.required).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle dependency with empty name', () => {
            const dependency = createMockDependency({ name: '' });
            const wrapper = createWrapper(dependency);

            const packageName = wrapper.find('.package-name');
            expect(packageName.text()).toBe('');
        });

        it('should handle dependency with empty version', () => {
            const dependency = createMockDependency({ version: '' });
            const wrapper = createWrapper(dependency);

            const packageVersion = wrapper.find('.package-version');
            expect(packageVersion.text()).toBe('@');
        });

        it('should handle special characters in package name', () => {
            const dependency = createMockDependency({ name: '@scope/package-name' });
            const wrapper = createWrapper(dependency);

            expect(wrapper.find('.package-name').text()).toBe('@scope/package-name');

            // Check URL encoding
            const npmLink = wrapper.find('a[href*="npmjs.com"]');
            expect(npmLink.attributes('href')).toContain('@scope/package-name');
        });

        it('should handle repository URL without git+ prefix', () => {
            const dependency = createMockDependency({
                source: {
                    Type: 'git',
                    Url: 'https://github.com/test/test-package.git'
                }
            });
            const wrapper = createWrapper(dependency);

            const repoLink = wrapper.find('a[href*="github.com"]');
            expect(repoLink.attributes('href')).toBe('https://github.com/test/test-package.git');
        });

        it('should handle repository URL with complex path', () => {
            const dependency = createMockDependency({
                source: {
                    Type: 'git',
                    Url: 'git+https://github.com/org/subgroup/package-name.git'
                }
            });
            const wrapper = createWrapper(dependency);

            const repoLink = wrapper.find('a[href*="github.com"]');
            expect(repoLink.attributes('href')).toBe(
                'https://github.com/org/subgroup/package-name.git'
            );
        });
    });

    describe('Styling and Layout', () => {
        it('should have correct CSS classes for main sections', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.sbom-header').exists()).toBe(true);
            expect(wrapper.find('.package-title-section').exists()).toBe(true);
            expect(wrapper.find('.package-name-version').exists()).toBe(true);
            expect(wrapper.find('.external-links').exists()).toBe(true);
        });

        it('should apply correct text styling classes', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.package-name').exists()).toBe(true);
            expect(wrapper.find('.package-version').exists()).toBe(true);
        });

        it('should apply link styling classes', () => {
            const wrapper = createWrapper();

            const linkContents = wrapper.findAll('.link-content');
            expect(linkContents.length).toBeGreaterThan(0);

            const linkIcons = wrapper.findAll('.link-icon');
            expect(linkIcons.length).toBeGreaterThan(0);
        });
    });
});
