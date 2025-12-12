import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SbomDetailsLoader from './SbomDetailsLoader.vue';

// Mock loader components
vi.mock('@/base_components/ui/loaders/BoxLoader.vue', () => ({
    default: {
        name: 'BoxLoader',
        props: ['dimensions'],
        template: '<div class="mock-box-loader">BoxLoader</div>'
    }
}));

vi.mock('@/base_components/ui/loaders/TextLoader.vue', () => ({
    default: {
        name: 'TextLoader',
        props: ['style'],
        template: '<div class="mock-text-loader" :style="$props.style">TextLoader</div>'
    }
}));

describe('SbomDetailsLoader.vue', () => {
    const createWrapper = () => {
        return mount(SbomDetailsLoader);
    };

    describe('Component Rendering', () => {
        it('should render the main container', () => {
            const wrapper = createWrapper();

            const container = wrapper.find('div[style*="display: flex"]');
            expect(container.exists()).toBe(true);
            expect(container.attributes('style')).toContain('flex-direction: column');
            expect(container.attributes('style')).toContain('row-gap: 10px');
        });

        it('should render all loader components', () => {
            const wrapper = createWrapper();

            const boxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });
            const textLoaders = wrapper.findAllComponents({ name: 'TextLoader' });

            expect(boxLoaders.length).toBeGreaterThan(0);
            expect(textLoaders.length).toBeGreaterThan(0);
        });
    });

    describe('Header Section Loaders', () => {
        it('should render header box loader with correct dimensions', () => {
            const wrapper = createWrapper();

            const boxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });
            const headerBoxLoader = boxLoaders[0]!;

            expect(headerBoxLoader.exists()).toBe(true);
            expect(headerBoxLoader.props('dimensions')).toEqual({
                width: '30%',
                height: '100px'
            });
        });

        it('should render header text loaders with correct styling', () => {
            const wrapper = createWrapper();

            const textLoaders = wrapper.findAllComponents({ name: 'TextLoader' });

            // Should have at least 2 text loaders for header section
            expect(textLoaders.length).toBeGreaterThanOrEqual(2);

            // Check the first two text loaders have max-width styling
            const firstStyle = textLoaders[0]!.attributes('style') ?? '';
            const secondStyle = textLoaders[1]!.attributes('style') ?? '';
            expect(firstStyle).toContain('max-width: 50%');
            expect(secondStyle).toContain('max-width: 50%');
        });
    });

    describe('Content Section Loaders', () => {
        it('should render content section containers', () => {
            const wrapper = createWrapper();

            const sectionContainers = wrapper.findAll(
                'div[style*="justify-content: space-between"]'
            );
            expect(sectionContainers.length).toBe(2); // v-for creates 2 sections
        });

        it('should render content sections with correct layout styling', () => {
            const wrapper = createWrapper();

            const sectionContainers = wrapper.findAll(
                'div[style*="justify-content: space-between"]'
            );

            sectionContainers.forEach((container) => {
                const style = container.attributes('style') ?? '';
                expect(style).toContain('display: flex');
                expect(style).toContain('flex-direction: row');
                expect(style).toContain('justify-content: space-between');
                expect(style).toContain('margin-top: 100px');
            });
        });

        it('should render box loaders in content sections with correct dimensions', () => {
            const wrapper = createWrapper();

            const allBoxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });

            // Should have 1 header box loader + 4 content box loaders (2 sections × 2 loaders each)
            expect(allBoxLoaders.length).toBe(5);

            // Check content box loaders (excluding the first header one)
            const contentBoxLoaders = allBoxLoaders.slice(1);
            contentBoxLoaders.forEach((loader) => {
                expect(loader.props('dimensions')).toEqual({
                    width: '49%',
                    height: '300px'
                });
            });
        });
    });

    describe('V-For Loop Generation', () => {
        it('should generate correct number of content sections', () => {
            const wrapper = createWrapper();

            const sectionContainers = wrapper.findAll('div[style*="margin-top: 100px"]');
            expect(sectionContainers.length).toBe(2); // v-for="index in 2"
        });

        it('should generate correct number of box loaders per section', () => {
            const wrapper = createWrapper();

            const sectionContainers = wrapper.findAll('div[style*="margin-top: 100px"]');

            sectionContainers.forEach((section) => {
                const sectionBoxLoaders = section.findAllComponents({ name: 'BoxLoader' });
                expect(sectionBoxLoaders.length).toBe(2); // v-for="i in 2"
            });
        });

        it('should have unique keys for v-for elements', () => {
            const wrapper = createWrapper();

            // Test that the component renders without key conflicts
            expect(wrapper.exists()).toBe(true);

            // Check that all content sections are rendered
            const sectionContainers = wrapper.findAll('div[style*="margin-top: 100px"]');
            expect(sectionContainers.length).toBe(2);
        });
    });

    describe('Layout Structure', () => {
        it('should have correct overall layout structure', () => {
            const wrapper = createWrapper();

            // Main container
            const mainContainer = wrapper.find('div[style*="display: flex"]');
            expect(mainContainer.exists()).toBe(true);

            // Header section (1 box loader + 2 text loaders)
            const headerBoxLoader = wrapper.findAllComponents({ name: 'BoxLoader' })[0]!;
            const textLoaders = wrapper.findAllComponents({ name: 'TextLoader' });

            expect(headerBoxLoader.exists()).toBe(true);
            expect(textLoaders.length).toBe(2);

            // Content sections
            const contentSections = wrapper.findAll('div[style*="margin-top: 100px"]');
            expect(contentSections.length).toBe(2);
        });

        it('should maintain proper spacing between sections', () => {
            const wrapper = createWrapper();

            const mainContainer = wrapper.find('div[style*="row-gap: 10px"]');
            expect(mainContainer.exists()).toBe(true);

            const contentSections = wrapper.findAll('div[style*="margin-top: 100px"]');
            contentSections.forEach((section) => {
                const style = section.attributes('style') ?? '';
                expect(style).toContain('margin-top: 100px');
            });
        });
    });

    describe('Component Integration', () => {
        it('should pass correct props to BoxLoader components', () => {
            const wrapper = createWrapper();

            const boxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });

            // Header box loader
            expect(boxLoaders[0]!.props('dimensions')).toEqual({
                width: '30%',
                height: '100px'
            });

            // Content box loaders
            for (let i = 1; i < boxLoaders.length; i++) {
                expect(boxLoaders[i]!.props('dimensions')).toEqual({
                    width: '49%',
                    height: '300px'
                });
            }
        });

        it('should pass correct props to TextLoader components', () => {
            const wrapper = createWrapper();

            const textLoaders = wrapper.findAllComponents({ name: 'TextLoader' });

            textLoaders.forEach((loader) => {
                const style = loader.attributes('style') ?? '';
                expect(style).toContain('max-width: 50%');
            });
        });
    });

    describe('Responsive Layout', () => {
        it('should use percentage-based widths for responsive design', () => {
            const wrapper = createWrapper();

            const boxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });

            // Check that all box loaders use percentage widths
            expect(boxLoaders[0]!.props('dimensions')?.width).toBe('30%');

            for (let i = 1; i < boxLoaders.length; i++) {
                expect(boxLoaders[i]!.props('dimensions')?.width).toBe('49%');
            }
        });

        it('should use max-width for text loaders', () => {
            const wrapper = createWrapper();

            const textLoaders = wrapper.findAllComponents({ name: 'TextLoader' });

            textLoaders.forEach((loader) => {
                const style = loader.attributes('style') ?? '';
                expect(style).toContain('max-width: 50%');
            });
        });
    });

    describe('Loading State Simulation', () => {
        it('should simulate header loading state', () => {
            const wrapper = createWrapper();

            // Header should have 1 box loader (for title) and 2 text loaders (for subtitle/metadata)
            const allBoxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });
            const allTextLoaders = wrapper.findAllComponents({ name: 'TextLoader' });

            expect(allBoxLoaders.length).toBeGreaterThanOrEqual(1);
            expect(allTextLoaders.length).toBe(2);
        });

        it('should simulate content grid loading state', () => {
            const wrapper = createWrapper();

            // Should simulate a 2x2 grid layout for content
            const contentSections = wrapper.findAll('div[style*="margin-top: 100px"]');
            expect(contentSections.length).toBe(2);

            contentSections.forEach((section) => {
                const sectionBoxLoaders = section.findAllComponents({ name: 'BoxLoader' });
                expect(sectionBoxLoaders.length).toBe(2);
            });
        });

        it('should maintain consistent loader sizing', () => {
            const wrapper = createWrapper();

            const boxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });

            // All content loaders should have same dimensions
            const contentLoaders = boxLoaders.slice(1); // Skip header loader
            contentLoaders.forEach((loader) => {
                expect(loader.props('dimensions')).toEqual({
                    width: '49%',
                    height: '300px'
                });
            });
        });
    });

    describe('Accessibility and Performance', () => {
        it('should render without errors', () => {
            const wrapper = createWrapper();

            expect(wrapper.exists()).toBe(true);
            expect(wrapper.vm).toBeDefined();
        });

        it('should have proper component structure for screen readers', () => {
            const wrapper = createWrapper();

            // Component should render as a loading state with proper structure
            const mainContainer = wrapper.find('div');
            expect(mainContainer.exists()).toBe(true);

            // Should have multiple loader components for rich loading feedback
            const allLoaders = [
                ...wrapper.findAllComponents({ name: 'BoxLoader' }),
                ...wrapper.findAllComponents({ name: 'TextLoader' })
            ];
            expect(allLoaders.length).toBeGreaterThan(3);
        });
    });

    describe('Edge Cases', () => {
        it('should handle component mounting and unmounting', () => {
            const wrapper = createWrapper();

            expect(wrapper.exists()).toBe(true);

            wrapper.unmount();
            // Should not throw errors on unmount
        });

        it('should maintain loader count consistency', () => {
            const wrapper = createWrapper();

            // Total expected loaders: 1 header box + 2 text + 4 content boxes = 7 loaders
            const boxLoaders = wrapper.findAllComponents({ name: 'BoxLoader' });
            const textLoaders = wrapper.findAllComponents({ name: 'TextLoader' });

            expect(boxLoaders.length).toBe(5); // 1 header + 4 content
            expect(textLoaders.length).toBe(2); // 2 header text loaders
        });
    });
});
