import { RadarChart as mockRadarChart, type RadarChartData, type RadarChartOptions } from '@/base_components/data-display/charts/radarChart'
import RadarChart from '@/base_components/data-display/charts/RadarChart.vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock D3 with comprehensive methods for RadarChart
const createMockNode = (): any => {
  const node = {
    append: vi.fn(() => node),
    attr: vi.fn(() => node),
    style: vi.fn(() => node),
    call: vi.fn(() => node),
    select: vi.fn(() => node),
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => node),
          insert: vi.fn(() => node)
        })),
        join: vi.fn(() => node)
      })),
      remove: vi.fn()
    })),
    text: vi.fn(() => node),
    each: vi.fn(() => node),
    transition: vi.fn(() => node),
    duration: vi.fn(() => node),
    on: vi.fn(() => node),
    node: vi.fn(() => ({ getComputedTextLength: () => 100 }))
  }
  return node
}

const mockSvgNode = createMockNode()

// Mock the RadarChart function first, before other mocks
vi.mock('@/base_components/data-display/charts/radarChart', () => ({
  RadarChart: vi.fn()
}))

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => mockSvgNode),
  scaleOrdinal: vi.fn(() => ({
    range: vi.fn(() => ({
      toString: () => '#008491'
    }))
  })),
  format: vi.fn(() => vi.fn()),
  scaleLinear: vi.fn(() => ({
    range: vi.fn(() => ({
      domain: vi.fn(() => vi.fn())
    }))
  })),
  range: vi.fn(() => [1, 2, 3, 4, 5, 6]),
  lineRadial: vi.fn(() => ({
    curve: vi.fn(() => ({
      radius: vi.fn(() => ({
        angle: vi.fn(() => vi.fn())
      }))
    }))
  })),
  curveLinearClosed: {},
  curveCardinalClosed: {}
}))

