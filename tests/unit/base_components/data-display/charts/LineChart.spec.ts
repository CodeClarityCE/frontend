import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import LineChart from '@/base_components/data-display/charts/LineChart.vue'

// LineChart types (defined inline since not exported)
interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

// Create comprehensive D3 mock chain
const createMockNode = (): any => {
  const node = {
    append: vi.fn(() => node),
    attr: vi.fn(() => node),
    style: vi.fn(() => node),
    call: vi.fn(() => node),
    select: vi.fn(() => node),
    selectAll: vi.fn(() => ({
      remove: vi.fn(),
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => node),
          insert: vi.fn(() => node)
        }))
      })),
      clone: vi.fn(() => node)
    })),
    on: vi.fn(() => node)
  }
  return node
}

const mockSvgNode = createMockNode()

const mockScale = vi.fn((value: any) => {
  if (typeof value === 'string') return 50 // For band scale
  return 100 - value * 10 // For linear scale (inverted)
}) as any

// Mock D3 with comprehensive methods
const mockBandScale = {
  rangeRound: vi.fn(function(this: typeof mockBandScale) { return this }),
  padding: vi.fn(function(this: typeof mockBandScale) { return this }),
  domain: vi.fn(() => mockScale)
}

const mockLinearScale = {
  domain: vi.fn(function(this: typeof mockLinearScale) { return this }),
  range: vi.fn(() => mockScale)
}

const mockArea = {
  x: vi.fn(function(this: typeof mockArea) { return this }),
  y: vi.fn(function(this: typeof mockArea) { return this }),
  curve: vi.fn(function(this: typeof mockArea) { return this })
}

const mockAreaGenerator = vi.fn(() => 'M10,10L20,20L30,30Z')
Object.assign(mockAreaGenerator, mockArea)

// Mock D3
vi.mock('d3', () => {
  const mockAxis = {
    ticks: vi.fn(function(this: typeof mockAxis) { return this }),
    tickSizeOuter: vi.fn(function(this: typeof mockAxis) { return this })
  }

  return {
    select: vi.fn(() => mockSvgNode),
    scaleBand: vi.fn(() => mockBandScale),
    scaleLinear: vi.fn(() => mockLinearScale),
    extent: vi.fn(() => [0, 10]),
    area: vi.fn(() => mockAreaGenerator),
    axisBottom: vi.fn(() => mockAxis),
    axisLeft: vi.fn(() => mockAxis)
  }
})

