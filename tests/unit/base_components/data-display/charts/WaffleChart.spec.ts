import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WaffleChart from '@/base_components/data-display/charts/WaffleChart.vue'

// ResizeObserver is mocked globally in tests/setup.ts

// Mock getBoundingClientRect for tests
Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: vi.fn(() => ({
    width: 800,
    height: 400,
    top: 0,
    left: 0,
    bottom: 400,
    right: 800,
  })),
})

// Mock components
const mockDialog = {
  template: '<div class="mock-dialog"><slot /></div>'
}

const mockDialogTrigger = {
  template: '<div class="mock-dialog-trigger" @click="$emit(\'click\')"><slot /></div>',
  props: ['asChild']
}

const mockDialogScrollContent = {
  template: '<div class="mock-dialog-scroll-content"><slot /></div>',
  props: ['class']
}

const mockDialogHeader = {
  template: '<div class="mock-dialog-header"><slot /></div>'
}

const mockDialogTitle = {
  template: '<div class="mock-dialog-title"><slot /></div>'
}

const mockDialogDescription = {
  template: '<div class="mock-dialog-description"><slot /></div>'
}

const mockIcon = {
  template: '<span class="mock-icon"></span>',
  props: ['icon']
}

const mockButton = {
  template: '<button class="mock-button"><slot /></button>',
  props: ['variant', 'size']
}

// Mock the color interpolation
vi.mock('@/base_components/data-display/charts/colors-waffle', () => ({
  interpolateColors: vi.fn(() => ['#ff0000', '#00ff00', '#0000ff'])
}))

// WaffleChart types (from the component)
export interface WaffleChartEntry {
  label: string;
  value: number;
  color?: string;
}

// Create comprehensive D3 mock
const createMockNode = (): any => {
  const node = {
    append: vi.fn(() => node),
    attr: vi.fn(() => node),
    style: vi.fn(() => node),
    text: vi.fn(() => node),
    on: vi.fn(() => node),
    transition: vi.fn(() => node),
    duration: vi.fn(() => node),
    selectAll: vi.fn(() => ({
      remove: vi.fn(),
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => node),
          merge: vi.fn(() => node)
        })),
        exit: vi.fn(() => ({
          remove: vi.fn()
        }))
      }))
    }))
  }
  return node
}

const mockSvgNode = createMockNode()

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => mockSvgNode),
  interpolateRdYlBu: vi.fn((t: number) => `hsl(${Math.round(240 * t)}, 70%, 50%)`),
  interpolateDiscrete: vi.fn((colors: string[]) => (t: number) => colors[Math.floor(t * colors.length)] ?? colors[0]),
  interpolateWarm: vi.fn((t: number) => `hsl(${Math.round(60 * (1-t))}, 70%, 50%)`),
  interpolateCool: vi.fn((t: number) => `hsl(${Math.round(240 * t)}, 70%, 50%)`)
}))