describe('RadarChart', () => {
  const mockData: RadarChartData = [
    {
      name: 'Dataset 1',
      axes: [
        { axis: 'Security', value: 30 },
        { axis: 'Performance', value: 25 },
        { axis: 'Maintainability', value: 20 },
        { axis: 'Reliability', value: 35 },
        { axis: 'Usability', value: 28 }
      ]
    },
    {
      name: 'Dataset 2',
      axes: [
        { axis: 'Security', value: 40 },
        { axis: 'Performance', value: 35 },
        { axis: 'Maintainability', value: 30 },
        { axis: 'Reliability', value: 25 },
        { axis: 'Usability', value: 32 }
      ]
    }
  ]

  const mockOptions: Partial<RadarChartOptions> = {
    levels: 5,
    maxValue: 50,
    labelFactor: 1.2,
    opacityArea: 0.4
  }

  const defaultProps = {
    data: mockData,
    options: mockOptions,
    id: 'test-radar-chart'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock DOM element for chart container
    const mockElement = {
      append: vi.fn(() => mockSvgNode),
      style: vi.fn(() => mockElement)
    }
    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as any)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.radarChart').exists()).toBe(true)
    })

    it('has correct DOM structure', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      const outerDiv = wrapper.find('div')
      expect(outerDiv.exists()).toBe(true)
      
      const chartDiv = wrapper.find('.radarChart')
      expect(chartDiv.exists()).toBe(true)
      expect(chartDiv.attributes('id')).toBe('test-radar-chart')
    })

    it('calls RadarChart function on mount', () => {
      mount(RadarChart, {
        props: defaultProps
      })

      expect(mockRadarChart).toHaveBeenCalledWith(
        '#test-radar-chart',
        mockData,
        expect.objectContaining({
          w: 640,
          h: 450,
          levels: 5,
          maxValue: 50,
          labelFactor: 1.2,
          opacityArea: 0.4
        })
      )
    })
  })

  describe('Data Handling', () => {
    it('accepts valid RadarChartData format', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toEqual(mockData)
      expect(wrapper.props().data).toHaveLength(2)
      expect(wrapper.props().data[0]!.axes).toHaveLength(5)
    })

    it('handles single dataset', () => {
      const singleData: RadarChartData = [
        {
          name: 'Single Dataset',
          axes: [
            { axis: 'Metric A', value: 10 },
            { axis: 'Metric B', value: 20 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: singleData
        }
      })

      expect(wrapper.props().data).toEqual(singleData)
      expect(wrapper.props().data).toHaveLength(1)
    })

    it('handles multiple datasets', () => {
      const multiData: RadarChartData = [
        {
          name: 'Dataset 1',
          axes: [{ axis: 'A', value: 5 }]
        },
        {
          name: 'Dataset 2',
          axes: [{ axis: 'A', value: 10 }]
        },
        {
          name: 'Dataset 3',
          axes: [{ axis: 'A', value: 15 }]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: multiData
        }
      })

      expect(wrapper.props().data).toHaveLength(3)
      expect(wrapper.props().data[2]!.name).toBe('Dataset 3')
    })

    it('handles data with zero values', () => {
      const zeroData: RadarChartData = [
        {
          name: 'Zero Dataset',
          axes: [
            { axis: 'Zero Metric', value: 0 },
            { axis: 'Positive Metric', value: 25 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: zeroData
        }
      })

      expect(wrapper.props().data[0]!.axes[0]!.value).toBe(0)
      expect(wrapper.props().data[0]!.axes[1]!.value).toBe(25)
    })

    it('handles data with large values', () => {
      const largeData: RadarChartData = [
        {
          name: 'Large Dataset',
          axes: [
            { axis: 'Large Metric', value: 999999 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: largeData
        }
      })

      expect(wrapper.props().data[0]!.axes[0]!.value).toBe(999999)
    })

    it('handles data with decimal values', () => {
      const decimalData: RadarChartData = [
        {
          name: 'Decimal Dataset',
          axes: [
            { axis: 'Decimal Metric', value: 33.33 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: decimalData
        }
      })

      expect(wrapper.props().data[0]!.axes[0]!.value).toBe(33.33)
    })

    it('handles axes with optional id property', () => {
      const idData: RadarChartData = [
        {
          name: 'ID Dataset',
          axes: [
            { axis: 'Metric', value: 20, id: 'metric-1' }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: idData
        }
      })

      expect(wrapper.props().data[0]!.axes[0]!.id).toBe('metric-1')
    })
  })

  describe('Configuration Options', () => {
    it('accepts partial RadarChartOptions', () => {
      const customOptions: Partial<RadarChartOptions> = {
        levels: 8,
        maxValue: 100,
        dotRadius: 6
      }

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options).toEqual(customOptions)
    })

    it('works with empty options object', () => {
      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          options: {}
        }
      })

      expect(wrapper.props().options).toEqual({})
    })

    it('accepts color scale configuration', () => {
      const customOptions: Partial<RadarChartOptions> = {
        opacityArea: 0.8,
        strokeWidth: 3,
        roundStrokes: true
      }

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.opacityArea).toBe(0.8)
      expect(wrapper.props().options.strokeWidth).toBe(3)
      expect(wrapper.props().options.roundStrokes).toBe(true)
    })

    it('accepts legend configuration', () => {
      const customOptions: Partial<RadarChartOptions> = {
        legend: {
          title: 'Custom Legend',
          translateX: 100,
          translateY: 50
        }
      }

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.legend).toEqual({
        title: 'Custom Legend',
        translateX: 100,
        translateY: 50
      })
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toBeDefined()
      expect(wrapper.props().options).toBeDefined()
      expect(wrapper.props().id).toBeDefined()
    })

    it('validates data prop structure', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      const data = wrapper.props().data
      expect(Array.isArray(data)).toBe(true)
      
      data.forEach((dataset: any) => {
        expect(dataset).toHaveProperty('name')
        expect(dataset).toHaveProperty('axes')
        expect(typeof dataset.name).toBe('string')
        expect(Array.isArray(dataset.axes)).toBe(true)
        
        dataset.axes.forEach((axis: any) => {
          expect(axis).toHaveProperty('axis')
          expect(axis).toHaveProperty('value')
          expect(typeof axis.axis).toBe('string')
          expect(typeof axis.value).toBe('number')
        })
      })
    })

    it('validates id prop is string', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      expect(typeof wrapper.props().id).toBe('string')
      expect(wrapper.props().id.length).toBeGreaterThan(0)
    })

    it('validates options prop is object', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      expect(typeof wrapper.props().options).toBe('object')
      expect(wrapper.props().options).not.toBeNull()
    })
  })

  describe('Accessibility', () => {
    it('has accessible structure', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      const container = wrapper.find('div')
      expect(container.exists()).toBe(true)
    })

    it('uses semantic chart container class', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      expect(wrapper.find('.radarChart').exists()).toBe(true)
    })

    it('has unique id for chart container', () => {
      const wrapper = mount(RadarChart, {
        props: defaultProps
      })

      const chartContainer = wrapper.find('.radarChart')
      expect(chartContainer.attributes('id')).toBe('test-radar-chart')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty data gracefully', () => {
      const emptyData: RadarChartData = []

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: emptyData
        }
      })

      expect(wrapper.props().data).toEqual([])
      expect(wrapper.exists()).toBe(true)
    })

    it('handles dataset with empty axes', () => {
      const emptyAxesData: RadarChartData = [
        {
          name: 'Empty Dataset',
          axes: []
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: emptyAxesData
        }
      })

      expect(wrapper.props().data[0]!.axes).toEqual([])
    })

    it('handles very long dataset names', () => {
      const longNameData: RadarChartData = [
        {
          name: 'Very Long Dataset Name That Might Cause Layout Issues In The Chart',
          axes: [
            { axis: 'Metric', value: 10 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: longNameData
        }
      })

      expect(wrapper.props().data[0]!.name).toBe('Very Long Dataset Name That Might Cause Layout Issues In The Chart')
    })

    it('handles very long axis names', () => {
      const longAxisData: RadarChartData = [
        {
          name: 'Dataset',
          axes: [
            { axis: 'Very Long Axis Name That Might Cause Layout Issues', value: 15 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: longAxisData
        }
      })

      expect(wrapper.props().data[0]!.axes[0]!.axis).toBe('Very Long Axis Name That Might Cause Layout Issues')
    })

    it('handles special characters in names', () => {
      const specialCharData: RadarChartData = [
        {
          name: 'Dataset@#$%',
          axes: [
            { axis: 'Metric!@#', value: 20 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: specialCharData
        }
      })

      expect(wrapper.props().data[0]!.name).toBe('Dataset@#$%')
      expect(wrapper.props().data[0]!.axes[0]!.axis).toBe('Metric!@#')
    })

    it('handles negative values gracefully', () => {
      const negativeData: RadarChartData = [
        {
          name: 'Negative Dataset',
          axes: [
            { axis: 'Negative Metric', value: -10 },
            { axis: 'Positive Metric', value: 20 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: negativeData
        }
      })

      expect(wrapper.props().data[0]!.axes[0]!.value).toBe(-10)
      expect(wrapper.props().data[0]!.axes[1]!.value).toBe(20)
    })

    it('handles extremely small decimal values', () => {
      const smallData: RadarChartData = [
        {
          name: 'Small Dataset',
          axes: [
            { axis: 'Tiny Metric', value: 0.000001 }
          ]
        }
      ]

      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          data: smallData
        }
      })

      expect(wrapper.props().data[0]!.axes[0]!.value).toBe(0.000001)
    })

    it('handles undefined id gracefully', () => {
      const wrapper = mount(RadarChart, {
        props: {
          ...defaultProps,
          id: undefined as any
        }
      })

      expect(wrapper.props().id).toBeUndefined()
    })
  })

  describe('Component Integration', () => {
    it('merges default config with provided options', () => {
      const customOptions: Partial<RadarChartOptions> = {
        levels: 10,
        maxValue: 200
      }

      mount(RadarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(mockRadarChart).toHaveBeenCalledWith(
        '#test-radar-chart',
        mockData,
        expect.objectContaining({
          w: 640,
          h: 450,
          levels: 10,
          maxValue: 200,
          margin: expect.any(Object),
          labelFactor: 1.25,
          wrapWidth: 60
        })
      )
    })

    it('uses default config when no options provided', () => {
      mount(RadarChart, {
        props: {
          data: mockData,
          options: {},
          id: 'test-radar'
        }
      })

      expect(mockRadarChart).toHaveBeenCalledWith(
        '#test-radar',
        mockData,
        expect.objectContaining({
          w: 640,
          h: 450,
          levels: 6,
          maxValue: 60,
          labelFactor: 1.25,
          roundStrokes: false
        })
      )
    })

    it('handles different chart sizes through options', () => {
      const sizeOptions: Partial<RadarChartOptions> = {
        w: 800,
        h: 600,
        margin: { top: 100, right: 100, bottom: 100, left: 100 }
      }

      mount(RadarChart, {
        props: {
          ...defaultProps,
          options: sizeOptions
        }
      })

      expect(mockRadarChart).toHaveBeenCalledWith(
        '#test-radar-chart',
        mockData,
        expect.objectContaining({
          w: 800,
          h: 600,
          margin: { top: 100, right: 100, bottom: 100, left: 100 }
        })
      )
    })
  })
})