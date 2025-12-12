import CenteredModal from '@/base_components/ui/modals/CenteredModal.vue';
import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';

describe('CenteredModal', () => {
    describe('Basic Rendering', () => {
        it('renders without showing modal by default', () => {
            const wrapper = mount(CenteredModal);
            
            expect(wrapper.find('.fixed').exists()).toBe(false);
        });

        it('shows modal when show method is called', async () => {
            const wrapper = mount(CenteredModal);
            
            wrapper.vm.show();
            await nextTick();
            
            expect(wrapper.find('.fixed').exists()).toBe(true);
        });

        it('hides modal when hide method is called', async () => {
            const wrapper = mount(CenteredModal);
            
            wrapper.vm.show();
            await nextTick();
            expect(wrapper.find('.fixed').exists()).toBe(true);
            
            wrapper.vm.hide();
            await nextTick();
            expect(wrapper.find('.fixed').exists()).toBe(false);
        });
    });

    describe('Modal Controls', () => {
        it('toggles modal visibility with toggle method', async () => {
            const wrapper = mount(CenteredModal);
            
            // Initially hidden
            expect(wrapper.find('.fixed').exists()).toBe(false);
            
            // Toggle to show
            wrapper.vm.toggle();
            await nextTick();
            expect(wrapper.find('.fixed').exists()).toBe(true);
            
            // Toggle to hide
            wrapper.vm.toggle();
            await nextTick();
            expect(wrapper.find('.fixed').exists()).toBe(false);
        });

        it('exposes show, hide, and toggle methods', () => {
            const wrapper = mount(CenteredModal);
            
            expect(typeof wrapper.vm.show).toBe('function');
            expect(typeof wrapper.vm.hide).toBe('function');
            expect(typeof wrapper.vm.toggle).toBe('function');
        });
    });

    describe('Slot Content', () => {
        it('renders title slot content', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: '<h2>Modal Title</h2>'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            expect(wrapper.find('h2').text()).toBe('Modal Title');
        });

        it('renders subtitle slot when provided', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Title',
                    subtitle: '<p>Modal subtitle</p>'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            expect(wrapper.find('p').text()).toBe('Modal subtitle');
        });

        it('does not render subtitle section when subtitle slot is empty', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Title Only'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            // Should not have subtitle div when no subtitle slot
            const subtitleDiv = wrapper.find('.px-5.py-2.font-normal.text-gray-600');
            expect(subtitleDiv.exists()).toBe(false);
        });

        it('renders content slot', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Title',
                    content: '<div>Modal content here</div>'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            expect(wrapper.find('.p-5 div').text()).toBe('Modal content here');
        });

        it('renders buttons slot', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Title',
                    buttons: '<button>OK</button><button>Cancel</button>'
                }
            });

            wrapper.vm.show();
            await nextTick();

            const buttons = wrapper.findAll('button');
            expect(buttons).toHaveLength(2);
            expect(buttons[0]!.text()).toBe('OK');
            expect(buttons[1]!.text()).toBe('Cancel');
        });

        it('renders all slots together', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: '<span class="modal-title">Full Modal</span>',
                    subtitle: '<em class="modal-subtitle">With all sections</em>',
                    content: '<div class="modal-content">Complete content</div>',
                    buttons: '<button class="modal-button">Submit</button>'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            expect(wrapper.find('.modal-title').text()).toBe('Full Modal');
            expect(wrapper.find('.modal-subtitle').text()).toBe('With all sections');
            expect(wrapper.find('.modal-content').text()).toBe('Complete content');
            expect(wrapper.find('.modal-button').text()).toBe('Submit');
        });
    });

    describe('Modal Styling and Layout', () => {
        it('applies correct backdrop styling', async () => {
            const wrapper = mount(CenteredModal);
            
            wrapper.vm.show();
            await nextTick();
            
            const backdrop = wrapper.find('.fixed');
            expect(backdrop.classes()).toContain('top-0');
            expect(backdrop.classes()).toContain('left-0');
            expect(backdrop.classes()).toContain('z-50');
            expect(backdrop.classes()).toContain('w-full');
            expect(backdrop.classes()).toContain('h-full');
            expect(backdrop.classes()).toContain('bg-black');
            expect(backdrop.classes()).toContain('bg-opacity-5');
            expect(backdrop.classes()).toContain('justify-center');
            expect(backdrop.classes()).toContain('items-center');
        });

        it('applies correct modal content styling', async () => {
            const wrapper = mount(CenteredModal);
            
            wrapper.vm.show();
            await nextTick();
            
            const modalContent = wrapper.find('.w-fit');
            expect(modalContent.classes()).toContain('bg-white');
            expect(modalContent.classes()).toContain('shadow-md');
            expect(modalContent.classes()).toContain('rounded-lg');
        });

        it('applies correct title styling', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Test Title'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            const titleSection = wrapper.find('.rounded.p-5.pb-0');
            expect(titleSection.classes()).toContain('font-semibold');
            expect(titleSection.classes()).toContain('text-gray-600');
            expect(titleSection.classes()).toContain('text-lg');
        });

        it('includes divider between header and content', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Title'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            const divider = wrapper.find('.h-px.bg-gray-200');
            expect(divider.exists()).toBe(true);
        });

        it('applies correct button section styling', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Title',
                    buttons: '<button>Test</button>'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            const buttonSection = wrapper.find('.flex.flex-row.justify-end');
            expect(buttonSection.classes()).toContain('border-t');
            expect(buttonSection.classes()).toContain('border-gray-400');
            expect(buttonSection.classes()).toContain('gap-2');
        });
    });

    describe('Transition Behavior', () => {
        it('wraps modal in transition component', async () => {
            const wrapper = mount(CenteredModal);
            
            // Transition component should be present
            expect(wrapper.findComponent({ name: 'Transition' }).exists()).toBe(true);
        });

        it('shows and hides content based on show_modal reactive value', async () => {
            const wrapper = mount(CenteredModal);
            
            // Initially hidden
            expect(wrapper.find('.fixed').exists()).toBe(false);
            
            // Show modal
            wrapper.vm.show();
            await nextTick();
            expect(wrapper.find('.fixed').exists()).toBe(true);
            
            // Hide modal
            wrapper.vm.hide();
            await nextTick();
            expect(wrapper.find('.fixed').exists()).toBe(false);
        });
    });

    describe('Accessibility and UX', () => {
        it('centers modal content in viewport', async () => {
            const wrapper = mount(CenteredModal);
            
            wrapper.vm.show();
            await nextTick();
            
            const backdrop = wrapper.find('.fixed');
            expect(backdrop.classes()).toContain('justify-center');
            expect(backdrop.classes()).toContain('items-center');
        });

        it('provides adequate z-index for overlay', async () => {
            const wrapper = mount(CenteredModal);
            
            wrapper.vm.show();
            await nextTick();
            
            expect(wrapper.find('.fixed').classes()).toContain('z-50');
        });

        it('maintains proper content hierarchy', async () => {
            const wrapper = mount(CenteredModal, {
                slots: {
                    title: 'Modal Title',
                    subtitle: 'Modal Subtitle',
                    content: 'Modal Content',
                    buttons: '<button>Action</button>'
                }
            });
            
            wrapper.vm.show();
            await nextTick();
            
            const modal = wrapper.find('.w-fit');
            
            // Verify order of elements within modal
            const children = modal.element.children;
            expect(children[0]).toMatchObject({ className: expect.stringContaining('rounded p-5 pb-0') }); // title
            expect(children[1]).toMatchObject({ className: expect.stringContaining('px-5 py-2') }); // subtitle
            expect(children[2]).toMatchObject({ className: expect.stringContaining('h-px bg-gray-200') }); // divider
            expect(children[3]).toMatchObject({ className: expect.stringContaining('p-5') }); // content
            expect(children[4]).toMatchObject({ className: expect.stringContaining('flex flex-row') }); // buttons
        });
    });
});