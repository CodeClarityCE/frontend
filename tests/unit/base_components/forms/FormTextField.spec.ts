import FormTextField from '@/base_components/forms/FormTextField.vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

// Mock vee-validate components
const mockField = {
  template: '<input v-bind="$attrs" />',
  props: ['placeholder', 'type', 'name', 'disabled']
}

const mockErrorMessage = {
  template: '<div class="text-red-500 mt-1 block"></div>',
  props: ['name']
}

describe('FormTextField', () => {
  const defaultProps = {
    placeholder: 'Enter text',
    type: 'text',
    name: 'testField'
  }

  const globalComponents = {
    Field: mockField,
    ErrorMessage: mockErrorMessage
  }

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(FormTextField, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.find('label').exists()).toBe(true)
    })

    it('displays correct placeholder text', () => {
      const wrapper = mount(FormTextField, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Enter text')
    })

    it('applies correct input type', () => {
      const wrapper = mount(FormTextField, {
        props: {
          ...defaultProps,
          type: 'email'
        },
        global: {
          components: globalComponents
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('email')
    })

    it('renders label with slot content', () => {
      const wrapper = mount(FormTextField, {
        props: defaultProps,
        slots: {
          name: 'Field Label'
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toContain('Field Label')
    })
  })

  describe('Disabled State', () => {
    it('applies disabled attribute when disabled prop is true', () => {
      const wrapper = mount(FormTextField, {
        props: {
          ...defaultProps,
          disabled: true
        },
        global: {
          components: globalComponents
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeDefined()
    })

    it('applies disabled styling when disabled', () => {
      const wrapper = mount(FormTextField, {
        props: {
          ...defaultProps,
          disabled: true
        },
        global: {
          components: globalComponents
        }
      })

      const input = wrapper.find('input')
      expect(input.classes()).toContain('cursor-not-allowed')
    })

    it('allows interaction when not disabled', () => {
      const wrapper = mount(FormTextField, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('disabled')).toBeUndefined()
    })
  })

  describe('Styling', () => {
    it('applies base styling classes', () => {
      const wrapper = mount(FormTextField, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const input = wrapper.find('input')
      expect(input.classes()).toContain('border')
      expect(input.classes()).toContain('border-solid')
      expect(input.classes()).toContain('border-slate-300/60')
      expect(input.classes()).toContain('rounded')
      expect(input.classes()).toContain('shadow-md')
      expect(input.classes()).toContain('w-full')
      expect(input.classes()).toContain('py-3')
      expect(input.classes()).toContain('px-5')
      expect(input.classes()).toContain('transition-colors')
    })
  })

  describe('Accessibility', () => {
    it('associates label with input using for attribute', () => {
      const wrapper = mount(FormTextField, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const label = wrapper.find('label')
      const input = wrapper.find('input')

      expect(label.attributes('for')).toBe(defaultProps.name)
      expect(input.attributes('name')).toBe(defaultProps.name)
    })

    it('has proper structure for error handling', () => {
      const wrapper = mount(FormTextField, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      // Component should render without errors and have the basic structure
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('div').exists()).toBe(true)
    })
  })

  describe('Input Types', () => {
    it.each([
      'text',
      'email', 
      'password',
      'number',
      'tel',
      'url'
    ])('handles %s input type correctly', (inputType) => {
      const wrapper = mount(FormTextField, {
        props: {
          ...defaultProps,
          type: inputType
        },
        global: {
          components: globalComponents
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe(inputType)
    })
  })
})