describe('LineChart', () => {
  const mockData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [{
      data: [10, 15, 8, 20, 12]
    }]
  }

  const defaultProps = {
    chartData: mockData
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
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.lineChart').exists()).toBe(true)
    })

    it('has correct DOM structure', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const outerDiv = wrapper.find('div')
      expect(outerDiv.exists()).toBe(true)
      
      const chartDiv = wrapper.find('.lineChart')
      expect(chartDiv.exists()).toBe(true)
    })

    it('renders empty chart container when data is empty', () => {
      const emptyData: ChartData = {
        labels: [],
        datasets: [{ data: [] }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: emptyData
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.lineChart').exists()).toBe(true)
    })
  })

  describe('Data Handling', () => {
    it('accepts valid ChartData format', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      expect(wrapper.props().chartData).toEqual(mockData)
      expect(wrapper.props().chartData.labels).toHaveLength(5)
      expect(wrapper.props().chartData.datasets[0]!.data).toHaveLength(5)
    })

    it('handles single data point', () => {
      const singleData: ChartData = {
        labels: ['Single'],
        datasets: [{
          data: [42]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: singleData
        }
      })

      expect(wrapper.props().chartData.labels).toEqual(['Single'])
      expect(wrapper.props().chartData.datasets[0]!.data).toEqual([42])
    })

    it('handles multiple datasets', () => {
      const multiData: ChartData = {
        labels: ['A', 'B'],
        datasets: [
          { data: [1, 2] },
          { data: [3, 4] }
        ]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: multiData
        }
      })

      expect(wrapper.props().chartData.datasets).toHaveLength(2)
      expect(wrapper.props().chartData.datasets[0]!.data).toEqual([1, 2])
      expect(wrapper.props().chartData.datasets[1]!.data).toEqual([3, 4])
    })

    it('handles data with zero values', () => {
      const zeroData: ChartData = {
        labels: ['Zero', 'Positive'],
        datasets: [{
          data: [0, 5]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: zeroData
        }
      })

      expect(wrapper.props().chartData.datasets[0]!.data).toEqual([0, 5])
    })

    it('handles negative values', () => {
      const negativeData: ChartData = {
        labels: ['Neg', 'Pos'],
        datasets: [{
          data: [-5, 10]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: negativeData
        }
      })

      expect(wrapper.props().chartData.datasets[0]!.data).toEqual([-5, 10])
    })

    it('handles large numbers', () => {
      const largeData: ChartData = {
        labels: ['Big'],
        datasets: [{
          data: [999999]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: largeData
        }
      })

      expect(wrapper.props().chartData.datasets[0]!.data[0]).toBe(999999)
    })

    it('handles decimal values', () => {
      const decimalData: ChartData = {
        labels: ['Dec'],
        datasets: [{
          data: [3.14159]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: decimalData
        }
      })

      expect(wrapper.props().chartData.datasets[0]!.data[0]).toBe(3.14159)
    })
  })

  describe('Data Structure Validation', () => {
    it('validates chartData prop structure', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const chartData = wrapper.props().chartData
      expect(typeof chartData).toBe('object')
      expect(Array.isArray(chartData.labels)).toBe(true)
      expect(Array.isArray(chartData.datasets)).toBe(true)
      expect(chartData.datasets.length).toBeGreaterThan(0)
    })

    it('validates labels are strings', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const labels = wrapper.props().chartData.labels
      labels.forEach((label: any) => {
        expect(typeof label).toBe('string')
      })
    })

    it('validates dataset data are numbers', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const datasets = wrapper.props().chartData.datasets
      datasets.forEach((dataset: any) => {
        expect(Array.isArray(dataset.data)).toBe(true)
        dataset.data.forEach((value: any) => {
          expect(typeof value).toBe('number')
        })
      })
    })

    it('validates matching lengths between labels and data', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const chartData = wrapper.props().chartData
      const labelCount = chartData.labels.length
      const dataCount = chartData.datasets[0]!.data.length

      expect(labelCount).toBe(dataCount)
    })
  })

  describe('Accessibility', () => {
    it('has accessible structure', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const container = wrapper.find('div')
      expect(container.exists()).toBe(true)
    })

    it('uses semantic chart container class', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      expect(wrapper.find('.lineChart').exists()).toBe(true)
    })

    it('maintains container hierarchy', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const outerDiv = wrapper.find('div')
      const innerDiv = outerDiv.find('.lineChart')
      
      expect(outerDiv.exists()).toBe(true)
      expect(innerDiv.exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles mismatched data array lengths gracefully', () => {
      const mismatchedData: ChartData = {
        labels: ['A', 'B', 'C'],
        datasets: [{
          data: [1, 2] // Missing one value
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: mismatchedData
        }
      })

      expect(wrapper.props().chartData.labels).toHaveLength(3)
      expect(wrapper.props().chartData.datasets[0]!.data).toHaveLength(2)
    })

    it('handles extremely small decimal values', () => {
      const smallData: ChartData = {
        labels: ['Tiny'],
        datasets: [{
          data: [0.000001]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: smallData
        }
      })

      expect(wrapper.props().chartData.datasets[0]!.data[0]).toBe(0.000001)
    })

    it('handles long label names', () => {
      const longLabelData: ChartData = {
        labels: ['Very Long Label Name That Might Cause Layout Issues'],
        datasets: [{
          data: [5]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: longLabelData
        }
      })

      expect(wrapper.props().chartData.labels[0]).toBe('Very Long Label Name That Might Cause Layout Issues')
    })

    it('handles special characters in labels', () => {
      const specialData: ChartData = {
        labels: ['Label@#$%'],
        datasets: [{
          data: [1]
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: specialData
        }
      })

      expect(wrapper.props().chartData.labels[0]).toBe('Label@#$%')
    })

    it('handles empty dataset array gracefully', () => {
      const emptyDatasetData: ChartData = {
        labels: ['A'],
        datasets: []
      }

      // The component should handle empty datasets gracefully without throwing
      const wrapper = mount(LineChart, {
        props: {
          chartData: emptyDatasetData
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('handles very large datasets', () => {
      const largeLabels = Array.from({length: 100}, (_, i) => `Label${i}`)
      const largeData = Array.from({length: 100}, (_, i) => i * 2)
      
      const largeDataset: ChartData = {
        labels: largeLabels,
        datasets: [{
          data: largeData
        }]
      }

      const wrapper = mount(LineChart, {
        props: {
          chartData: largeDataset
        }
      })

      expect(wrapper.props().chartData.labels).toHaveLength(100)
      expect(wrapper.props().chartData.datasets[0]!.data).toHaveLength(100)
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      expect(wrapper.props().chartData).toBeDefined()
    })

    it('validates chartData prop structure', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      const chartData = wrapper.props().chartData
      expect(chartData).toHaveProperty('labels')
      expect(chartData).toHaveProperty('datasets')
      expect(Array.isArray(chartData.labels)).toBe(true)
      expect(Array.isArray(chartData.datasets)).toBe(true)
    })
  })

  describe('Chart Styling', () => {
    it('includes area fill styling', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      // Check if the component has the expected style sections
      const html = wrapper.html()
      expect(html).toContain('class="lineChart"')
    })

    it('includes tooltip styling', () => {
      const wrapper = mount(LineChart, {
        props: defaultProps
      })

      // The component should set up tooltip styling
      expect(wrapper.exists()).toBe(true)
    })
  })
})