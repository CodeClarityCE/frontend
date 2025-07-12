import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';

describe('BoxLoader', () => {
    describe('Basic Rendering', () => {
        it('renders with default props', () => {
            const wrapper = mount(BoxLoader);
            
            const loader = wrapper.find('.skeleton');
            expect(loader.exists()).toBe(true);
            expect(loader.classes()).toContain('skeleton-box');
        });

        it('applies default dimensions', () => {
            const wrapper = mount(BoxLoader);
            
            const loader = wrapper.find('.skeleton');
            const style = loader.attributes('style');
            expect(style).toContain('width: 4rem');
            expect(style).toContain('height: 4rem');
        });

        it('renders as animated by default', () => {
            const wrapper = mount(BoxLoader);
            
            const loader = wrapper.find('.skeleton');
            expect(loader.classes()).not.toContain('skeleton-static');
        });
    });

    describe('Custom Dimensions', () => {
        it('accepts custom width and height', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '8rem',
                        height: '6rem'
                    }
                }
            });
            
            const loader = wrapper.find('.skeleton');
            const style = loader.attributes('style');
            expect(style).toContain('width: 8rem');
            expect(style).toContain('height: 6rem');
        });

        it('accepts pixel dimensions', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '120px',
                        height: '80px'
                    }
                }
            });
            
            const loader = wrapper.find('.skeleton');
            const style = loader.attributes('style');
            expect(style).toContain('width: 120px');
            expect(style).toContain('height: 80px');
        });

        it('accepts percentage dimensions', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '100%',
                        height: '50%'
                    }
                }
            });
            
            const loader = wrapper.find('.skeleton');
            const style = loader.attributes('style');
            expect(style).toContain('width: 100%');
            expect(style).toContain('height: 50%');
        });

        it('handles single dimension override', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '10rem'
                        // height should use default
                    }
                }
            });
            
            const loader = wrapper.find('.skeleton');
            const style = loader.attributes('style');
            expect(style).toContain('width: 10rem');
        });
    });

    describe('Static Mode', () => {
        it('applies static class when static prop is true', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    static: true
                }
            });
            
            const loader = wrapper.find('.skeleton');
            expect(loader.classes()).toContain('skeleton-static');
        });

        it('does not apply static class when static prop is false', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    static: false
                }
            });
            
            const loader = wrapper.find('.skeleton');
            expect(loader.classes()).not.toContain('skeleton-static');
        });

        it('animates when static is false', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    static: false
                }
            });
            
            const loader = wrapper.find('.skeleton');
            expect(loader.classes()).toContain('skeleton');
            expect(loader.classes()).not.toContain('skeleton-static');
        });
    });

    describe('CSS Classes', () => {
        it('always applies skeleton base class', () => {
            const wrapper = mount(BoxLoader);
            
            expect(wrapper.find('.skeleton').exists()).toBe(true);
        });

        it('always applies skeleton-box class for rounded corners', () => {
            const wrapper = mount(BoxLoader);
            
            expect(wrapper.find('.skeleton-box').exists()).toBe(true);
        });

        it('combines all expected classes', () => {
            const wrapper = mount(BoxLoader);
            
            const loader = wrapper.find('div');
            expect(loader.classes()).toContain('skeleton');
            expect(loader.classes()).toContain('skeleton-box');
        });

        it('combines classes with static mode', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    static: true
                }
            });
            
            const loader = wrapper.find('div');
            expect(loader.classes()).toContain('skeleton');
            expect(loader.classes()).toContain('skeleton-box');
            expect(loader.classes()).toContain('skeleton-static');
        });
    });

    describe('Component Structure', () => {
        it('renders as a single div element', () => {
            const wrapper = mount(BoxLoader);
            
            expect(wrapper.element.tagName.toLowerCase()).toBe('div');
            expect(wrapper.findAll('div')).toHaveLength(1);
        });

        it('has no child elements', () => {
            const wrapper = mount(BoxLoader);
            
            expect(wrapper.element.children).toHaveLength(0);
        });

        it('applies inline styles for dimensions', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '200px',
                        height: '100px'
                    }
                }
            });
            
            expect(wrapper.element.style.width).toBe('200px');
            expect(wrapper.element.style.height).toBe('100px');
        });
    });

    describe('Props Interface', () => {
        it('accepts dimensions object with width and height', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '5rem',
                        height: '3rem'
                    }
                }
            });
            
            expect(wrapper.props('dimensions')).toEqual({
                width: '5rem',
                height: '3rem'
            });
        });

        it('accepts static boolean', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    static: true
                }
            });
            
            expect(wrapper.props('static')).toBe(true);
        });

        it('provides default dimensions when not specified', () => {
            const wrapper = mount(BoxLoader);
            
            // Should apply default dimensions from withDefaults
            const style = wrapper.attributes('style');
            expect(style).toContain('width: 4rem');
            expect(style).toContain('height: 4rem');
        });
    });

    describe('Use Cases', () => {
        it('works as a loading placeholder for images', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '300px',
                        height: '200px'
                    }
                }
            });
            
            const loader = wrapper.find('.skeleton');
            expect(loader.exists()).toBe(true);
            expect(loader.attributes('style')).toContain('width: 300px');
            expect(loader.attributes('style')).toContain('height: 200px');
        });

        it('works as a loading placeholder for cards', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    dimensions: {
                        width: '100%',
                        height: '150px'
                    }
                }
            });
            
            const loader = wrapper.find('.skeleton');
            expect(loader.exists()).toBe(true);
            expect(loader.classes()).toContain('skeleton-box'); // Rounded corners
        });

        it('works as a static placeholder', () => {
            const wrapper = mount(BoxLoader, {
                props: {
                    static: true,
                    dimensions: {
                        width: '2rem',
                        height: '2rem'
                    }
                }
            });
            
            const loader = wrapper.find('.skeleton');
            expect(loader.classes()).toContain('skeleton-static');
        });
    });
});