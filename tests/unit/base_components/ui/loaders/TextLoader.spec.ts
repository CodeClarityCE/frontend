import TextLoader from '@/base_components/ui/loaders/TextLoader.vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

describe('TextLoader', () => {
  describe('Component Rendering', () => {
    it('renders successfully', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.exists()).toBe(true)
    })

    it('renders as a div element', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.element.tagName).toBe('DIV')
    })

    it('applies default CSS classes', () => {
      const wrapper = mount(TextLoader)
      
      const classes = wrapper.classes()
      expect(classes).toContain('skeleton')
      expect(classes).toContain('skeleton-text')
    })

    it('does not apply skeleton-static class by default', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.classes()).not.toContain('skeleton-static')
    })
  })

  describe('Static Prop Handling', () => {
    it('applies skeleton-static class when static is true', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: true
        }
      })
      
      const classes = wrapper.classes()
      expect(classes).toContain('skeleton')
      expect(classes).toContain('skeleton-text')
      expect(classes).toContain('skeleton-static')
    })

    it('does not apply skeleton-static class when static is false', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: false
        }
      })
      
      const classes = wrapper.classes()
      expect(classes).toContain('skeleton')
      expect(classes).toContain('skeleton-text')
      expect(classes).not.toContain('skeleton-static')
    })

    it('does not apply skeleton-static class when static is undefined', () => {
      const wrapper = mount(TextLoader)
      
      const classes = wrapper.classes()
      expect(classes).toContain('skeleton')
      expect(classes).toContain('skeleton-text')
      expect(classes).not.toContain('skeleton-static')
    })

    it('handles static prop with explicit true value', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: true
        }
      })
      
      expect(wrapper.classes()).toContain('skeleton-static')
    })

    it('handles static prop with explicit false value', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: false
        }
      })
      
      expect(wrapper.classes()).not.toContain('skeleton-static')
    })
  })

  describe('CSS Classes Validation', () => {
    it('always applies skeleton class', () => {
      const wrapper1 = mount(TextLoader)
      const wrapper2 = mount(TextLoader, { props: { static: true } })
      const wrapper3 = mount(TextLoader, { props: { static: false } })
      
      expect(wrapper1.classes()).toContain('skeleton')
      expect(wrapper2.classes()).toContain('skeleton')
      expect(wrapper3.classes()).toContain('skeleton')
    })

    it('always applies skeleton-text class', () => {
      const wrapper1 = mount(TextLoader)
      const wrapper2 = mount(TextLoader, { props: { static: true } })
      const wrapper3 = mount(TextLoader, { props: { static: false } })
      
      expect(wrapper1.classes()).toContain('skeleton-text')
      expect(wrapper2.classes()).toContain('skeleton-text')
      expect(wrapper3.classes()).toContain('skeleton-text')
    })

    it('conditionally applies skeleton-static class', () => {
      const animatedWrapper = mount(TextLoader)
      const staticWrapper = mount(TextLoader, { props: { static: true } })
      
      expect(animatedWrapper.classes()).not.toContain('skeleton-static')
      expect(staticWrapper.classes()).toContain('skeleton-static')
    })
  })

  describe('Component Structure', () => {
    it('has single root element', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.element.children.length).toBe(0)
    })

    it('does not contain any text content', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.text()).toBe('')
    })

    it('does not contain child elements', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.element.children.length).toBe(0)
    })

    it('has no slot content', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.element.innerHTML).toBe('')
    })
  })

  describe('Animation States', () => {
    it('enables animation by default (no skeleton-static class)', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.classes()).toContain('skeleton')
      expect(wrapper.classes()).not.toContain('skeleton-static')
    })

    it('disables animation when static is true', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: true
        }
      })
      
      expect(wrapper.classes()).toContain('skeleton')
      expect(wrapper.classes()).toContain('skeleton-static')
    })

    it('maintains skeleton class for both animated and static states', () => {
      const animatedWrapper = mount(TextLoader)
      const staticWrapper = mount(TextLoader, { props: { static: true } })
      
      expect(animatedWrapper.classes()).toContain('skeleton')
      expect(staticWrapper.classes()).toContain('skeleton')
    })
  })

  describe('Styling and Layout', () => {
    it('applies skeleton-text styling class', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.classes()).toContain('skeleton-text')
    })

    it('provides consistent text-like appearance', () => {
      const wrapper = mount(TextLoader)
      
      // Should have appropriate classes for text-like skeleton
      expect(wrapper.classes()).toContain('skeleton-text')
    })
  })

  describe('Prop Edge Cases', () => {
    it('handles truthy values for static prop', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: true
        }
      })
      
      expect(wrapper.classes()).toContain('skeleton-static')
    })

    it('handles falsy values for static prop', () => {
      const wrapper1 = mount(TextLoader, { props: { static: false } })
      const wrapper2 = mount(TextLoader, { props: { static: undefined } })
      const wrapper3 = mount(TextLoader)
      
      expect(wrapper1.classes()).not.toContain('skeleton-static')
      expect(wrapper2.classes()).not.toContain('skeleton-static')
      expect(wrapper3.classes()).not.toContain('skeleton-static')
    })
  })

  describe('Class Combinations', () => {
    it('has correct class combination for animated state', () => {
      const wrapper = mount(TextLoader)
      
      const classes = wrapper.classes()
      expect(classes).toContain('skeleton')
      expect(classes).toContain('skeleton-text')
      expect(classes).not.toContain('skeleton-static')
      expect(classes).toHaveLength(2)
    })

    it('has correct class combination for static state', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: true
        }
      })
      
      const classes = wrapper.classes()
      expect(classes).toContain('skeleton')
      expect(classes).toContain('skeleton-text')
      expect(classes).toContain('skeleton-static')
      expect(classes).toHaveLength(3)
    })
  })

  describe('Component Props Interface', () => {
    it('accepts static prop as boolean', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: true
        }
      })
      
      expect(wrapper.props('static')).toBe(true)
    })

    it('handles missing static prop', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.props('static')).toBe(false)
    })
  })

  describe('Loading State Indication', () => {
    it('provides visual loading indication through skeleton class', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.classes()).toContain('skeleton')
    })

    it('provides text-specific loading appearance', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.classes()).toContain('skeleton-text')
    })

    it('allows for static placeholder appearance', () => {
      const wrapper = mount(TextLoader, {
        props: {
          static: true
        }
      })
      
      expect(wrapper.classes()).toContain('skeleton-static')
    })
  })

  describe('Accessibility', () => {
    it('maintains visual consistency as loading placeholder', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.classes()).toContain('skeleton')
      expect(wrapper.classes()).toContain('skeleton-text')
    })

    it('provides appropriate placeholder for text content', () => {
      const wrapper = mount(TextLoader)
      
      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.classes()).toContain('skeleton-text')
    })
  })

  describe('Conditional Rendering Logic', () => {
    it('applies static class only when explicitly true', () => {
      const testCases = [
        { props: undefined, expectStatic: false },
        { props: {}, expectStatic: false },
        { props: { static: false }, expectStatic: false },
        { props: { static: true } as any, expectStatic: true }
      ]

      testCases.forEach(({ props, expectStatic }) => {
        const wrapper = mount(TextLoader, { props })

        if (expectStatic) {
          expect(wrapper.classes()).toContain('skeleton-static')
        } else {
          expect(wrapper.classes()).not.toContain('skeleton-static')
        }
      })
    })
  })
})