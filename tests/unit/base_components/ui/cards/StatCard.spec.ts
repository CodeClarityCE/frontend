import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import StatCard from '../../../../../src/base_components/ui/cards/StatCard.vue'

// Mock the Card components and Icon
vi.mock('@/shadcn/ui/card', () => ({
  Card: {
    name: 'Card',
    template: '<div data-testid="card" class="card" :class="$attrs.class"><slot /></div>',
    inheritAttrs: false
  },
  CardContent: {
    name: 'CardContent',
    template: '<div data-testid="card-content" class="card-content"><slot /></div>'
  }
}))

vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span data-testid="icon" class="icon" :class="$attrs.class" :data-icon="icon">{{ icon ?? "mock-icon" }}</span>',
    props: ['icon', 'class', 'width', 'height', 'style'],
    inheritAttrs: false
  }
}))

describe('StatCard', () => {
  const defaultProps = {
    label: 'Total Users',
    value: '1,234',
    icon: 'mdi:account-group'
  }

  const createWrapper = (props = {}) => {
    return mount(StatCard, {
      props: { ...defaultProps, ...props }
    })
  }

  describe('Required Props Rendering', () => {
    it('renders with required props only', () => {
      const wrapper = createWrapper()

      expect(wrapper.text()).toContain('Total Users')
      expect(wrapper.text()).toContain('1,234')
      expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
    })

    it('displays label with correct styling', () => {
      const wrapper = createWrapper()
      
      const labelElement = wrapper.find('p.text-sm.font-semibold.uppercase')
      expect(labelElement.exists()).toBe(true)
      expect(labelElement.text()).toBe('Total Users')
    })

    it('displays value with correct styling', () => {
      const wrapper = createWrapper()
      
      const valueElement = wrapper.find('p.text-3xl.font-bold')
      expect(valueElement.exists()).toBe(true)
      expect(valueElement.text()).toBe('1,234')
    })

    it('renders main icon with correct structure', () => {
      const wrapper = createWrapper()
      
      const mainIcon = wrapper.find('[data-testid="icon"]')
      expect(mainIcon.exists()).toBe(true)
    })
  })

  describe('Optional Props', () => {
    it('renders subtitle when provided', () => {
      const wrapper = createWrapper({
        subtitle: '↗ 12% from last month'
      })
      
      expect(wrapper.text()).toContain('↗ 12% from last month')
    })

    it('renders subtitle icon when provided', () => {
      const wrapper = createWrapper({
        subtitle: '↗ 12% from last month',
        subtitleIcon: 'mdi:trending-up'
      })
      
      // Should have multiple icons when subtitle icon is provided
      const icons = wrapper.findAll('[data-testid="icon"]')
      expect(icons.length).toBeGreaterThan(1)
    })

    it('does not render subtitle section when no subtitle or slot provided', () => {
      const wrapper = createWrapper()
      
      // Should not have subtitle content
      expect(wrapper.text()).not.toContain('from last month')
    })
  })

  describe('Slots', () => {
    it('renders subtitle slot content when provided', () => {
      const wrapper = mount(StatCard, {
        props: defaultProps,
        slots: {
          subtitle: '<span class="custom-subtitle">Custom subtitle content</span>'
        }
      })
      
      expect(wrapper.find('.custom-subtitle').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom subtitle content')
    })

    it('prioritizes subtitle slot over subtitle prop', () => {
      const wrapper = mount(StatCard, {
        props: {
          ...defaultProps,
          subtitle: 'Prop subtitle'
        },
        slots: {
          subtitle: '<span class="slot-subtitle">Slot subtitle</span>'
        }
      })
      
      expect(wrapper.text()).toContain('Slot subtitle')
      expect(wrapper.text()).not.toContain('Prop subtitle')
    })
  })

  describe('Variants and Styling', () => {
    it('renders card structure correctly', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('[data-testid="card"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="card-content"]').exists()).toBe(true)
    })

    it('applies variant styling correctly', () => {
      const wrapper = createWrapper({
        variant: 'primary'
      })
      
      const card = wrapper.find('[data-testid="card"]')
      expect(card.exists()).toBe(true)
    })

    it('renders with default styling', () => {
      const wrapper = createWrapper()
      
      const card = wrapper.find('[data-testid="card"]')
      expect(card.exists()).toBe(true)
    })
  })

  describe('Layout and Structure', () => {
    it('arranges content in correct layout structure', () => {
      const wrapper = createWrapper()
      
      // Check for main content container
      expect(wrapper.find('.flex.items-center.justify-between').exists()).toBe(true)
      
      // Check for statistics content area
      expect(wrapper.find('.space-y-2').exists()).toBe(true)
    })

    it('applies correct subtitle container styling', () => {
      const wrapper = createWrapper({
        subtitle: 'Test subtitle'
      })
      
      // Should render subtitle section
      expect(wrapper.text()).toContain('Test subtitle')
    })
  })

  describe('Value Types', () => {
    it('handles string value correctly', () => {
      const wrapper = createWrapper({
        value: 'Active'
      })
      
      expect(wrapper.text()).toContain('Active')
    })

    it('handles numeric value correctly', () => {
      const wrapper = createWrapper({
        value: 42
      })
      
      expect(wrapper.text()).toContain('42')
    })

    it('handles large numbers with formatting', () => {
      const wrapper = createWrapper({
        value: '1,234,567'
      })
      
      expect(wrapper.text()).toContain('1,234,567')
    })
  })

  describe('Icon Integration', () => {
    it('renders icon component with correct structure', () => {
      const wrapper = createWrapper()
      
      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.exists()).toBe(true)
    })

    it('handles different icon props', () => {
      const wrapper = createWrapper({
        icon: 'mdi:user'
      })
      
      const icon = wrapper.find('[data-testid="icon"]')
      expect(icon.exists()).toBe(true)
    })
  })
})