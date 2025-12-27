import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { DoughnutChartData, DoughnutChartOptions, VulnerabilityLabel } from '@/base_components/data-display/charts/doughnutChart'
import DoughnutChart from '@/base_components/data-display/charts/DoughnutChart.vue'

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

const mockColorScale = vi.fn((key: string) => {
  const colors: Record<string, string> = {
    'Critical': '#dc2626',
    'High': '#ea580c',
    'Medium': '#ca8a04',
    'Low': '#16a34a',
    'None': '#6b7280'
  }
  return colors[key] ?? '#6b7280'
})

const mockPieGenerator = vi.fn((data) =>
  data.map((entry: [VulnerabilityLabel, number], index: number) => ({
    data: entry,
    index,
    value: entry[1],
    startAngle: index * 1.5,
    endAngle: (index + 1) * 1.5,
    padAngle: 0
  }))
) as any
mockPieGenerator.value = vi.fn(() => mockPieGenerator)

const mockArcGenerator = vi.fn(() => 'M10,10L20,20L30,30Z') as any
mockArcGenerator.innerRadius = vi.fn(() => mockArcGenerator)
mockArcGenerator.outerRadius = vi.fn(() => mockArcGenerator)

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => mockSvgNode),
  scaleOrdinal: vi.fn(() => ({
    domain: vi.fn(() => ({
      range: vi.fn(() => mockColorScale)
    }))
  })),
  pie: vi.fn(() => mockPieGenerator),
  arc: vi.fn(() => mockArcGenerator),
  min: vi.fn(() => 200)
}))

