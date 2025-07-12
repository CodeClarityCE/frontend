import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { render, screen } from '@testing-library/vue'
import StatCard from '@/base_components/ui/cards/StatCard.vue'
import { Card, CardContent } from '@/shadcn/ui/card'
import { Icon } from '@iconify/vue'

// Mock the Card components and Icon
const mockCard = { template: '<div class="card"><slot /></div>' }
const mockCardContent = { template: '<div class="card-content"><slot /></div>' }
const mockIcon = { template: '<span class="icon" />', props: ['icon'] }

describe('StatCard', () => {
  const defaultProps = {
    label: 'Total Users',
    value: '1,234',
    icon: 'mdi:account-group'
  }

  const globalComponents = {
    Card: mockCard,
    CardContent: mockCardContent,
    Icon: mockIcon
  }

  describe('Required Props Rendering', () => {
    it('renders with required props only', () => {
      const wrapper = mount(StatCard, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toContain('Total Users')
      expect(wrapper.text()).toContain('1,234')
      expect(wrapper.findComponent(mockIcon).exists()).toBe(true)
    })

    it('displays label with correct styling', () => {
      render(StatCard, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const label = screen.getByText('Total Users')
      expect(label).toBeInTheDocument()
      expect(label).toHaveClass('text-sm', 'font-semibold', 'uppercase', 'tracking-wide', 'text-theme-gray')
    })

    it('displays value with correct styling', () => {
      render(StatCard, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const value = screen.getByText('1,234')
      expect(value).toBeInTheDocument()
      expect(value).toHaveClass('text-3xl', 'font-bold', 'text-theme-black')
    })

    it('renders main icon with correct props', () => {
      const wrapper = mount(StatCard, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const iconComponents = wrapper.findAllComponents(mockIcon)
      const mainIcon = iconComponents.find(icon => 
        icon.attributes('icon') === 'mdi:account-group'
      )
      
      expect(mainIcon?.exists()).toBe(true)
      expect(mainIcon?.classes()).toContain('h-8')
      expect(mainIcon?.classes()).toContain('w-8')
      expect(mainIcon?.classes()).toContain('text-gray-600')
    })
  })

  describe('Optional Props', () => {
    it('renders subtitle when provided', () => {
      render(StatCard, {
        props: {
          ...defaultProps,
          subtitle: '↗ 12% this month'
        },
        global: {
          components: globalComponents
        }
      })

      expect(screen.getByText('↗ 12% this month')).toBeInTheDocument()
    })

    it('renders subtitle icon when provided', () => {
      const wrapper = mount(StatCard, {
        props: {
          ...defaultProps,
          subtitle: '↗ 12% this month',
          subtitleIcon: 'mdi:trending-up'
        },
        global: {
          components: globalComponents
        }
      })

      const iconComponents = wrapper.findAllComponents(mockIcon)
      const subtitleIcon = iconComponents.find(icon => 
        icon.attributes('icon') === 'mdi:trending-up'
      )
      
      expect(subtitleIcon?.exists()).toBe(true)
      expect(subtitleIcon?.classes()).toContain('h-3')
      expect(subtitleIcon?.classes()).toContain('w-3')
      expect(subtitleIcon?.classes()).toContain('text-gray-500')
    })

    it('does not render subtitle section when no subtitle or slot provided', () => {
      const wrapper = mount(StatCard, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const subtitleContainer = wrapper.find('.text-xs')
      expect(subtitleContainer.exists()).toBe(false)
    })
  })

  describe('Slots', () => {
    it('renders subtitle slot content when provided', () => {
      render(StatCard, {
        props: defaultProps,
        slots: {
          subtitle: '<strong>Custom subtitle content</strong>'
        },
        global: {
          components: globalComponents
        }
      })

      expect(screen.getByText('Custom subtitle content')).toBeInTheDocument()
    })

    it('prioritizes subtitle slot over subtitle prop', () => {
      render(StatCard, {
        props: {
          ...defaultProps,
          subtitle: 'Prop subtitle'
        },
        slots: {
          subtitle: 'Slot subtitle'
        },
        global: {
          components: globalComponents
        }
      })

      expect(screen.getByText('Slot subtitle')).toBeInTheDocument()
      expect(screen.queryByText('Prop subtitle')).not.toBeInTheDocument()
    })
  })

  describe('Variants and Styling', () => {
    it('applies default variant styling by default', () => {
      const wrapper = mount(StatCard, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const card = wrapper.findComponent(mockCard)
      expect(card.classes()).toContain('border-l-4')
      expect(card.classes()).toContain('border-l-theme-black')
    })

    it('applies primary variant styling', () => {
      const wrapper = mount(StatCard, {
        props: {
          ...defaultProps,
          variant: 'primary'
        },
        global: {
          components: globalComponents
        }
      })

      const card = wrapper.findComponent(mockCard)
      expect(card.classes()).toContain('border-l-4')
      expect(card.classes()).toContain('border-l-theme-primary')
    })

    it('applies danger variant styling', () => {
      const wrapper = mount(StatCard, {
        props: {
          ...defaultProps,
          variant: 'danger'
        },
        global: {
          components: globalComponents
        }
      })

      const card = wrapper.findComponent(mockCard)
      expect(card.classes()).toContain('border-l-4')
      expect(card.classes()).toContain('border-l-red-500')
    })

    it('applies success variant styling', () => {
      const wrapper = mount(StatCard, {
        props: {
          ...defaultProps,
          variant: 'success'
        },
        global: {
          components: globalComponents
        }
      })

      const card = wrapper.findComponent(mockCard)
      expect(card.classes()).toContain('border-l-4')
      expect(card.classes()).toContain('border-l-theme-primary')
    })

    it('applies hover and shadow effects', () => {
      const wrapper = mount(StatCard, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const card = wrapper.findComponent(mockCard)
      expect(card.classes()).toContain('border')
      expect(card.classes()).toContain('shadow-sm')
      expect(card.classes()).toContain('hover:shadow-md')
      expect(card.classes()).toContain('transition-shadow')
    })
  })

  describe('Layout and Structure', () => {
    it('arranges content in correct layout structure', () => {
      const wrapper = mount(StatCard, {
        props: {
          ...defaultProps,
          subtitle: 'Test subtitle'
        },
        global: {
          components: globalComponents
        }
      })

      // Check main flex container exists
      const mainContainer = wrapper.find('.flex.items-center.justify-between')
      expect(mainContainer.exists()).toBe(true)

      // Check statistics content container
      const statsContainer = wrapper.find('.space-y-2')
      expect(statsContainer.exists()).toBe(true)

      // Check icon container styling
      const iconContainer = wrapper.find('.p-3.rounded-full.bg-gray-100')
      expect(iconContainer.exists()).toBe(true)
    })

    it('applies correct subtitle container styling', () => {
      const wrapper = mount(StatCard, {
        props: {
          ...defaultProps,
          subtitle: 'Test subtitle',
          subtitleIcon: 'mdi:test'
        },
        global: {
          components: globalComponents
        }
      })

      const subtitleContainer = wrapper.find('.flex.items-center.gap-1.text-xs')
      expect(subtitleContainer.exists()).toBe(true)
      
      const subtitleText = wrapper.find('.font-medium.text-theme-gray')
      expect(subtitleText.exists()).toBe(true)
    })
  })

  describe('Value Types', () => {
    it('handles string value correctly', () => {
      render(StatCard, {
        props: {
          ...defaultProps,
          value: 'Active'
        },
        global: {
          components: globalComponents
        }
      })

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('handles numeric value correctly', () => {
      render(StatCard, {
        props: {
          ...defaultProps,
          value: 42
        },
        global: {
          components: globalComponents
        }
      })

      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('handles large numbers with formatting', () => {
      render(StatCard, {
        props: {
          ...defaultProps,
          value: '1,234,567'
        },
        global: {
          components: globalComponents
        }
      })

      expect(screen.getByText('1,234,567')).toBeInTheDocument()
    })
  })
})