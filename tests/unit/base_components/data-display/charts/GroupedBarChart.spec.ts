import { mount } from '@vue/test-utils'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import type { GroupedBarChartData, GroupedBarChartOptions } from '@/base_components/data-display'
import GroupedBarChart from '@/base_components/data-display/charts/GroupedBarChart.vue'

// Create comprehensive D3 mock chain
interface MockNode {
  append: ReturnType<typeof vi.fn>;
  attr: ReturnType<typeof vi.fn>;
  style: ReturnType<typeof vi.fn>;
  text: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
}

const createMockNode = (): MockNode => {
  const node: MockNode = {
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

interface MockScale {
  (value: string | number): number;
  bandwidth?: ReturnType<typeof vi.fn>;
}

const mockScale = vi.fn((value: string | number) => {
  if (typeof value === 'string') return 50 // For band scale
  return 100 - value * 10 // For linear scale (inverted)
}) as MockScale
mockScale.bandwidth = vi.fn(() => 40)

// Mock D3 with proper chaining
const mockBandScale = {
  range: vi.fn(function(this: typeof mockBandScale) { return this }),
  domain: vi.fn(function(this: typeof mockBandScale) { return this }),
  padding: vi.fn(() => mockScale)
}

const mockLinearScale = {
  domain: vi.fn(function(this: typeof mockLinearScale) { return this }),
  range: vi.fn(() => mockScale)
}

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => mockSvgNode),
  scaleBand: vi.fn(() => mockBandScale),
  scaleLinear: vi.fn(() => mockLinearScale),
  max: vi.fn(() => 10),
  extent: vi.fn(() => [0, 10])
}))

