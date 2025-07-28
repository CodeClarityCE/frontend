import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import LoadingButton from '@/base_components/ui/loaders/LoadingButton.vue'

describe('LoadingButton', () => {
  describe('Initial Render', () => {
    it('renders button element', () => {
      const wrapper = mount(LoadingButton)
      
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('renders with default styling when noStyle is not provided', () => {
      const wrapper = mount(LoadingButton)
      
      const button = wrapper.find('button')
      expect(button.classes()).toContain('cursor-pointer')
      expect(button.classes()).toContain('flex')
      expect(button.classes()).toContain('flex-row')
      expect(button.classes()).toContain('items-center')
      expect(button.classes()).toContain('justify-center')
      expect(button.classes()).toContain('submit-button')
    })

    it('renders without submit-button styling when noStyle is true', () => {
      const wrapper = mount(LoadingButton, {
        props: { noStyle: true }
      })
      
      const button = wrapper.find('button')
      expect(button.classes()).not.toContain('submit-button')
    })

    it('renders slot content when not loading', () => {
      render(LoadingButton, {
        slots: {
          default: 'Click me'
        }
      })

      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('is not disabled initially', () => {
      const wrapper = mount(LoadingButton)
      
      expect(wrapper.find('button').attributes('disabled')).toBeFalsy()
    })
  })

  describe('Loading State', () => {
    it('shows spinner when loading is true', async () => {
      const wrapper = mount(LoadingButton, {
        slots: {
          default: 'Button Text'
        }
      })

      // Set loading state using exposed method
      await wrapper.vm.setLoading(true)

      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Button Text')
    })

    it('hides slot content when loading', async () => {
      const wrapper = mount(LoadingButton, {
        slots: {
          default: 'Button Text'
        }
      })

      await wrapper.vm.setLoading(true)
      expect(wrapper.text()).not.toContain('Button Text')
    })

    it('applies correct spinner styling', async () => {
      const wrapper = mount(LoadingButton)
      
      await wrapper.vm.setLoading(true)
      
      const spinner = wrapper.find('.spinner')
      expect(spinner.exists()).toBe(true)
      expect(spinner.classes()).toContain('-my-1')
      expect(spinner.classes()).toContain('aspect-square')
      expect(spinner.classes()).toContain('rounded')
    })
  })

  describe('Disabled State', () => {
    it('disables button when setDisabled is called with true', async () => {
      const wrapper = mount(LoadingButton)
      
      await wrapper.vm.setDisabled(true)
      
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('enables button when setDisabled is called with false', async () => {
      const wrapper = mount(LoadingButton)
      
      await wrapper.vm.setDisabled(true)
      await wrapper.vm.setDisabled(false)
      
      expect(wrapper.find('button').attributes('disabled')).toBeFalsy()
    })
  })

  describe('Toggle Functionality', () => {
    it('toggles loading and disabled state when toggle is called', async () => {
      const wrapper = mount(LoadingButton, {
        slots: {
          default: 'Button Text'
        }
      })

      // Initial state
      expect(wrapper.find('.spinner').exists()).toBe(false)
      expect(wrapper.find('button').attributes('disabled')).toBeFalsy()
      expect(wrapper.text()).toContain('Button Text')

      // First toggle - should enable loading and disable button
      await wrapper.vm.toggle()
      
      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      expect(wrapper.text()).not.toContain('Button Text')

      // Second toggle - should disable loading and enable button
      await wrapper.vm.toggle()
      
      expect(wrapper.find('.spinner').exists()).toBe(false)
      expect(wrapper.find('button').attributes('disabled')).toBeFalsy()
      expect(wrapper.text()).toContain('Button Text')
    })
  })

  describe('Exposed Methods', () => {
    it('exposes setLoading method', () => {
      const wrapper = mount(LoadingButton)
      
      expect(wrapper.vm.setLoading).toBeDefined()
      expect(typeof wrapper.vm.setLoading).toBe('function')
    })

    it('exposes setDisabled method', () => {
      const wrapper = mount(LoadingButton)
      
      expect(wrapper.vm.setDisabled).toBeDefined()
      expect(typeof wrapper.vm.setDisabled).toBe('function')
    })

    it('exposes toggle method', () => {
      const wrapper = mount(LoadingButton)
      
      expect(wrapper.vm.toggle).toBeDefined()
      expect(typeof wrapper.vm.toggle).toBe('function')
    })
  })

  describe('User Interaction', () => {
    it('can be clicked when not disabled', async () => {
      const user = userEvent.setup()
      const clickHandler = vi.fn()
      
      render(LoadingButton, {
        slots: {
          default: 'Click me'
        },
        attrs: {
          onClick: clickHandler
        }
      })

      const button = screen.getByRole('button')
      await user.click(button)

      expect(clickHandler).toHaveBeenCalledOnce()
    })

    it('cannot be clicked when disabled', async () => {
      const user = userEvent.setup()
      const clickHandler = vi.fn()
      
      const wrapper = mount(LoadingButton, {
        slots: {
          default: 'Click me'
        },
        attrs: {
          onClick: clickHandler
        }
      })

      await wrapper.vm.setDisabled(true)

      const button = wrapper.find('button')
      await user.click(button.element)

      // Click should not trigger when disabled
      expect(clickHandler).not.toHaveBeenCalled()
    })
  })

  describe('State Combinations', () => {
    it('handles loading true and disabled false correctly', async () => {
      const wrapper = mount(LoadingButton, {
        slots: {
          default: 'Button Text'
        }
      })

      await wrapper.vm.setLoading(true)
      await wrapper.vm.setDisabled(false)

      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.find('button').attributes('disabled')).toBeFalsy()
      expect(wrapper.text()).not.toContain('Button Text')
    })

    it('handles loading false and disabled true correctly', async () => {
      const wrapper = mount(LoadingButton, {
        slots: {
          default: 'Button Text'
        }
      })

      await wrapper.vm.setLoading(false)
      await wrapper.vm.setDisabled(true)

      expect(wrapper.find('.spinner').exists()).toBe(false)
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toContain('Button Text')
    })

    it('handles both loading and disabled true correctly', async () => {
      const wrapper = mount(LoadingButton, {
        slots: {
          default: 'Button Text'
        }
      })

      await wrapper.vm.setLoading(true)
      await wrapper.vm.setDisabled(true)

      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      expect(wrapper.text()).not.toContain('Button Text')
    })
  })

  describe('Props Validation', () => {
    it('handles noStyle prop correctly', () => {
      const wrapperWithStyle = mount(LoadingButton, {
        props: { noStyle: false }
      })
      
      const wrapperWithoutStyle = mount(LoadingButton, {
        props: { noStyle: true }
      })

      expect(wrapperWithStyle.find('button').classes()).toContain('submit-button')
      expect(wrapperWithoutStyle.find('button').classes()).not.toContain('submit-button')
    })

    it('defaults to styled button when noStyle is not provided', () => {
      const wrapper = mount(LoadingButton)
      
      expect(wrapper.find('button').classes()).toContain('submit-button')
    })
  })
})