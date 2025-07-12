import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';

// Mock shadcn/ui card components
vi.mock('@/shadcn/ui/card', () => ({
    Card: {
        name: 'Card',
        template: '<div class="card" :class="$attrs.class"><slot /></div>'
    },
    CardHeader: {
        name: 'CardHeader',
        template: '<div class="card-header"><slot /></div>'
    },
    CardTitle: {
        name: 'CardTitle',
        template: '<h3 class="card-title" :class="$attrs.class"><slot /></h3>'
    },
    CardDescription: {
        name: 'CardDescription',
        template: '<p class="card-description" :class="$attrs.class"><slot /></p>'
    },
    CardContent: {
        name: 'CardContent',
        template: '<div class="card-content"><slot /></div>'
    }
}));

// Mock @iconify/vue
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        props: ['icon'],
        template: '<span class="iconify-icon" :data-icon="icon"></span>'
    }
}));

describe('InfoCard', () => {
    describe('Basic Rendering', () => {
        it('renders with required props', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Test Card',
                    icon: 'mdi:home'
                }
            });

            expect(wrapper.find('.card').exists()).toBe(true);
            expect(wrapper.find('.card-title').text()).toBe('Test Card');
            expect(wrapper.find('[data-icon="mdi:home"]').exists()).toBe(true);
        });

        it('renders with title and description', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Main Title',
                    description: 'Card description',
                    icon: 'mdi:info'
                }
            });

            expect(wrapper.find('.card-title').text()).toBe('Main Title');
            expect(wrapper.find('.card-description').text()).toBe('Card description');
        });

        it('renders without description when not provided', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Title Only',
                    icon: 'mdi:check'
                }
            });

            expect(wrapper.find('.card-title').text()).toBe('Title Only');
            expect(wrapper.find('.card-description').exists()).toBe(false);
        });
    });

    describe('Variant Styling', () => {
        it('applies default variant styling', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Default Card',
                    icon: 'mdi:home'
                }
            });

            expect(wrapper.find('.card').classes()).toContain('border-l-theme-black');
        });

        it('applies primary variant styling', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Primary Card',
                    icon: 'mdi:star',
                    variant: 'primary'
                }
            });

            expect(wrapper.find('.card').classes()).toContain('border-l-theme-primary');
        });

        it('applies danger variant styling', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Danger Card',
                    icon: 'mdi:alert',
                    variant: 'danger'
                }
            });

            expect(wrapper.find('.card').classes()).toContain('border-l-red-500');
        });

        it('applies success variant styling', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Success Card',
                    icon: 'mdi:check',
                    variant: 'success'
                }
            });

            expect(wrapper.find('.card').classes()).toContain('border-l-theme-primary');
        });

        it('applies warning variant styling', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Warning Card',
                    icon: 'mdi:warning',
                    variant: 'warning'
                }
            });

            expect(wrapper.find('.card').classes()).toContain('border-l-yellow-500');
        });
    });

    describe('Icon Display', () => {
        it('displays the correct icon', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Icon Test',
                    icon: 'mdi:settings'
                }
            });

            const icon = wrapper.find('[data-icon="mdi:settings"]');
            expect(icon.exists()).toBe(true);
        });

        it('applies icon styling classes', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Icon Style Test',
                    icon: 'mdi:user'
                }
            });

            const iconElement = wrapper.find('.iconify-icon');
            expect(iconElement.exists()).toBe(true);
        });
    });

    describe('Slot Functionality', () => {
        it('renders default slot content when provided', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Card with Content',
                    icon: 'mdi:content-copy'
                },
                slots: {
                    default: '<p>This is card content</p>'
                }
            });

            expect(wrapper.find('.card-content').exists()).toBe(true);
            expect(wrapper.find('.card-content p').text()).toBe('This is card content');
        });

        it('does not render content section when no default slot provided', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Card without Content',
                    icon: 'mdi:empty'
                }
            });

            expect(wrapper.find('.card-content').exists()).toBe(false);
        });

        it('renders actions slot content when provided', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Card with Actions',
                    icon: 'mdi:cog'
                },
                slots: {
                    actions: '<button>Action Button</button>'
                }
            });

            expect(wrapper.find('button').text()).toBe('Action Button');
        });

        it('handles both default and actions slots', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Full Featured Card',
                    icon: 'mdi:star',
                    description: 'With description'
                },
                slots: {
                    default: '<div class="main-content">Main content here</div>',
                    actions: '<span class="actions-slot">Actions here</span>'
                }
            });

            expect(wrapper.find('.card-content .main-content').text()).toBe('Main content here');
            expect(wrapper.find('.actions-slot').text()).toBe('Actions here');
        });
    });

    describe('Accessibility', () => {
        it('maintains proper heading structure', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Accessible Card',
                    icon: 'mdi:accessibility'
                }
            });

            const title = wrapper.find('.card-title');
            expect(title.element.tagName.toLowerCase()).toBe('h3');
        });

        it('applies semantic text styling classes', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Semantic Card',
                    description: 'Semantic description',
                    icon: 'mdi:semantic'
                }
            });

            expect(wrapper.find('.card-title').classes()).toContain('text-theme-black');
            expect(wrapper.find('.card-description').classes()).toContain('text-theme-gray');
        });
    });

    describe('Component Structure', () => {
        it('maintains expected DOM hierarchy', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Structure Test',
                    description: 'Testing structure',
                    icon: 'mdi:file-tree'
                },
                slots: {
                    default: '<p>Content</p>',
                    actions: '<button>Action</button>'
                }
            });

            // Check overall structure
            const card = wrapper.find('.card');
            expect(card.exists()).toBe(true);
            
            // Check header structure
            const header = card.find('.card-header');
            expect(header.exists()).toBe(true);
            
            // Check content structure
            const content = card.find('.card-content');
            expect(content.exists()).toBe(true);
            
            // Verify icon, title, description, and actions are all present
            expect(wrapper.find('.iconify-icon').exists()).toBe(true);
            expect(wrapper.find('.card-title').exists()).toBe(true);
            expect(wrapper.find('.card-description').exists()).toBe(true);
            expect(wrapper.find('button').exists()).toBe(true);
        });

        it('applies hover and transition effects', () => {
            const wrapper = mount(InfoCard, {
                props: {
                    title: 'Interactive Card',
                    icon: 'mdi:gesture-tap'
                }
            });

            const card = wrapper.find('.card');
            expect(card.classes()).toContain('hover:shadow-md');
            expect(card.classes()).toContain('transition-shadow');
        });
    });

    describe('Props Validation', () => {
        it('handles all valid variant values', () => {
            const variants = ['primary', 'danger', 'success', 'warning', 'default'];
            
            variants.forEach(variant => {
                const wrapper = mount(InfoCard, {
                    props: {
                        title: `${variant} Card`,
                        icon: 'mdi:test',
                        variant: variant as any
                    }
                });
                
                expect(wrapper.find('.card').exists()).toBe(true);
            });
        });

        it('works with different icon formats', () => {
            const icons = ['mdi:home', 'fa:user', 'heroicons:star', 'tabler:settings'];
            
            icons.forEach(icon => {
                const wrapper = mount(InfoCard, {
                    props: {
                        title: 'Icon Test',
                        icon: icon
                    }
                });
                
                expect(wrapper.find(`[data-icon="${icon}"]`).exists()).toBe(true);
            });
        });
    });
});