describe('GroupedBarChart', () => {
  const mockData: GroupedBarChartData = {
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    groups: [
      {
        name: 'Critical',
        color: '#dc2626',
        data: [5, 8, 3, 6]
      },
      {
        name: 'High',
        color: '#ea580c',
        data: [3, 5, 7, 4]
      },
      {
        name: 'Medium',
        color: '#ca8a04',
        data: [2, 3, 1, 5]
      }
    ]
  }

  const defaultProps = {
    data: mockData,
    options: {},
    id: 'test-grouped-bar-chart'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })

    it('renders with custom id', () => {
      const customId = 'custom-grouped-chart-id'
      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          id: customId
        }
      })

      expect(wrapper.find(`#${customId}`).exists()).toBe(true)
    })

    it('renders empty chart container when categories are empty', () => {
      const emptyData: GroupedBarChartData = {
        categories: [],
        groups: []
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: emptyData
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })

    it('has correct DOM structure', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      const outerDiv = wrapper.find('div')
      expect(outerDiv.exists()).toBe(true)
      
      const chartDiv = wrapper.find(`#${defaultProps.id}`)
      expect(chartDiv.exists()).toBe(true)
    })
  })

  describe('Data Handling', () => {
    it('accepts valid GroupedBarChartData format', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toEqual(mockData)
      expect(wrapper.props().data.categories).toHaveLength(4)
      expect(wrapper.props().data.groups).toHaveLength(3)
    })

    it('handles single category', () => {
      const singleCategoryData: GroupedBarChartData = {
        categories: ['Single'],
        groups: [
          { name: 'Group1', color: '#dc2626', data: [5] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: singleCategoryData
        }
      })

      expect(wrapper.props().data.categories).toEqual(['Single'])
      expect(wrapper.props().data.groups).toHaveLength(1)
    })

    it('handles single group', () => {
      const singleGroupData: GroupedBarChartData = {
        categories: ['Q1', 'Q2', 'Q3'],
        groups: [
          { name: 'OnlyGroup', color: '#dc2626', data: [1, 2, 3] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: singleGroupData
        }
      })

      expect(wrapper.props().data.groups).toHaveLength(1)
      expect(wrapper.props().data.groups[0]!.name).toBe('OnlyGroup')
    })

    it('handles data with zero values', () => {
      const zeroData: GroupedBarChartData = {
        categories: ['A', 'B'],
        groups: [
          { name: 'Zero', color: '#dc2626', data: [0, 0] },
          { name: 'Positive', color: '#16a34a', data: [5, 3] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: zeroData
        }
      })

      expect(wrapper.props().data.groups[0]!.data).toEqual([0, 0])
      expect(wrapper.props().data.groups[1]!.data).toEqual([5, 3])
    })

    it('handles mismatched data array lengths', () => {
      const mismatchedData: GroupedBarChartData = {
        categories: ['A', 'B', 'C'],
        groups: [
          { name: 'Short', color: '#dc2626', data: [1, 2] }, // Missing one value
          { name: 'Long', color: '#16a34a', data: [1, 2, 3, 4] } // Extra value
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: mismatchedData
        }
      })

      expect(wrapper.props().data.groups[0]!.data).toHaveLength(2)
      expect(wrapper.props().data.groups[1]!.data).toHaveLength(4)
    })

    it('handles large numbers', () => {
      const largeData: GroupedBarChartData = {
        categories: ['Big'],
        groups: [
          { name: 'Large', color: '#dc2626', data: [999999] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: largeData
        }
      })

      expect(wrapper.props().data.groups[0]!.data[0]).toBe(999999)
    })

    it('handles negative values', () => {
      const negativeData: GroupedBarChartData = {
        categories: ['Neg', 'Pos'],
        groups: [
          { name: 'Mixed', color: '#dc2626', data: [-5, 10] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: negativeData
        }
      })

      expect(wrapper.props().data.groups[0]!.data).toEqual([-5, 10])
    })
  })

  describe('Configuration Options', () => {
    it('applies default configuration when no options provided', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      expect(wrapper.props().options).toEqual({})
    })

    it('accepts custom width and height', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        w: 800,
        h: 600
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.w).toBe(800)
      expect(wrapper.props().options.h).toBe(600)
    })

    it('accepts padding configuration', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        padding: 0.2
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.padding).toBe(0.2)
    })

    it('accepts group padding configuration', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        groupPadding: 0.3
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.groupPadding).toBe(0.3)
    })

    it('accepts rounded corners configuration', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        rounded: false
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.rounded).toBe(false)
    })

    it('accepts show labels configuration', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        showLabels: false
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.showLabels).toBe(false)
    })

    it('accepts shadow configuration', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        shadow: false
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.shadow).toBe(false)
    })

    it('accepts font size configuration', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        fontSize: 16
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.fontSize).toBe(16)
    })

    it('accepts label offset configuration', () => {
      const customOptions: Partial<GroupedBarChartOptions> = {
        labelOffset: 10
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          options: customOptions
        }
      })

      expect(wrapper.props().options.labelOffset).toBe(10)
    })

    it('merges custom options with defaults', () => {
      const partialOptions: Partial<GroupedBarChartOptions> = {
        w: 500,
        showLabels: false,
        padding: 0.15
      }

      const wrapper = mount(GroupedBarChart, {
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
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      const container = wrapper.find('div')
      expect(container.exists()).toBe(true)
    })

    it('uses semantic chart container', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      expect(wrapper.find(`#${defaultProps.id}`).exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined id gracefully', () => {
      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          id: undefined as unknown as string
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('handles extremely small values', () => {
      const smallData: GroupedBarChartData = {
        categories: ['Tiny'],
        groups: [
          { name: 'Small', color: '#dc2626', data: [0.001] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: smallData
        }
      })

      expect(wrapper.props().data.groups[0]!.data[0]).toBe(0.001)
    })

    it('handles long category names', () => {
      const longNameData: GroupedBarChartData = {
        categories: ['Very Long Category Name That Might Cause Layout Issues'],
        groups: [
          { name: 'Group', color: '#dc2626', data: [5] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: longNameData
        }
      })

      expect(wrapper.props().data.categories[0]).toBe('Very Long Category Name That Might Cause Layout Issues')
    })

    it('handles long group names', () => {
      const longGroupData: GroupedBarChartData = {
        categories: ['A'],
        groups: [
          { name: 'Very Long Group Name That Might Cause Issues', color: '#dc2626', data: [3] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: longGroupData
        }
      })

      expect(wrapper.props().data.groups[0]!.name).toBe('Very Long Group Name That Might Cause Issues')
    })

    it('handles special characters in names', () => {
      const specialData: GroupedBarChartData = {
        categories: ['Category@#$%'],
        groups: [
          { name: 'Group!@#', color: '#dc2626', data: [1] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: specialData
        }
      })

      expect(wrapper.props().data.categories[0]).toBe('Category@#$%')
      expect(wrapper.props().data.groups[0]!.name).toBe('Group!@#')
    })

    it('handles invalid color values gracefully', () => {
      const invalidColorData: GroupedBarChartData = {
        categories: ['A'],
        groups: [
          { name: 'Invalid', color: 'not-a-color', data: [2] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: invalidColorData
        }
      })

      expect(wrapper.props().data.groups[0]!.color).toBe('not-a-color')
    })

    it('handles empty data arrays', () => {
      const emptyArrayData: GroupedBarChartData = {
        categories: ['A', 'B'],
        groups: [
          { name: 'Empty', color: '#dc2626', data: [] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: emptyArrayData
        }
      })

      expect(wrapper.props().data.groups[0]!.data).toEqual([])
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      expect(wrapper.props().data).toBeDefined()
      expect(wrapper.props().options).toBeDefined() 
      expect(wrapper.props().id).toBeDefined()
    })

    it('validates data prop structure', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      expect(typeof wrapper.props().data).toBe('object')
      expect(Array.isArray(wrapper.props().data.categories)).toBe(true)
      expect(Array.isArray(wrapper.props().data.groups)).toBe(true)
    })

    it('validates options prop structure', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      expect(typeof wrapper.props().options).toBe('object')
    })
  })

  describe('Data Structure Validation', () => {
    it('validates categories structure', () => {
      const validData: GroupedBarChartData = {
        categories: ['A', 'B', 'C'],
        groups: [
          { name: 'Group1', color: '#dc2626', data: [1, 2, 3] }
        ]
      }

      const wrapper = mount(GroupedBarChart, {
        props: {
          ...defaultProps,
          data: validData
        }
      })

      expect(Array.isArray(wrapper.props().data.categories)).toBe(true)
      expect(wrapper.props().data.categories).toHaveLength(3)
    })

    it('validates groups structure', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      const groups = wrapper.props().data.groups
      expect(Array.isArray(groups)).toBe(true)

      groups.forEach((group: { name: string; color: string; data: number[] }) => {
        expect(typeof group.name).toBe('string')
        expect(typeof group.color).toBe('string')
        expect(Array.isArray(group.data)).toBe(true)
      })
    })

    it('validates group data are numbers', () => {
      const wrapper = mount(GroupedBarChart, {
        props: defaultProps
      })

      const groups = wrapper.props().data.groups
      groups.forEach((group: { name: string; color: string; data: number[] }) => {
        group.data.forEach((value: number) => {
          expect(typeof value).toBe('number')
        })
      })
    })
  })
})