import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSubmitButton from '@/base_components/ui/loaders/LoadingSubmitButton.vue'

describe('LoadingSubmitButton', () => {
  describe('Component Rendering', () => {
    it('renders as submit button', () => {
      const wrapper = mount(LoadingSubmitButton)
      
      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('submit')
    })

    it('applies default CSS classes', () => {
      const wrapper = mount(LoadingSubmitButton)
      
      const classes = wrapper.classes()
      expect(classes).toContain('rounded')
      expect(classes).toContain('py-3')
      expect(classes).toContain('px-5')
      expect(classes).toContain('text-white')
      expect(classes).toContain('shadow-md')
      expect(classes).toContain('bg-primary')
      expect(classes).toContain('hover:bg-primary/90')
    })

    it('applies submit-button class by default', () => {
      const wrapper = mount(LoadingSubmitButton)
      
      expect(wrapper.classes()).toContain('submit-button')
    })

    it('renders slot content when not loading', () => {
      const buttonText = 'Submit Form'
      const wrapper = mount(LoadingSubmitButton, {
        slots: {
          default: buttonText
        }
      })
      
      expect(wrapper.text()).toBe(buttonText)
    })
  })

  describe('Props Handling', () => {
    describe('noStyle prop', () => {
      it('does not apply submit-button class when noStyle is true', () => {
        const wrapper = mount(LoadingSubmitButton, {
          props: {
            noStyle: true
          }
        })
        
        expect(wrapper.classes()).not.toContain('submit-button')
      })

      it('still applies other CSS classes when noStyle is true', () => {
        const wrapper = mount(LoadingSubmitButton, {
          props: {
            noStyle: true
          }
        })
        
        const classes = wrapper.classes()
        expect(classes).toContain('rounded')
        expect(classes).toContain('py-3')
        expect(classes).toContain('px-5')
        expect(classes).toContain('text-white')
      })

      it('applies submit-button class when noStyle is false', () => {
        const wrapper = mount(LoadingSubmitButton, {
          props: {
            noStyle: false
          }
        })
        
        expect(wrapper.classes()).toContain('submit-button')
      })

      it('applies submit-button class when noStyle is undefined', () => {
        const wrapper = mount(LoadingSubmitButton)
        
        expect(wrapper.classes()).toContain('submit-button')
      })
    })
  })

  describe('Loading State Management', () => {
    describe('setLoading method', () => {
      it('exposes setLoading method', () => {
        const wrapper = mount(LoadingSubmitButton)
        
        expect(wrapper.vm.setLoading).toBeTypeOf('function')
      })

      it('shows spinner when loading is true', async () => {
        const wrapper = mount(LoadingSubmitButton, {
          slots: {
            default: 'Submit'
          }
        })
        
        await wrapper.vm.setLoading(true)
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.spinner').exists()).toBe(true)
        expect(wrapper.text()).toBe('')
      })

      it('hides slot content when loading is true', async () => {
        const buttonText = 'Submit Form'
        const wrapper = mount(LoadingSubmitButton, {
          slots: {
            default: buttonText
          }
        })
        
        await wrapper.vm.setLoading(true)
        await wrapper.vm.$nextTick()
        
        expect(wrapper.text()).not.toContain(buttonText)
      })

      it('shows slot content when loading is false', async () => {
        const buttonText = 'Submit Form'
        const wrapper = mount(LoadingSubmitButton, {
          slots: {
            default: buttonText
          }
        })
        
        await wrapper.vm.setLoading(true)
        await wrapper.vm.setLoading(false)
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.spinner').exists()).toBe(false)
        expect(wrapper.text()).toBe(buttonText)
      })

      it('can toggle loading state multiple times', async () => {
        const wrapper = mount(LoadingSubmitButton, {
          slots: {
            default: 'Submit'
          }
        })
        
        // Initially not loading
        expect(wrapper.find('.spinner').exists()).toBe(false)
        
        // Set loading
        await wrapper.vm.setLoading(true)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.spinner').exists()).toBe(true)
        
        // Unset loading
        await wrapper.vm.setLoading(false)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.spinner').exists()).toBe(false)
        
        // Set loading again
        await wrapper.vm.setLoading(true)
        await wrapper.vm.$nextTick()
        expect(wrapper.find('.spinner').exists()).toBe(true)
      })
    })
  })

  describe('Disabled State Management', () => {
    describe('setDisabled method', () => {
      it('exposes setDisabled method', () => {
        const wrapper = mount(LoadingSubmitButton)
        
        expect(wrapper.vm.setDisabled).toBeTypeOf('function')
      })

      it('enables button by default', () => {
        const wrapper = mount(LoadingSubmitButton)
        
        expect(wrapper.attributes('disabled')).toBeUndefined()
      })

      it('disables button when setDisabled(true) is called', async () => {
        const wrapper = mount(LoadingSubmitButton)
        
        await wrapper.vm.setDisabled(true)
        await wrapper.vm.$nextTick()
        
        expect(wrapper.attributes('disabled')).toBeDefined()
      })

      it('enables button when setDisabled(false) is called', async () => {
        const wrapper = mount(LoadingSubmitButton)
        
        await wrapper.vm.setDisabled(true)
        await wrapper.vm.setDisabled(false)
        await wrapper.vm.$nextTick()
        
        expect(wrapper.attributes('disabled')).toBeUndefined()
      })

      it('can toggle disabled state multiple times', async () => {
        const wrapper = mount(LoadingSubmitButton)
        
        // Initially enabled
        expect(wrapper.attributes('disabled')).toBeUndefined()
        
        // Set disabled
        await wrapper.vm.setDisabled(true)
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('disabled')).toBeDefined()
        
        // Set enabled
        await wrapper.vm.setDisabled(false)
        await wrapper.vm.$nextTick()
        expect(wrapper.attributes('disabled')).toBeUndefined()
      })
    })
  })

  describe('Combined State Management', () => {
    it('can be both loading and disabled', async () => {
      const wrapper = mount(LoadingSubmitButton, {
        slots: {
          default: 'Submit'
        }
      })
      
      await wrapper.vm.setLoading(true)
      await wrapper.vm.setDisabled(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toBe('')
    })

    it('maintains independent state for loading and disabled', async () => {
      const wrapper = mount(LoadingSubmitButton, {
        slots: {
          default: 'Submit'
        }
      })
      
      // Set disabled but not loading
      await wrapper.vm.setDisabled(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.spinner').exists()).toBe(false)
      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toBe('Submit')
      
      // Set loading but keep disabled
      await wrapper.vm.setLoading(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toBe('')
    })
  })

  describe('Spinner Animation', () => {
    it('applies correct CSS classes to spinner', async () => {
      const wrapper = mount(LoadingSubmitButton)
      
      await wrapper.vm.setLoading(true)
      await wrapper.vm.$nextTick()
      
      const spinner = wrapper.find('.spinner')
      expect(spinner.exists()).toBe(true)
      expect(spinner.classes()).toContain('spinner')
    })

    it('only shows spinner when in loading state', async () => {
      const wrapper = mount(LoadingSubmitButton)
      
      // Initially not loading
      expect(wrapper.find('.spinner').exists()).toBe(false)
      
      // Set loading
      await wrapper.vm.setLoading(true)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.spinner').exists()).toBe(true)
      
      // Unset loading
      await wrapper.vm.setLoading(false)
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.spinner').exists()).toBe(false)
    })
  })

  describe('Slot Behavior', () => {
    it('renders slot content when not loading', () => {
      const wrapper = mount(LoadingSubmitButton, {
        slots: {
          default: '<span>Custom Button Content</span>'
        }
      })
      
      expect(wrapper.html()).toContain('<span>Custom Button Content</span>')
    })

    it('does not render slot content when loading', async () => {
      const wrapper = mount(LoadingSubmitButton, {
        slots: {
          default: '<span>Custom Button Content</span>'
        }
      })
      
      await wrapper.vm.setLoading(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.html()).not.toContain('<span>Custom Button Content</span>')
    })

    it('handles empty slot gracefully', () => {
      const wrapper = mount(LoadingSubmitButton)
      
      expect(wrapper.text()).toBe('')
    })

    it('handles complex slot content', () => {
      const complexContent = '<div><span>Submit</span> <strong>Now</strong></div>'
      const wrapper = mount(LoadingSubmitButton, {
        slots: {
          default: complexContent
        }
      })
      
      expect(wrapper.html()).toContain(complexContent)
    })
  })

  describe('Button Attributes', () => {
    it('maintains submit type regardless of state', async () => {
      const wrapper = mount(LoadingSubmitButton)
      
      expect(wrapper.attributes('type')).toBe('submit')
      
      await wrapper.vm.setLoading(true)
      await wrapper.vm.$nextTick()
      expect(wrapper.attributes('type')).toBe('submit')
      
      await wrapper.vm.setDisabled(true)
      await wrapper.vm.$nextTick()
      expect(wrapper.attributes('type')).toBe('submit')
    })
  })

  describe('CSS Class Management', () => {
    it('maintains base CSS classes regardless of noStyle prop', () => {
      const baseClasses = ['rounded', 'py-3', 'px-5', 'text-white', 'shadow-md', 'bg-primary', 'hover:bg-primary/90']
      
      const wrapper1 = mount(LoadingSubmitButton)
      const wrapper2 = mount(LoadingSubmitButton, { props: { noStyle: true } })
      
      baseClasses.forEach(className => {
        expect(wrapper1.classes()).toContain(className)
        expect(wrapper2.classes()).toContain(className)
      })
    })

    it('conditionally applies submit-button class based on noStyle prop', () => {
      const wrapperDefault = mount(LoadingSubmitButton)
      const wrapperNoStyle = mount(LoadingSubmitButton, { props: { noStyle: true } })
      const wrapperWithStyle = mount(LoadingSubmitButton, { props: { noStyle: false } })
      
      expect(wrapperDefault.classes()).toContain('submit-button')
      expect(wrapperNoStyle.classes()).not.toContain('submit-button')
      expect(wrapperWithStyle.classes()).toContain('submit-button')
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid state changes', async () => {
      const wrapper = mount(LoadingSubmitButton, {
        slots: {
          default: 'Submit'
        }
      })
      
      // Rapid loading state changes
      await wrapper.vm.setLoading(true)
      await wrapper.vm.setLoading(false)
      await wrapper.vm.setLoading(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.spinner').exists()).toBe(true)
      
      // Rapid disabled state changes
      await wrapper.vm.setDisabled(true)
      await wrapper.vm.setDisabled(false)
      await wrapper.vm.setDisabled(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.attributes('disabled')).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('maintains button semantics', () => {
      const wrapper = mount(LoadingSubmitButton)
      
      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('submit')
    })

    it('provides visual feedback for loading state', async () => {
      const wrapper = mount(LoadingSubmitButton)
      
      await wrapper.vm.setLoading(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('properly disables interaction when disabled', async () => {
      const wrapper = mount(LoadingSubmitButton)
      
      await wrapper.vm.setDisabled(true)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.attributes('disabled')).toBeDefined()
    })
  })
})