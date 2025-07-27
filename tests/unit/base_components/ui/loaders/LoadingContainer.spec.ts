import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingContainer from '@/base_components/ui/loaders/LoadingContainer.vue'

// Mock the Icon component from @iconify/vue
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span data-testid="warning-icon" :class="$props.class">{{ $props.icon }}</span>',
    props: ['icon', 'class']
  }
}))

// Mock the shadcn Alert components
vi.mock('@/shadcn/ui/alert/Alert.vue', () => ({
  default: {
    name: 'Alert',
    template: '<div data-testid="alert" :class="variant"><slot /></div>',
    props: ['variant']
  }
}))

vi.mock('@/shadcn/ui/alert/AlertDescription.vue', () => ({
  default: {
    name: 'AlertDescription',
    template: '<div data-testid="alert-description"><slot /></div>'
  }
}))

describe('LoadingContainer', () => {
  describe('Initial State', () => {
    it('renders in loading state by default', () => {
      const wrapper = mount(LoadingContainer)
      
      expect(wrapper.find('.loading-wrapper-local').exists()).toBe(true)
      expect(wrapper.find('.loader').exists()).toBe(true)
    })

    it('shows loader animation with four dots', () => {
      const wrapper = mount(LoadingContainer)
      
      const loader = wrapper.find('.loader')
      const dots = loader.findAll('div')
      
      expect(dots).toHaveLength(4)
    })

    it('does not show content slot initially', () => {
      const wrapper = mount(LoadingContainer, {
        slots: {
          content: '<div data-testid="content">Test Content</div>'
        }
      })
      
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
    })

    it('does not show error alert initially', () => {
      const wrapper = mount(LoadingContainer)
      
      expect(wrapper.find('[data-testid="alert"]').exists()).toBe(false)
    })
  })

  describe('State Management Methods', () => {
    describe('showContent()', () => {
      it('exposes showContent method', () => {
        const wrapper = mount(LoadingContainer)
        
        expect(wrapper.vm.showContent).toBeTypeOf('function')
      })

      it('switches to content state and hides loading', async () => {
        const wrapper = mount(LoadingContainer, {
          slots: {
            content: '<div data-testid="content">Test Content</div>'
          }
        })
        
        await wrapper.vm.showContent()
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.loading-wrapper-local').exists()).toBe(false)
        expect(wrapper.find('[data-testid="content"]').exists()).toBe(true)
      })
    })

    describe('showError()', () => {
      it('exposes showError method', () => {
        const wrapper = mount(LoadingContainer)
        
        expect(wrapper.vm.showError).toBeTypeOf('function')
      })

      it('switches to error state and hides loading', async () => {
        const wrapper = mount(LoadingContainer, {
          slots: {
            error: '<div data-testid="error-content">Error message</div>'
          }
        })
        
        await wrapper.vm.showError()
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.loading-wrapper-local').exists()).toBe(false)
        expect(wrapper.find('[data-testid="alert"]').exists()).toBe(true)
      })

      it('shows warning icon in error state', async () => {
        const wrapper = mount(LoadingContainer, {
          slots: {
            error: '<div>Error occurred</div>'
          }
        })
        
        await wrapper.vm.showError()
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('[data-testid="warning-icon"]').exists()).toBe(true)
      })

      it('applies destructive variant to alert', async () => {
        const wrapper = mount(LoadingContainer)
        
        await wrapper.vm.showError()
        await wrapper.vm.$nextTick()
        
        const alert = wrapper.findComponent({ name: 'Alert' })
        expect(alert.props('variant')).toBe('destructive')
      })
    })

    describe('showLoading()', () => {
      it('exposes showLoading method', () => {
        const wrapper = mount(LoadingContainer)
        
        expect(wrapper.vm.showLoading).toBeTypeOf('function')
      })

      it('switches back to loading state from content', async () => {
        const wrapper = mount(LoadingContainer, {
          slots: {
            content: '<div data-testid="content">Test Content</div>'
          }
        })
        
        await wrapper.vm.showContent()
        await wrapper.vm.$nextTick()
        
        await wrapper.vm.showLoading()
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.loading-wrapper-local').exists()).toBe(true)
        expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
      })

      it('switches back to loading state from error', async () => {
        const wrapper = mount(LoadingContainer)
        
        await wrapper.vm.showError()
        await wrapper.vm.$nextTick()
        
        await wrapper.vm.showLoading()
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.loading-wrapper-local').exists()).toBe(true)
        expect(wrapper.find('[data-testid="alert"]').exists()).toBe(false)
      })
    })
  })

  describe('State Transitions', () => {
    it('only shows one state at a time', async () => {
      const wrapper = mount(LoadingContainer, {
        slots: {
          content: '<div data-testid="content">Test Content</div>',
          error: '<div data-testid="error-content">Error message</div>'
        }
      })
      
      // Initially loading
      expect(wrapper.find('.loading-wrapper-local').exists()).toBe(true)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="alert"]').exists()).toBe(false)
      
      // Switch to content
      await wrapper.vm.showContent()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading-wrapper-local').exists()).toBe(false)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="alert"]').exists()).toBe(false)
      
      // Switch to error
      await wrapper.vm.showError()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading-wrapper-local').exists()).toBe(false)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(true) // content remains visible when in error state
      expect(wrapper.find('[data-testid="alert"]').exists()).toBe(true)
    })
  })

  describe('Slot Rendering', () => {
    it('renders content slot when in content state', async () => {
      const contentText = 'Custom content here'
      const wrapper = mount(LoadingContainer, {
        slots: {
          content: `<div data-testid="content">${contentText}</div>`
        }
      })
      
      await wrapper.vm.showContent()
      await wrapper.vm.$nextTick()
      
      const content = wrapper.find('[data-testid="content"]')
      expect(content.exists()).toBe(true)
      expect(content.text()).toBe(contentText)
    })

    it('renders error slot when in error state', async () => {
      const errorText = 'Something went wrong'
      const wrapper = mount(LoadingContainer, {
        slots: {
          error: `<div data-testid="error-content">${errorText}</div>`
        }
      })
      
      await wrapper.vm.showError()
      await wrapper.vm.$nextTick()
      
      const errorContent = wrapper.find('[data-testid="error-content"]')
      expect(errorContent.exists()).toBe(true)
      expect(errorContent.text()).toBe(errorText)
    })
  })

  describe('Loading Animation', () => {
    it('applies correct CSS classes to loading wrapper', () => {
      const wrapper = mount(LoadingContainer)
      
      const loadingWrapper = wrapper.find('.loading-wrapper-local')
      expect(loadingWrapper.exists()).toBe(true)
      expect(loadingWrapper.classes()).toContain('loading-wrapper-local')
    })

    it('applies correct CSS classes to loader', () => {
      const wrapper = mount(LoadingContainer)
      
      const loader = wrapper.find('.loader')
      expect(loader.exists()).toBe(true)
      expect(loader.classes()).toContain('loader')
    })

    it('has correct number of animated dots', () => {
      const wrapper = mount(LoadingContainer)
      
      const dots = wrapper.find('.loader').findAll('div')
      expect(dots).toHaveLength(4)
    })
  })

  describe('Error Display', () => {
    it('uses warning icon with correct props', async () => {
      const wrapper = mount(LoadingContainer)
      
      await wrapper.vm.showError()
      await wrapper.vm.$nextTick()
      
      const iconComponent = wrapper.findComponent({ name: 'Icon' })
      expect(iconComponent.exists()).toBe(true)
      expect(iconComponent.props('icon')).toBe('ic:twotone-warning')
      expect(iconComponent.props('class')).toContain('text-xl')
    })

    it('structures error alert correctly', async () => {
      const wrapper = mount(LoadingContainer, {
        slots: {
          error: '<div data-testid="error-content">Error message</div>'
        }
      })
      
      await wrapper.vm.showError()
      await wrapper.vm.$nextTick()
      
      const alert = wrapper.find('[data-testid="alert"]')
      const alertDescription = wrapper.find('[data-testid="alert-description"]')
      
      expect(alert.exists()).toBe(true)
      expect(alertDescription.exists()).toBe(true)
      expect(wrapper.find('[data-testid="warning-icon"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="error-content"]').exists()).toBe(true)
    })
  })

  describe('Component Integration', () => {
    it('integrates with shadcn Alert components', async () => {
      const wrapper = mount(LoadingContainer)
      
      await wrapper.vm.showError()
      await wrapper.vm.$nextTick()
      
      const alert = wrapper.findComponent({ name: 'Alert' })
      const alertDescription = wrapper.findComponent({ name: 'AlertDescription' })
      
      expect(alert.exists()).toBe(true)
      expect(alertDescription.exists()).toBe(true)
    })

    it('integrates with Iconify icon component', async () => {
      const wrapper = mount(LoadingContainer)
      
      await wrapper.vm.showError()
      await wrapper.vm.$nextTick()
      
      const iconComponent = wrapper.findComponent({ name: 'Icon' })
      expect(iconComponent.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty slots gracefully', async () => {
      const wrapper = mount(LoadingContainer)
      
      await wrapper.vm.showContent()
      await wrapper.vm.$nextTick()
      
      // Should not crash even with empty content slot
      expect(wrapper.find('.loading-wrapper-local').exists()).toBe(false)
    })

    it('handles rapid state changes', async () => {
      const wrapper = mount(LoadingContainer, {
        slots: {
          content: '<div data-testid="content">Content</div>'
        }
      })
      
      await wrapper.vm.showContent()
      await wrapper.vm.showError()
      await wrapper.vm.showLoading()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading-wrapper-local').exists()).toBe(true)
      expect(wrapper.find('[data-testid="content"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="alert"]').exists()).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('provides visual loading indication', () => {
      const wrapper = mount(LoadingContainer)
      
      expect(wrapper.find('.loader').exists()).toBe(true)
    })

    it('provides error indication with icon and message', async () => {
      const wrapper = mount(LoadingContainer, {
        slots: {
          error: '<div>Error occurred</div>'
        }
      })
      
      await wrapper.vm.showError()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('[data-testid="warning-icon"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Error occurred')
    })
  })
})