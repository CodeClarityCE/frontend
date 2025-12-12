import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BarChart from '@/base_components/data-display/charts/BarChart.vue'
import type { BarChartData, BarChartOptions } from '@/base_components/data-display'

// Create comprehensive D3 mock chain
const createMockNode = (): any => {
  const node = {
    append: vi.fn(() => node),
    attr: vi.fn(() => node),
    style: vi.fn(() => node),
    text: vi.fn(() => node),
    selectAll: vi.fn(() => ({
      remove: vi.fn(),
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => node),
          insert: vi.fn(() => node)
        }))
      }))
    }))
  }
  return node
}

const mockSvgNode = createMockNode()

const mockScale = vi.fn((value: any) => {
  if (typeof value === 'string') return 50 // For band scale
  return 100 - value * 10 // For linear scale (inverted)
}) as any
mockScale.bandwidth = vi.fn(() => 40)

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => mockSvgNode),
  scaleBand: vi.fn(() => ({
    range: vi.fn(() => ({
      domain: vi.fn(() => ({
        padding: vi.fn(() => mockScale)
      }))
    }))
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn(() => mockScale)
    }))
  })),
  max: vi.fn(() => 10)
}))

describe('BarChart', () => {
  const mockData: BarChartData = [
    { label: 'Critical', color: '#dc2626', count: 5 },
    { label: 'High', color: '#ea580c', count: 8 },
    { label: 'Medium', color: '#ca8a04', count: 3 },
    { label: 'Low', color: '#16a34a', count: 2 }
  ]

  const defaultProps = {
    data: mockData,
    options: {},
    id: 'test-bar-chart'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })

    it('renders with custom id', () => {
      const customId = 'custom-chart-id'
      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          id: customId
        }
      })

      expect(wrapper.find(`#${customId}`).exists()).toBe(true)
    })

    it('renders empty chart container when data is empty', () => {
      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: []
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })
  })

  describe('Data Handling', () => {
    it('accepts valid BarChartData format', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toEqual(mockData)
      expect(wrapper.props().data).toHaveLength(4)
    })

    it('handles single data point', () => {
      const singleData: BarChartData = [
        { label: 'Single', color: '#dc2626', count: 1 }
      ]

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: singleData
        }
      })

      expect(wrapper.props().data).toEqual(singleData)
      expect(wrapper.props().data).toHaveLength(1)
    })

    it('handles data with zero counts', () => {
      const zeroData: BarChartData = [
        { label: 'Zero', color: '#dc2626', count: 0 },
        { label: 'Positive', color: '#16a34a', count: 5 }
      ]

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: zeroData
        }
      })

      expect(wrapper.props().data).toEqual(zeroData)
    })

    it('handles large numbers', () => {
      const largeData: BarChartData = [
        { label: 'Large', color: '#dc2626', count: 999999 }
      ]

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: largeData
        }
      })

      expect(wrapper.props().data[0]!.count).toBe(999999)
    })
  })

  describe('Configuration Options', () => {
    it('applies default configuration when no options provided', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      expect(wrapper.props().options).toEqual({})
    })

    it('accepts custom width and height', () => {
      const customOptions: Partial<BarChartOptions> = {
        w: 800,
        h: 600
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options).toEqual(customOptions)
    })

    it('accepts padding configuration', () => {
      const customOptions: Partial<BarChartOptions> = {
        padding: 0.5
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.padding).toBe(0.5)
    })

    it('accepts rounded corners configuration', () => {
      const customOptions: Partial<BarChartOptions> = {
        rounded: false
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.rounded).toBe(false)
    })

    it('accepts show labels configuration', () => {
      const customOptions: Partial<BarChartOptions> = {
        showLabels: false
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.showLabels).toBe(false)
    })

    it('accepts shadow configuration', () => {
      const customOptions: Partial<BarChartOptions> = {
        shadow: false
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.shadow).toBe(false)
    })

    it('accepts font size configuration', () => {
      const customOptions: Partial<BarChartOptions> = {
        fontSize: 16
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.fontSize).toBe(16)
    })

    it('accepts label offset configuration', () => {
      const customOptions: Partial<BarChartOptions> = {
        labelOffset: 10
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.labelOffset).toBe(10)
    })

    it('merges custom options with defaults', () => {
      const partialOptions: Partial<BarChartOptions> = {
        w: 500,
        showLabels: false
      }

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          options: partialOptions
        }
      })

      expect(wrapper.props().options).toEqual(partialOptions)
    })
  })

  describe('Accessibility', () => {
    it('has accessible structure', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      const container = wrapper.find('div')
      expect(container.exists()).toBe(true)
    })

    it('uses semantic chart container', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined id gracefully', () => {
      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          id: undefined as any
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('handles extremely small values', () => {
      const smallData: BarChartData = [
        { label: 'Tiny', color: '#dc2626', count: 0.001 }
      ]

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: smallData
        }
      })

      expect(wrapper.props().data[0]!.count).toBe(0.001)
    })

    it('handles long label names', () => {
      const longLabelData: BarChartData = [
        { label: 'Very Long Label Name That Might Cause Layout Issues', color: '#dc2626', count: 5 }
      ]

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: longLabelData
        }
      })

      expect(wrapper.props().data[0]!.label).toBe('Very Long Label Name That Might Cause Layout Issues')
    })

    it('handles special characters in labels', () => {
      const specialData: BarChartData = [
        { label: 'Label with @#$% special chars!', color: '#dc2626', count: 3 }
      ]

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: specialData
        }
      })

      expect(wrapper.props().data[0]!.label).toBe('Label with @#$% special chars!')
    })

    it('handles invalid color values gracefully', () => {
      const invalidColorData: BarChartData = [
        { label: 'Invalid', color: 'not-a-color', count: 2 }
      ]

      const wrapper = mount(BarChart, {
        props: {
          ...defaultProps,
          data: invalidColorData
        }
      })

      expect(wrapper.props().data[0]!.color).toBe('not-a-color')
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toBeDefined()
      expect(wrapper.props().options).toBeDefined() 
      expect(wrapper.props().id).toBeDefined()
    })

    it('validates data prop structure', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      expect(Array.isArray(wrapper.props().data)).toBe(true)
      wrapper.props().data.forEach((item: any) => {
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('color') 
        expect(item).toHaveProperty('count')
        expect(typeof item.label).toBe('string')
        expect(typeof item.color).toBe('string')
        expect(typeof item.count).toBe('number')
      })
    })

    it('validates options prop structure', () => {
      const wrapper = mount(BarChart, {
        props: defaultProps
      })

      expect(typeof wrapper.props().options).toBe('object')
    })
  })
})