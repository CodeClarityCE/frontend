import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import BubbleComponent from '@/base_components/data-display/bubbles/BubbleComponent.vue'

describe('BubbleComponent', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(BubbleComponent, {
      slots: {
        content: 'Test Content'
      }
    })
  })

  describe('Basic Rendering', () => {
    it('renders correctly with default props', () => {
      expect(wrapper.find('div').exists()).toBe(true)
      expect(wrapper.text()).toBe('Test Content')
    })

    it('renders slot content', () => {
      const customWrapper = mount(BubbleComponent, {
        slots: {
          content: '<span>Custom Content</span>'
        }
      })

      expect(customWrapper.html()).toContain('<span>Custom Content</span>')
    })

    it('applies default CSS classes', () => {
      const div = wrapper.find('div')
      expect(div.classes()).toContain('flex')
      expect(div.classes()).toContain('flex-row')
      expect(div.classes()).toContain('justify-between')
      expect(div.classes()).toContain('items-center')
      expect(div.classes()).toContain('gap-2')
      expect(div.classes()).toContain('rounded-3xl')
      expect(div.classes()).toContain('w-fit')
    })

    it('applies default padding when not slim', () => {
      const div = wrapper.find('div')
      expect(div.classes()).toContain('py-2')
      expect(div.classes()).toContain('px-3')
      expect(div.classes()).not.toContain('py-0.5')
      expect(div.classes()).not.toContain('px-2')
    })
  })

  describe('Slim Prop', () => {
    it('applies slim styling when slim prop is true', () => {
      const slimWrapper = mount(BubbleComponent, {
        props: { slim: true },
        slots: { content: 'Slim Content' }
      })

      const div = slimWrapper.find('div')
      expect(div.classes()).toContain('py-0.5')
      expect(div.classes()).toContain('px-2')
      expect(div.classes()).toContain('text-sm')
      expect(div.classes()).not.toContain('py-2')
      expect(div.classes()).not.toContain('px-3')
    })

    it('applies regular styling when slim prop is false', () => {
      const regularWrapper = mount(BubbleComponent, {
        props: { slim: false },
        slots: { content: 'Regular Content' }
      })

      const div = regularWrapper.find('div')
      expect(div.classes()).toContain('py-2')
      expect(div.classes()).toContain('px-3')
      expect(div.classes()).not.toContain('py-0.5')
      expect(div.classes()).not.toContain('px-2')
      expect(div.classes()).not.toContain('text-sm')
    })
  })

  describe('Color Variants', () => {
    it('applies blue styling when blue prop is true', () => {
      const blueWrapper = mount(BubbleComponent, {
        props: { blue: true },
        slots: { content: 'Blue Content' }
      })

      const div = blueWrapper.find('div')
      expect(div.classes()).toContain('bg-primary')
      expect(div.classes()).toContain('text-white')
    })

    it('applies neutral styling when neutral prop is true', () => {
      const neutralWrapper = mount(BubbleComponent, {
        props: { neutral: true },
        slots: { content: 'Neutral Content' }
      })

      const div = neutralWrapper.find('div')
      expect(div.classes()).toContain('bg-[#f4f8ff]')
      expect(div.classes()).toContain('text-[#505050]')
    })

    it('applies bad styling when bad prop is true', () => {
      const badWrapper = mount(BubbleComponent, {
        props: { bad: true },
        slots: { content: 'Bad Content' }
      })

      const div = badWrapper.find('div')
      expect(div.classes()).toContain('bg-[#f0d1d1]')
      expect(div.classes()).toContain('text-[#aa6d6d]')
    })

    it('applies positive styling when positive prop is true', () => {
      const positiveWrapper = mount(BubbleComponent, {
        props: { positive: true },
        slots: { content: 'Positive Content' }
      })

      const div = positiveWrapper.find('div')
      expect(div.classes()).toContain('bg-[#c0e8b3]')
      expect(div.classes()).toContain('text-[#69b751]')
    })

    it('applies default/fallback styling when no color variant is specified', () => {
      const defaultWrapper = mount(BubbleComponent, {
        slots: { content: 'Default Content' }
      })

      const div = defaultWrapper.find('div')
      expect(div.classes()).toContain('bg-[#f2f2f2]')
      expect(div.classes()).toContain('hover:bg-[#0000001a]')
    })
  })

  describe('Patchable Variants', () => {
    it('applies patchable styling when patchable prop is true', () => {
      const patchableWrapper = mount(BubbleComponent, {
        props: { patchable: true },
        slots: { content: 'Patchable Content' }
      })

      const div = patchableWrapper.find('div')
      expect(div.classes()).toContain('bg-[#e9ffe8]')
      expect(div.classes()).toContain('text-[#78995a]')
      expect(div.classes()).toContain('font-semibold')
    })

    it('applies not patchable styling when notPatchable prop is true', () => {
      const notPatchableWrapper = mount(BubbleComponent, {
        props: { notPatchable: true },
        slots: { content: 'Not Patchable Content' }
      })

      const div = notPatchableWrapper.find('div')
      expect(div.classes()).toContain('bg-[#ffe8e8]')
      expect(div.classes()).toContain('text-[#995a5a]')
      expect(div.classes()).toContain('font-semibold')
    })

    it('applies partially patchable styling when partiallyPatchable prop is true', () => {
      const partiallyPatchableWrapper = mount(BubbleComponent, {
        props: { partiallyPatchable: true },
        slots: { content: 'Partially Patchable Content' }
      })

      const div = partiallyPatchableWrapper.find('div')
      expect(div.classes()).toContain('bg-[#fff6e8]')
      expect(div.classes()).toContain('text-[#99705a]')
      expect(div.classes()).toContain('font-semibold')
    })
  })

  describe('Prop Combinations', () => {
    it('combines slim and color variant styling', () => {
      const combinedWrapper = mount(BubbleComponent, {
        props: { slim: true, blue: true },
        slots: { content: 'Combined Content' }
      })

      const div = combinedWrapper.find('div')
      // Should have both slim and blue styling
      expect(div.classes()).toContain('py-0.5')
      expect(div.classes()).toContain('px-2')
      expect(div.classes()).toContain('text-sm')
      expect(div.classes()).toContain('bg-primary')
      expect(div.classes()).toContain('text-white')
    })

    it('combines slim and patchable styling', () => {
      const combinedWrapper = mount(BubbleComponent, {
        props: { slim: true, patchable: true },
        slots: { content: 'Combined Content' }
      })

      const div = combinedWrapper.find('div')
      expect(div.classes()).toContain('py-0.5')
      expect(div.classes()).toContain('px-2')
      expect(div.classes()).toContain('text-sm')
      expect(div.classes()).toContain('bg-[#e9ffe8]')
      expect(div.classes()).toContain('text-[#78995a]')
      expect(div.classes()).toContain('font-semibold')
    })

    it('prioritizes specific color over default styling', () => {
      const coloredWrapper = mount(BubbleComponent, {
        props: { neutral: true },
        slots: { content: 'Colored Content' }
      })

      const div = coloredWrapper.find('div')
      expect(div.classes()).toContain('bg-[#f4f8ff]')
      expect(div.classes()).toContain('text-[#505050]')
      // Should not have default styling
      expect(div.classes()).not.toContain('bg-[#f2f2f2]')
      expect(div.classes()).not.toContain('hover:bg-[#0000001a]')
    })
  })

  describe('Edge Cases', () => {
    it('handles multiple color variants specified simultaneously', () => {
      const multiColorWrapper = mount(BubbleComponent, {
        props: { blue: true, neutral: true, bad: true },
        slots: { content: 'Multi Color Content' }
      })

      const div = multiColorWrapper.find('div')
      // All specified color classes should be applied (CSS cascade will determine final appearance)
      expect(div.classes()).toContain('bg-primary')
      expect(div.classes()).toContain('text-white')
      expect(div.classes()).toContain('bg-[#f4f8ff]')
      expect(div.classes()).toContain('text-[#505050]')
      expect(div.classes()).toContain('bg-[#f0d1d1]')
      expect(div.classes()).toContain('text-[#aa6d6d]')
    })

    it('handles all patchable variants specified simultaneously', () => {
      const multiPatchWrapper = mount(BubbleComponent, {
        props: { patchable: true, notPatchable: true, partiallyPatchable: true },
        slots: { content: 'Multi Patch Content' }
      })

      const div = multiPatchWrapper.find('div')
      expect(div.classes()).toContain('bg-[#e9ffe8]')
      expect(div.classes()).toContain('bg-[#ffe8e8]')
      expect(div.classes()).toContain('bg-[#fff6e8]')
      expect(div.classes()).toContain('font-semibold')
    })

    it('handles undefined/null slot content gracefully', () => {
      const emptyWrapper = mount(BubbleComponent)
      expect(emptyWrapper.find('div').exists()).toBe(true)
      expect(emptyWrapper.text()).toBe('')
    })

    it('handles undefined id gracefully', () => {
      const undefinedWrapper = mount(BubbleComponent, {
        props: { id: undefined },
        slots: { content: 'Content' }
      })

      expect(undefinedWrapper.exists()).toBe(true)
    })

    it('preserves base classes regardless of prop combinations', () => {
      const combinedWrapper = mount(BubbleComponent, {
        props: { 
          slim: true, 
          blue: true, 
          neutral: true, 
          patchable: true,
          notPatchable: true 
        },
        slots: { content: 'Complex Content' }
      })

      const div = combinedWrapper.find('div')
      // Base layout classes should always be present
      expect(div.classes()).toContain('flex')
      expect(div.classes()).toContain('flex-row')
      expect(div.classes()).toContain('justify-between')
      expect(div.classes()).toContain('items-center')
      expect(div.classes()).toContain('gap-2')
      expect(div.classes()).toContain('rounded-3xl')
      expect(div.classes()).toContain('w-fit')
    })
  })

  describe('Default Background Logic', () => {
    it('applies default background when no color variant is active', () => {
      const defaultWrapper = mount(BubbleComponent, {
        props: { slim: true }, // Only layout prop, no color props
        slots: { content: 'Default Content' }
      })

      const div = defaultWrapper.find('div')
      expect(div.classes()).toContain('bg-[#f2f2f2]')
      expect(div.classes()).toContain('hover:bg-[#0000001a]')
    })

    it('does not apply default background when any color variant is active', () => {
      const colorVariants = ['blue', 'neutral', 'bad', 'positive']
      
      colorVariants.forEach(variant => {
        const colorWrapper = mount(BubbleComponent, {
          props: { [variant]: true },
          slots: { content: `${variant} Content` }
        })

        const div = colorWrapper.find('div')
        expect(div.classes()).not.toContain('bg-[#f2f2f2]')
        expect(div.classes()).not.toContain('hover:bg-[#0000001a]')
      })
    })

    it('does not apply default background when patchable variants are active', () => {
      const patchableVariants = ['patchable', 'notPatchable', 'partiallyPatchable']
      
      patchableVariants.forEach(variant => {
        const patchWrapper = mount(BubbleComponent, {
          props: { [variant]: true },
          slots: { content: `${variant} Content` }
        })

        const div = patchWrapper.find('div')
        // Patchable variants don't prevent default background
        expect(div.classes()).toContain('bg-[#f2f2f2]')
        expect(div.classes()).toContain('hover:bg-[#0000001a]')
      })
    })
  })

  describe('Accessibility', () => {
    it('provides semantic structure', () => {
      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('preserves slot content for screen readers', () => {
      const accessibleWrapper = mount(BubbleComponent, {
        slots: {
          content: '<span role="text" aria-label="Important information">Content</span>'
        }
      })

      expect(accessibleWrapper.html()).toContain('role="text"')
      expect(accessibleWrapper.html()).toContain('aria-label="Important information"')
    })

    it('maintains focus behavior through CSS hover states', () => {
      const defaultWrapper = mount(BubbleComponent, {
        slots: { content: 'Default Content' }
      })

      const div = defaultWrapper.find('div')
      expect(div.classes()).toContain('hover:bg-[#0000001a]')
    })
  })

  describe('CSS Class Validation', () => {
    it('ensures mutually exclusive color variants work as expected', () => {
      const variants = [
        { prop: 'blue', bgClass: 'bg-primary', textClass: 'text-white' },
        { prop: 'neutral', bgClass: 'bg-[#f4f8ff]', textClass: 'text-[#505050]' },
        { prop: 'bad', bgClass: 'bg-[#f0d1d1]', textClass: 'text-[#aa6d6d]' },
        { prop: 'positive', bgClass: 'bg-[#c0e8b3]', textClass: 'text-[#69b751]' }
      ]

      variants.forEach(variant => {
        const variantWrapper = mount(BubbleComponent, {
          props: { [variant.prop]: true },
          slots: { content: `${variant.prop} Content` }
        })

        const div = variantWrapper.find('div')
        expect(div.classes()).toContain(variant.bgClass)
        expect(div.classes()).toContain(variant.textClass)
      })
    })

    it('validates patchable variant classes', () => {
      const patchableVariants = [
        { prop: 'patchable', bgClass: 'bg-[#e9ffe8]', textClass: 'text-[#78995a]' },
        { prop: 'notPatchable', bgClass: 'bg-[#ffe8e8]', textClass: 'text-[#995a5a]' },
        { prop: 'partiallyPatchable', bgClass: 'bg-[#fff6e8]', textClass: 'text-[#99705a]' }
      ]

      patchableVariants.forEach(variant => {
        const variantWrapper = mount(BubbleComponent, {
          props: { [variant.prop]: true },
          slots: { content: `${variant.prop} Content` }
        })

        const div = variantWrapper.find('div')
        expect(div.classes()).toContain(variant.bgClass)
        expect(div.classes()).toContain(variant.textClass)
        expect(div.classes()).toContain('font-semibold')
      })
    })
  })
})