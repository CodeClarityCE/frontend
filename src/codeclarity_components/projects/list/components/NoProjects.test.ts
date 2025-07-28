import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NoProjects from './NoProjects.vue';

// Mock RouterLink
const MockRouterLink = {
    name: 'RouterLink',
    template: '<a><slot></slot></a>',
    props: ['to']
};

// Mock Button component
vi.mock('@/shadcn/ui/button/Button.vue', () => ({
    default: {
        name: 'Button',
        template: '<button><slot></slot></button>'
    }
}));

describe('NoProjects', () => {
    let wrapper: any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it('renders correctly', () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.flex.flex-col.gap-8').exists()).toBe(true);
    });

    it('displays no projects message', () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        expect(wrapper.text()).toContain('No Projects yet');
    });

    it('displays add project button', () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const button = wrapper.findComponent({ name: 'Button' });
        expect(button.exists()).toBe(true);
        expect(button.text()).toContain('Add a project');
    });

    it('has correct router link configuration', () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const routerLink = wrapper.findComponent({ name: 'RouterLink' });
        expect(routerLink.exists()).toBe(true);
        expect(routerLink.props().to).toEqual({
            name: 'projects',
            params: { page: 'add' }
        });
    });

    it('has correct styling classes', () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const container = wrapper.find('.flex.flex-col.gap-8');
        expect(container.exists()).toBe(true);

        const innerContainer = wrapper.find('.flex.flex-col.gap-5.items-center.justify-center');
        expect(innerContainer.exists()).toBe(true);
    });

    it('has correct inline styles', () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const innerContainer = wrapper.find('.flex.flex-col.gap-5.items-center.justify-center');
        expect(innerContainer.attributes('style')).toContain('padding-top: 3rem');
        expect(innerContainer.attributes('style')).toContain('padding-bottom: 3rem');
    });

    it('button is clickable', async () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        const button = wrapper.findComponent({ name: 'Button' });
        expect(button.exists()).toBe(true);

        // The button should be clickable (no disabled state)
        await button.trigger('click');
        expect(button.exists()).toBe(true);
    });

    it('maintains component structure', () => {
        wrapper = mount(NoProjects, {
            global: {
                components: {
                    RouterLink: MockRouterLink
                }
            }
        });

        // Check for the main container structure
        expect(wrapper.find('.flex.flex-col.gap-8').exists()).toBe(true);

        // Check for the centered content
        expect(wrapper.find('.flex.flex-col.gap-5.items-center.justify-center').exists()).toBe(
            true
        );

        // Check for the button wrapper
        expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true);
    });
});