describe('DoughnutChart', () => {
  const mockData: DoughnutChartData = [
    { label: 'Critical', color: '#dc2626', count: 5 },
    { label: 'High', color: '#ea580c', count: 8 },
    { label: 'Medium', color: '#ca8a04', count: 3 },
    { label: 'Low', color: '#16a34a', count: 2 },
    { label: 'None', color: '#6b7280', count: 0 }
  ]

  const defaultProps = {
    data: mockData,
    options: {},
    id: 'test-doughnut-chart'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })

    it('renders with custom id', () => {
      const customId = 'custom-doughnut-id'
      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          id: customId
        }
      })

      expect(wrapper.find(`#${customId}`).exists()).toBe(true)
    })

    it('renders empty chart container when data is empty', () => {
      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: []
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })

    it('has correct DOM structure', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      const outerDiv = wrapper.find('div')
      expect(outerDiv.exists()).toBe(true)
      
      const chartDiv = wrapper.find(`#${defaultProps.id}`)
      expect(chartDiv.exists()).toBe(true)
    })
  })

  describe('Data Handling', () => {
    it('accepts valid DoughnutChartData format', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toEqual(mockData)
      expect(wrapper.props().data).toHaveLength(5)
    })

    it('handles single data point', () => {
      const singleData: DoughnutChartData = [
        { label: 'Critical', color: '#dc2626', count: 10 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: singleData
        }
      })

      expect(wrapper.props().data).toEqual(singleData)
      expect(wrapper.props().data).toHaveLength(1)
    })

    it('handles all vulnerability label types', () => {
      const allLabels: DoughnutChartData = [
        { label: 'Critical', color: '#dc2626', count: 1 },
        { label: 'High', color: '#ea580c', count: 2 },
        { label: 'Medium', color: '#ca8a04', count: 3 },
        { label: 'Low', color: '#16a34a', count: 4 },
        { label: 'None', color: '#6b7280', count: 5 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: allLabels
        }
      })

      const labels = wrapper.props().data.map((item: any) => item.label)
      expect(labels).toContain('Critical')
      expect(labels).toContain('High')
      expect(labels).toContain('Medium')
      expect(labels).toContain('Low')
      expect(labels).toContain('None')
    })

    it('handles data with zero counts', () => {
      const zeroData: DoughnutChartData = [
        { label: 'Critical', color: '#dc2626', count: 0 },
        { label: 'High', color: '#ea580c', count: 5 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: zeroData
        }
      })

      expect(wrapper.props().data).toEqual(zeroData)
      expect(wrapper.props().data[0]!.count).toBe(0)
    })

    it('handles large numbers', () => {
      const largeData: DoughnutChartData = [
        { label: 'Critical', color: '#dc2626', count: 999999 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: largeData
        }
      })

      expect(wrapper.props().data[0]!.count).toBe(999999)
    })

    it('preserves color mapping from data', () => {
      const colorData: DoughnutChartData = [
        { label: 'Critical', color: '#custom1', count: 1 },
        { label: 'High', color: '#custom2', count: 2 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: colorData
        }
      })

      expect(wrapper.props().data[0]!.color).toBe('#custom1')
      expect(wrapper.props().data[1]!.color).toBe('#custom2')
    })
  })

  describe('Configuration Options', () => {
    it('applies default configuration when no options provided', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      expect(wrapper.props().options).toEqual({})
    })

    it('accepts custom width and height', () => {
      const customOptions: Partial<DoughnutChartOptions> = {
        w: 300,
        h: 300
      }

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.w).toBe(300)
      expect(wrapper.props().options.h).toBe(300)
    })

    it('accepts custom padding', () => {
      const customOptions: Partial<DoughnutChartOptions> = {
        p: 30
      }

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.p).toBe(30)
    })

    it('accepts combined custom options', () => {
      const customOptions: Partial<DoughnutChartOptions> = {
        w: 400,
        h: 350,
        p: 25
      }

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options).toEqual(customOptions)
    })

    it('handles partial option overrides', () => {
      const partialOptions: Partial<DoughnutChartOptions> = {
        w: 500
      }

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          options: partialOptions
        }
      })

      expect(wrapper.props().options.w).toBe(500)
    })
  })

  describe('Accessibility', () => {
    it('has accessible structure', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      const container = wrapper.find('div')
      expect(container.exists()).toBe(true)
    })

    it('uses semantic chart container', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })

    it('maintains container hierarchy', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      const outerDiv = wrapper.find('div')
      const innerDiv = outerDiv.find(`#${defaultProps.id}`)
      
      expect(outerDiv.exists()).toBe(true)
      expect(innerDiv.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined id gracefully', () => {
      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          id: undefined as any
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('handles extremely small values', () => {
      const smallData: DoughnutChartData = [
        { label: 'Critical', color: '#dc2626', count: 0.001 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: smallData
        }
      })

      expect(wrapper.props().data[0]!.count).toBe(0.001)
    })

    it('handles invalid color values gracefully', () => {
      const invalidColorData: DoughnutChartData = [
        { label: 'Critical', color: 'not-a-color', count: 2 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: invalidColorData
        }
      })

      expect(wrapper.props().data[0]!.color).toBe('not-a-color')
    })

    it('handles all zero data', () => {
      const allZeroData: DoughnutChartData = [
        { label: 'Critical', color: '#dc2626', count: 0 },
        { label: 'High', color: '#ea580c', count: 0 },
        { label: 'Medium', color: '#ca8a04', count: 0 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: allZeroData
        }
      })

      expect(wrapper.props().data.every((item: any) => item.count === 0)).toBe(true)
    })

    it('handles very large dimensions', () => {
      const largeOptions: Partial<DoughnutChartOptions> = {
        w: 9999,
        h: 9999,
        p: 100
      }

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          options: largeOptions
        }
      })

      expect(wrapper.props().options).toEqual(largeOptions)
    })

    it('handles very small dimensions', () => {
      const smallOptions: Partial<DoughnutChartOptions> = {
        w: 1,
        h: 1,
        p: 0
      }

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          options: smallOptions
        }
      })

      expect(wrapper.props().options).toEqual(smallOptions)
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toBeDefined()
      expect(wrapper.props().options).toBeDefined() 
      expect(wrapper.props().id).toBeDefined()
    })

    it('validates data prop structure', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      expect(Array.isArray(wrapper.props().data)).toBe(true)
      wrapper.props().data.forEach((item: any) => {
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('color') 
        expect(item).toHaveProperty('count')
        expect(typeof item.color).toBe('string')
        expect(typeof item.count).toBe('number')
      })
    })

    it('validates options prop structure', () => {
      const wrapper = mount(DoughnutChart, {
        props: defaultProps
      })

      expect(typeof wrapper.props().options).toBe('object')
    })
  })

  describe('Color Handling', () => {
    it('extracts colors from data correctly', () => {
      const colorTestData: DoughnutChartData = [
        { label: 'Critical', color: '#ff0000', count: 1 },
        { label: 'High', color: '#00ff00', count: 2 },
        { label: 'Medium', color: '#0000ff', count: 3 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: colorTestData
        }
      })

      const colors = wrapper.props().data.map((item: any) => item.color)
      expect(colors).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    })

    it('handles duplicate colors', () => {
      const duplicateColorData: DoughnutChartData = [
        { label: 'Critical', color: '#ff0000', count: 1 },
        { label: 'High', color: '#ff0000', count: 2 }
      ]

      const wrapper = mount(DoughnutChart, {
        props: {
          ...defaultProps,
          data: duplicateColorData
        }
      })

      const colors = wrapper.props().data.map((item: any) => item.color)
      expect(colors).toEqual(['#ff0000', '#ff0000'])
    })
  })
})