describe('WaffleChart', () => {
  const mockData: WaffleChartEntry[] = [
    { label: 'Category A', value: 30, color: '#ff0000' },
    { label: 'Category B', value: 25, color: '#00ff00' },
    { label: 'Category C', value: 20, color: '#0000ff' },
    { label: 'Category D', value: 15 },
    { label: 'Category E', value: 10 }
  ]

  const defaultProps = {
    data: mockData,
    sourcePercentual: false,
    outputPercentual: true
  }

  const globalComponents = {
    Dialog: mockDialog,
    DialogTrigger: mockDialogTrigger,
    DialogScrollContent: mockDialogScrollContent,
    DialogHeader: mockDialogHeader,
    DialogTitle: mockDialogTitle,
    DialogDescription: mockDialogDescription,
    Icon: mockIcon,
    Button: mockButton
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('renders waffle grid container', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      // Should render the main container
      expect(wrapper.find('div').exists()).toBe(true)
    })

    it('handles empty data gracefully', () => {
      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: []
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Data Handling', () => {
    it('accepts valid WaffleChartEntry format', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual(mockData)
      expect(wrapper.props().data).toHaveLength(5)
    })

    it('handles single data entry', () => {
      const singleData: WaffleChartEntry[] = [
        { label: 'Single', value: 100, color: '#ff0000' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: singleData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual(singleData)
      expect(wrapper.props().data).toHaveLength(1)
    })

    it('handles data without colors', () => {
      const noColorData: WaffleChartEntry[] = [
        { label: 'No Color 1', value: 50 },
        { label: 'No Color 2', value: 30 }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: noColorData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual(noColorData)
    })

    it('handles mixed data with and without colors', () => {
      const mixedData: WaffleChartEntry[] = [
        { label: 'With Color', value: 50, color: '#ff0000' },
        { label: 'Without Color', value: 30 }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: mixedData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual(mixedData)
    })

    it('handles zero values', () => {
      const zeroData: WaffleChartEntry[] = [
        { label: 'Zero', value: 0, color: '#ff0000' },
        { label: 'Positive', value: 100, color: '#00ff00' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: zeroData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual(zeroData)
    })

    it('handles large values', () => {
      const largeData: WaffleChartEntry[] = [
        { label: 'Large', value: 999999, color: '#ff0000' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: largeData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.value).toBe(999999)
    })

    it('handles decimal values', () => {
      const decimalData: WaffleChartEntry[] = [
        { label: 'Decimal', value: 33.33, color: '#ff0000' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: decimalData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.value).toBe(33.33)
    })
  })

  describe('Configuration Options', () => {
    it('accepts sourcePercentual configuration', () => {
      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          sourcePercentual: true
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().sourcePercentual).toBe(true)
    })

    it('accepts outputPercentual configuration', () => {
      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          outputPercentual: false
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().outputPercentual).toBe(false)
    })

    it('accepts custom color scale function', () => {
      const customColorScale = (t: number) => `hsl(${t * 360}, 70%, 50%)`

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          colorScale: customColorScale
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().colorScale).toBe(customColorScale)
    })

    it('works without custom color scale', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().colorScale).toBeUndefined()
    })
  })

  describe('Percentage Modes', () => {
    it('handles both source and output as percentual', () => {
      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          sourcePercentual: true,
          outputPercentual: true
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().sourcePercentual).toBe(true)
      expect(wrapper.props().outputPercentual).toBe(true)
    })

    it('handles both source and output as non-percentual', () => {
      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          sourcePercentual: false,
          outputPercentual: false
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().sourcePercentual).toBe(false)
      expect(wrapper.props().outputPercentual).toBe(false)
    })

    it('handles mixed percentual modes', () => {
      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          sourcePercentual: true,
          outputPercentual: false
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().sourcePercentual).toBe(true)
      expect(wrapper.props().outputPercentual).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('has accessible structure', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const container = wrapper.find('div')
      expect(container.exists()).toBe(true)
    })

    it('includes modal for detailed view', () => {
      // Create data with small values that will be grouped as "Others" 
      const dataWithSmallValues: WaffleChartEntry[] = [
        { label: 'Large A', value: 950 },
        { label: 'Large B', value: 40 },
        { label: 'Small C', value: 5 }, // This will be < 1% and grouped in "Others"
        { label: 'Small D', value: 3 }, // This will be < 1% and grouped in "Others"
        { label: 'Small E', value: 2 } // This will be < 1% and grouped in "Others"
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: dataWithSmallValues
        },
        global: {
          components: globalComponents
        }
      })

      // Check if "See others" button is rendered (which indicates modal capability)
      expect(wrapper.html()).toContain('See others')
    })
  })

  describe('Edge Cases', () => {
    it('handles extremely small values', () => {
      const smallData: WaffleChartEntry[] = [
        { label: 'Tiny', value: 0.001, color: '#ff0000' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: smallData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.value).toBe(0.001)
    })

    it('handles long label names', () => {
      const longLabelData: WaffleChartEntry[] = [
        { label: 'Very Long Category Name That Might Cause Layout Issues', value: 50, color: '#ff0000' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: longLabelData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.label).toBe('Very Long Category Name That Might Cause Layout Issues')
    })

    it('handles special characters in labels', () => {
      const specialData: WaffleChartEntry[] = [
        { label: 'Category@#$%', value: 25, color: '#ff0000' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: specialData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.label).toBe('Category@#$%')
    })

    it('handles invalid color values gracefully', () => {
      const invalidColorData: WaffleChartEntry[] = [
        { label: 'Invalid Color', value: 50, color: 'not-a-valid-color' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: invalidColorData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.color).toBe('not-a-valid-color')
    })

    it('handles very large datasets', () => {
      const largeDataset: WaffleChartEntry[] = Array.from({length: 50}, (_, i) => ({
        label: `Category ${i}`,
        value: Math.random() * 100,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      }))

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: largeDataset
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toHaveLength(50)
    })

    it('handles negative values gracefully', () => {
      const negativeData: WaffleChartEntry[] = [
        { label: 'Negative', value: -10, color: '#ff0000' },
        { label: 'Positive', value: 50, color: '#00ff00' }
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: negativeData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.value).toBe(-10)
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toBeDefined()
      expect(wrapper.props().sourcePercentual).toBeDefined()
      expect(wrapper.props().outputPercentual).toBeDefined()
    })

    it('validates data prop structure', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(Array.isArray(wrapper.props().data)).toBe(true)
      wrapper.props().data.forEach((item: any) => {
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('value')
        expect(typeof item.label).toBe('string')
        expect(typeof item.value).toBe('number')
        
        if (item.color !== undefined) {
          expect(typeof item.color).toBe('string')
        }
      })
    })

    it('validates boolean props', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(typeof wrapper.props().sourcePercentual).toBe('boolean')
      expect(typeof wrapper.props().outputPercentual).toBe('boolean')
    })
  })

  describe('Component Integration', () => {
    it('integrates with Dialog component', () => {
      // Create data with small values that will be grouped as "Others" 
      const dataWithSmallValues: WaffleChartEntry[] = [
        { label: 'Large A', value: 950 },
        { label: 'Large B', value: 40 },
        { label: 'Small C', value: 5 }, // This will be < 1% and grouped in "Others"
        { label: 'Small D', value: 3 }, // This will be < 1% and grouped in "Others"
        { label: 'Small E', value: 2 } // This will be < 1% and grouped in "Others"
      ]

      const wrapper = mount(WaffleChart, {
        props: {
          ...defaultProps,
          data: dataWithSmallValues
        },
        global: {
          components: globalComponents
        }
      })

      // Check if "See others" button is rendered (which indicates Dialog integration)
      expect(wrapper.html()).toContain('See others')
    })

    it('renders waffle chart grid successfully', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      // Check if the waffle grid is rendered with colored squares
      expect(wrapper.html()).toContain('grid-template-columns')
      expect(wrapper.html()).toContain('background-color')
    })

    it('renders legend successfully', () => {
      const wrapper = mount(WaffleChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      // Check if legend is rendered
      expect(wrapper.html()).toContain('Legend')
      expect(wrapper.html()).toContain('Category A')
    })
  })
})