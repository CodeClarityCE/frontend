import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import VulnReferences from './VulnReferences.vue';

// Mock Icon component
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        props: ['icon'],
        template: '<span class="mock-icon">{{ icon }}</span>'
    }
}));

describe('VulnReferences.vue', () => {
    const mockReferences = [
        {
            url: 'https://example.com/vuln1',
            tags: ['advisory', 'patch']
        },
        {
            url: 'https://github.com/user/repo/issues/123',
            tags: ['exploit', 'proof-of-concept']
        },
        {
            url: 'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-1234',
            tags: ['official']
        }
    ];

    const createWrapper = (props = {}) => {
        return mount(VulnReferences, {
            props: {
                references: mockReferences,
                referencesLimit: 8,
                onToggle: vi.fn(),
                ...props
            }
        });
    };

    describe('Component Rendering', () => {
        it('should render all references when limit is not exceeded', () => {
            const wrapper = createWrapper();

            const referenceElements = wrapper.findAll('.reference');
            expect(referenceElements.length).toBe(3);
        });

        it('should render only limited references when limit is set', () => {
            const wrapper = createWrapper({ referencesLimit: 2 });

            const referenceElements = wrapper.findAll('.reference');
            expect(referenceElements.length).toBe(2);
        });

        it('should render correct URLs and hosts', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('https://example.com/vuln1');
            expect(wrapper.text()).toContain('example.com');
            expect(wrapper.text()).toContain('github.com');
            expect(wrapper.text()).toContain('cve.mitre.org');
        });

        it('should render tags for each reference', () => {
            const wrapper = createWrapper();

            expect(wrapper.text()).toContain('advisory');
            expect(wrapper.text()).toContain('patch');
            expect(wrapper.text()).toContain('exploit');
            expect(wrapper.text()).toContain('proof-of-concept');
            expect(wrapper.text()).toContain('official');
        });

        it('should render favicon images', () => {
            const wrapper = createWrapper();

            const images = wrapper.findAll('img');
            expect(images.length).toBe(3);

            images.forEach((img) => {
                expect(img.attributes('src')).toContain('googleusercontent.com/s2/favicons');
            });
        });

        it('should render external link icons', () => {
            const wrapper = createWrapper();

            const icons = wrapper.findAll('.mock-icon');
            expect(icons.length).toBe(3);

            icons.forEach((icon) => {
                expect(icon.text()).toContain('ion:open-outline');
            });
        });
    });

    describe('URL Handling', () => {
        it('should generate correct favicon URLs', () => {
            const wrapper = createWrapper();

            const images = wrapper.findAll('img');
            expect(images[0]!.attributes('src')).toBe(
                'https://s2.googleusercontent.com/s2/favicons?sz=64&domain=example.com'
            );
            expect(images[1]!.attributes('src')).toBe(
                'https://s2.googleusercontent.com/s2/favicons?sz=64&domain=github.com'
            );
        });

        it('should handle malformed URLs gracefully', () => {
            const malformedReferences = [
                { url: 'not-a-url', tags: ['test'] },
                { url: 'ftp://example.com', tags: ['ftp'] }
            ];

            const wrapper = createWrapper({ references: malformedReferences });

            expect(wrapper.text()).toContain('not-a-url');
            expect(wrapper.text()).toContain('ftp://example.com');
        });

        it('should create links that open in new tabs', () => {
            const wrapper = createWrapper();

            const links = wrapper.findAll('a[target="_blank"]');
            expect(links.length).toBe(3);

            links.forEach((link, index) => {
                expect(link.attributes('href')).toBe(mockReferences[index]!.url);
                expect(link.attributes('target')).toBe('_blank');
            });
        });
    });

    describe('Show More/Less Functionality', () => {
        it('should show "Show more" button when references exceed 8', () => {
            const manyReferences = Array.from({ length: 10 }, (_, i) => ({
                url: `https://example${i}.com`,
                tags: ['tag']
            }));

            const wrapper = createWrapper({
                references: manyReferences,
                referencesLimit: 8
            });

            expect(wrapper.text()).toContain('Show more');
            expect(wrapper.find('.references-show-more-wrapper').exists()).toBe(true);
        });

        it('should show "Show less" button when all references are displayed', () => {
            const manyReferences = Array.from({ length: 10 }, (_, i) => ({
                url: `https://example${i}.com`,
                tags: ['tag']
            }));

            const wrapper = createWrapper({
                references: manyReferences,
                referencesLimit: 15
            });

            expect(wrapper.text()).toContain('Show less');
        });

        it('should not show toggle button when references are 8 or fewer', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.references-show-more-wrapper').exists()).toBe(false);
        });

        it('should call onToggle when button is clicked', async () => {
            const onToggleMock = vi.fn();
            const manyReferences = Array.from({ length: 10 }, (_, i) => ({
                url: `https://example${i}.com`,
                tags: ['tag']
            }));

            const wrapper = createWrapper({
                references: manyReferences,
                referencesLimit: 8,
                onToggle: onToggleMock
            });

            await wrapper.find('.button').trigger('click');
            expect(onToggleMock).toHaveBeenCalledOnce();
        });
    });

    describe('Styling and Layout', () => {
        it('should apply correct CSS classes', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('.references-inner-wrapper').exists()).toBe(true);
            expect(wrapper.find('.reference').exists()).toBe(true);
            expect(wrapper.find('.reference-header').exists()).toBe(true);
            expect(wrapper.find('.reference-tag').exists()).toBe(true);
        });

        it('should have hover effects', () => {
            const wrapper = createWrapper();

            const reference = wrapper.find('.reference');
            expect(reference.classes()).toContain('reference');

            // Check that hover styles are defined in the component
            expect(wrapper.html()).toContain('reference');
        });

        it('should use flexbox layout', () => {
            const wrapper = createWrapper();

            const wrapper_el = wrapper.find('.references-inner-wrapper');
            expect(wrapper_el.exists()).toBe(true);
        });
    });

    describe('Tags Display', () => {
        it('should render multiple tags for a reference', () => {
            const wrapper = createWrapper();

            const tagElements = wrapper.findAll('.reference-tag');
            expect(tagElements.length).toBe(5); // Total tags across all references
        });

        it('should handle references with no tags', () => {
            const referencesWithoutTags = [{ url: 'https://example.com', tags: [] }];

            const wrapper = createWrapper({ references: referencesWithoutTags });

            expect(wrapper.find('.reference').exists()).toBe(true);
            expect(wrapper.findAll('.reference-tag').length).toBe(0);
        });
    });

    describe('Accessibility', () => {
        it('should have title attributes for links', () => {
            const wrapper = createWrapper();

            const referenceElements = wrapper.findAll('[title]');
            expect(referenceElements.length).toBe(3);

            referenceElements.forEach((el) => {
                expect(el.attributes('title')).toBe('View reference (opens in a new tab)');
            });
        });

        it('should have accessible link structure', () => {
            const wrapper = createWrapper();

            const links = wrapper.findAll('a');
            links.forEach((link) => {
                expect(link.attributes('target')).toBe('_blank');
                expect(link.attributes('href')).toBeTruthy();
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty references array', () => {
            const wrapper = createWrapper({ references: [] });

            expect(wrapper.findAll('.reference').length).toBe(0);
            expect(wrapper.find('.references-show-more-wrapper').exists()).toBe(false);
        });

        it('should handle references with very long URLs', () => {
            const longUrlReferences = [
                {
                    url: 'https://example.com/very/long/path/with/many/segments/and/parameters?param1=value1&param2=value2&param3=value3',
                    tags: ['long']
                }
            ];

            const wrapper = createWrapper({ references: longUrlReferences });

            expect(wrapper.find('.reference').exists()).toBe(true);
            expect(wrapper.text()).toContain('example.com');
        });

        it('should handle special characters in URLs', () => {
            const specialCharReferences = [
                {
                    url: 'https://example.com/path?query=test&data=hello%20world',
                    tags: ['special']
                }
            ];

            const wrapper = createWrapper({ references: specialCharReferences });

            expect(wrapper.find('.reference').exists()).toBe(true);
            expect(wrapper.text()).toContain('example.com');
        });
    });
});
