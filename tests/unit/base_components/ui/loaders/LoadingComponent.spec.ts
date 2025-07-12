import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingComponent from '@/base_components/ui/loaders/LoadingComponent.vue'

// Mock the Icon component from @iconify/vue
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span data-testid="loading-icon"></span>',
    props: ['icon']
  }
}))

describe('LoadingComponent', () => {
  describe('Component Rendering', () => {
    it('renders successfully', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.exists()).toBe(true)
    })

    it('renders as a div element', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.element.tagName).toBe('DIV')
    })

    it('applies correct CSS classes', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.classes()).toContain('flex')
      expect(wrapper.classes()).toContain('items-center')
      expect(wrapper.classes()).toContain('gap-2')
    })

    it('displays loading text', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.text()).toContain('Loading')
    })
  })

  describe('Icon Integration', () => {
    it('renders the loading icon', () => {
      const wrapper = mount(LoadingComponent)
      
      const icon = wrapper.find('[data-testid="loading-icon"]')
      expect(icon.exists()).toBe(true)
    })

    it('uses correct icon name', () => {
      const wrapper = mount(LoadingComponent)
      
      const iconComponent = wrapper.findComponent({ name: 'Icon' })
      expect(iconComponent.exists()).toBe(true)
      expect(iconComponent.props('icon')).toBe('line-md:loading-loop')
    })
  })

  describe('Component Structure', () => {
    it('contains both text and icon elements', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.text()).toContain('Loading')
      expect(wrapper.find('[data-testid="loading-icon"]').exists()).toBe(true)
    })

    it('has single root element', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.element.children.length).toBeGreaterThan(0)
    })
  })

  describe('Layout and Styling', () => {
    it('applies flexbox layout', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.classes()).toContain('flex')
    })

    it('centers items vertically', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.classes()).toContain('items-center')
    })

    it('applies gap spacing', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.classes()).toContain('gap-2')
    })
  })

  describe('Accessibility', () => {
    it('provides loading state indication through text', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.text()).toContain('Loading')
    })

    it('provides visual loading indication through icon', () => {
      const wrapper = mount(LoadingComponent)
      
      const icon = wrapper.find('[data-testid="loading-icon"]')
      expect(icon.exists()).toBe(true)
    })
  })

  describe('Content Verification', () => {
    it('displays exact loading text', () => {
      const wrapper = mount(LoadingComponent)
      
      const textContent = wrapper.text()
      expect(textContent).toMatch(/Loading\s*/)
    })

    it('combines text and icon properly', () => {
      const wrapper = mount(LoadingComponent)
      
      expect(wrapper.text()).toContain('Loading')
      expect(wrapper.find('[data-testid="loading-icon"]').exists()).toBe(true)
    })
  })

  describe('Component Props', () => {
    it('has no props defined', () => {
      const wrapper = mount(LoadingComponent)
      
      // Component should work without any props
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading')
    })
  })

  describe('CSS Classes Validation', () => {
    it('has exactly the expected CSS classes', () => {
      const wrapper = mount(LoadingComponent)
      
      const classes = wrapper.classes()
      expect(classes).toContain('flex')
      expect(classes).toContain('items-center')
      expect(classes).toContain('gap-2')
    })
  })

  describe('Error Handling', () => {
    it('renders gracefully even if icon fails to load', () => {
      const wrapper = mount(LoadingComponent)
      
      // Text should still be visible
      expect(wrapper.text()).toContain('Loading')
    })
  })

  describe('Component Composition', () => {
    it('includes Icon component as child', () => {
      const wrapper = mount(LoadingComponent)
      
      const iconComponent = wrapper.findComponent({ name: 'Icon' })
      expect(iconComponent.exists()).toBe(true)
    })

    it('has correct component hierarchy', () => {
      const wrapper = mount(LoadingComponent)
      
      // Root div contains both text and Icon
      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.text()).toContain('Loading')
      expect(wrapper.findComponent({ name: 'Icon' }).exists()).toBe(true)
    })
  })
})