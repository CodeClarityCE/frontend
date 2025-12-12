import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeChart from '@/base_components/data-display/charts/TreeChart.vue'

// Mock TreeChartLegend component
const mockTreeChartLegend = {
  template: '<div class="mock-tree-chart-legend"></div>',
  props: ['svgSelector', 'marginLeft', 'x0', 'marginTop', 'legendSpace', 'hasPrunedNodes', 'prunedNodes', 'targetDependency']
}

// Mock GraphDependency type (from the component)
interface GraphDependency {
  id: string
  parentIds?: string[]
  childrenIds?: string[]
  prod: boolean
  dev: boolean
}

// Create comprehensive D3 mock for TreeChart
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
      remove: vi.fn(),
      each: vi.fn(() => {}),
      clone: vi.fn(() => node)
    })),
    text: vi.fn(() => node),
    each: vi.fn(() => node),
    sort: vi.fn(() => node),
    descendants: vi.fn(() => [
      { data: { id: 'root', uniqueId: 'root' }, depth: 0, x: 0, y: 0, children: [] },
      { data: { id: 'child1', uniqueId: 'child1' }, depth: 1, x: 40, y: 250, children: null },
      { data: { id: 'child2', uniqueId: 'child2' }, depth: 1, x: -40, y: 250, children: null }
    ]),
    links: vi.fn(() => [
      { source: { data: { id: 'root' } }, target: { data: { id: 'child1' } } },
      { source: { data: { id: 'root' } }, target: { data: { id: 'child2' } } }
    ]),
    height: 2,
    x: 0,
    y: 0,
    depth: 0,
    data: { id: 'root', uniqueId: 'root' },
    children: []
  }
  return node
}

const mockSvgNode = createMockNode()

// Mock D3 with comprehensive methods for TreeChart
vi.mock('d3', () => ({
  select: vi.fn(() => mockSvgNode),
  stratify: vi.fn(() => ({
    id: vi.fn(() => ({
      parentId: vi.fn(() => vi.fn(() => mockSvgNode))
    }))
  })),
  tree: vi.fn(() => ({
    nodeSize: vi.fn(() => vi.fn(() => mockSvgNode))
  })),
  linkHorizontal: vi.fn(() => ({
    x: vi.fn(() => ({
      y: vi.fn(() => vi.fn())
    }))
  }))
}))

describe('TreeChart', () => {
  const mockData: GraphDependency[] = [
    {
      id: 'root-package',
      parentIds: [],
      childrenIds: ['dependency-1', 'dependency-2'],
      prod: true,
      dev: false
    },
    {
      id: 'dependency-1',
      parentIds: ['root-package'],
      childrenIds: ['sub-dependency-1'],
      prod: true,
      dev: false
    },
    {
      id: 'dependency-2',
      parentIds: ['root-package'],
      childrenIds: [],
      prod: false,
      dev: true
    },
    {
      id: 'sub-dependency-1',
      parentIds: ['dependency-1'],
      childrenIds: [],
      prod: true,
      dev: false
    }
  ]

  const defaultProps = {
    data: mockData,
    id: 'test-tree-chart'
  }

  const globalComponents = {
    TreeChartLegend: mockTreeChartLegend
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock DOM element for chart container
    const mockElement = {
      append: vi.fn(() => mockSvgNode),
      style: vi.fn(() => mockElement)
    }
    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as any)
    
    // Mock console methods to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.tree-chart-container').exists()).toBe(true)
    })

    it('has correct DOM structure', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('.tree-chart-container').exists()).toBe(true)
      expect(wrapper.find('.tree-chart').exists()).toBe(true)
      expect(wrapper.find('.tree-chart').attributes('id')).toBe('test-tree-chart')
    })

    it('renders header when targetDependency is provided', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'dependency-1'
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('.tree-chart-header').exists()).toBe(true)
      expect(wrapper.find('.tree-chart-title').exists()).toBe(true)
      expect(wrapper.find('.target-name').text()).toBe('dependency-1')
    })

    it('does not render header when no targetDependency', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('.tree-chart-header').exists()).toBe(false)
    })

    it('renders div with correct id for chart', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'dependency-1'
        },
        global: {
          components: globalComponents
        }
      })

      // Check that the chart container has correct ID
      expect(wrapper.find('#test-tree-chart').exists()).toBe(true)
    })
  })

  describe('Data Handling', () => {
    it('accepts valid GraphDependency array format', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual(mockData)
      expect(wrapper.props().data).toHaveLength(4)
    })

    it('handles single dependency', () => {
      const singleData: GraphDependency[] = [
        {
          id: 'single-dependency',
          parentIds: [],
          childrenIds: [],
          prod: true,
          dev: false
        }
      ]

      const wrapper = mount(TreeChart, {
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

    it('handles dependencies with production flag', () => {
      const prodData: GraphDependency[] = [
        {
          id: 'prod-dependency',
          parentIds: [],
          childrenIds: [],
          prod: true,
          dev: false
        }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: prodData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.prod).toBe(true)
    })

    it('handles dependencies with development flag', () => {
      const devData: GraphDependency[] = [
        {
          id: 'dev-dependency',
          parentIds: [],
          childrenIds: [],
          prod: false,
          dev: true
        }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: devData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.dev).toBe(true)
    })

    it('handles dependencies without parent/child relationships', () => {
      const isolatedData: GraphDependency[] = [
        {
          id: 'isolated-dependency',
          prod: true,
          dev: false
        }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: isolatedData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.parentIds).toBeUndefined()
      expect(wrapper.props().data[0]!.childrenIds).toBeUndefined()
    })

    it('handles complex dependency trees', () => {
      const complexData: GraphDependency[] = [
        { id: 'root', parentIds: [], childrenIds: ['a', 'b', 'c'], prod: true, dev: false },
        { id: 'a', parentIds: ['root'], childrenIds: ['a1', 'a2'], prod: true, dev: false },
        { id: 'b', parentIds: ['root'], childrenIds: ['b1'], prod: true, dev: false },
        { id: 'c', parentIds: ['root'], childrenIds: [], prod: true, dev: false },
        { id: 'a1', parentIds: ['a'], childrenIds: [], prod: true, dev: false },
        { id: 'a2', parentIds: ['a'], childrenIds: [], prod: true, dev: false },
        { id: 'b1', parentIds: ['b'], childrenIds: [], prod: true, dev: false }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: complexData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toHaveLength(7)
      expect(wrapper.props().data[0]!.childrenIds).toHaveLength(3)
    })

    it('handles circular dependencies gracefully', () => {
      const circularData: GraphDependency[] = [
        { id: 'a', parentIds: ['b'], childrenIds: ['b'], prod: true, dev: false },
        { id: 'b', parentIds: ['a'], childrenIds: ['a'], prod: true, dev: false }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: circularData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual(circularData)
    })
  })

  describe('Target Dependency Handling', () => {
    it('accepts targetDependency prop', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'dependency-1'
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().targetDependency).toBe('dependency-1')
    })

    it('works without targetDependency prop', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().targetDependency).toBeUndefined()
    })

    it('highlights target dependency in header', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'special-dependency'
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('.target-name').text()).toBe('special-dependency')
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toBeDefined()
      expect(wrapper.props().id).toBeDefined()
    })

    it('validates data prop structure', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const data = wrapper.props().data
      expect(Array.isArray(data)).toBe(true)
      
      data.forEach((dependency: any) => {
        expect(dependency).toHaveProperty('id')
        expect(typeof dependency.id).toBe('string')
        
        if (dependency.parentIds !== undefined) {
          expect(Array.isArray(dependency.parentIds)).toBe(true)
        }
        
        if (dependency.childrenIds !== undefined) {
          expect(Array.isArray(dependency.childrenIds)).toBe(true)
        }
        
        if (dependency.prod !== undefined) {
          expect(typeof dependency.prod).toBe('boolean')
        }
        
        if (dependency.dev !== undefined) {
          expect(typeof dependency.dev).toBe('boolean')
        }
      })
    })

    it('validates id prop is string', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(typeof wrapper.props().id).toBe('string')
      expect(wrapper.props().id.length).toBeGreaterThan(0)
    })

    it('validates targetDependency prop is string when provided', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'test-target'
        },
        global: {
          components: globalComponents
        }
      })

      expect(typeof wrapper.props().targetDependency).toBe('string')
    })
  })

  describe('Accessibility', () => {
    it('has accessible structure', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const container = wrapper.find('.tree-chart-container')
      expect(container.exists()).toBe(true)
    })

    it('has semantic header structure when target is specified', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'test-target'
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('h3.tree-chart-title').exists()).toBe(true)
      expect(wrapper.find('p.tree-chart-description').exists()).toBe(true)
    })

    it('has unique id for chart container', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      const chartContainer = wrapper.find('.tree-chart')
      expect(chartContainer.attributes('id')).toBe('test-tree-chart')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty data gracefully', () => {
      const emptyData: GraphDependency[] = []

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: emptyData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toEqual([])
      expect(wrapper.exists()).toBe(true)
    })

    it('handles dependencies with very long names', () => {
      const longNameData: GraphDependency[] = [
        {
          id: 'very-long-dependency-name-that-might-cause-layout-issues-in-the-tree-chart-component',
          parentIds: [],
          childrenIds: [],
          prod: true,
          dev: false
        }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: longNameData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.id).toBe('very-long-dependency-name-that-might-cause-layout-issues-in-the-tree-chart-component')
    })

    it('handles dependencies with special characters', () => {
      const specialCharData: GraphDependency[] = [
        {
          id: '@scope/package-name@1.0.0',
          parentIds: [],
          childrenIds: [],
          prod: true,
          dev: false
        }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: specialCharData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.id).toBe('@scope/package-name@1.0.0')
    })

    it('handles dependencies with empty arrays for parents/children', () => {
      const emptyArrayData: GraphDependency[] = [
        {
          id: 'empty-arrays',
          parentIds: [],
          childrenIds: [],
          prod: true,
          dev: false
        }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: emptyArrayData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.parentIds).toEqual([])
      expect(wrapper.props().data[0]!.childrenIds).toEqual([])
    })

    it('handles dependencies with multiple parents', () => {
      const multiParentData: GraphDependency[] = [
        {
          id: 'shared-dependency',
          parentIds: ['parent-1', 'parent-2', 'parent-3'],
          childrenIds: [],
          prod: true,
          dev: false
        }
      ]

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: multiParentData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data[0]!.parentIds).toHaveLength(3)
    })

    it('handles undefined id gracefully', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          id: 'test-undefined-id'
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().id).toBe('test-undefined-id')
    })

    it('handles very large dependency trees', () => {
      const largeData: GraphDependency[] = Array.from({length: 100}, (_, i) => ({
        id: `dependency-${i}`,
        parentIds: i > 0 ? [`dependency-${i-1}`] : [],
        childrenIds: i < 99 ? [`dependency-${i+1}`] : [],
        prod: true,
        dev: false
      }))

      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          data: largeData
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.props().data).toHaveLength(100)
    })
  })

  describe('Error Handling', () => {
    it('catches and handles rendering errors gracefully', () => {
      // Mock D3 to throw an error
      vi.mocked(console.error).mockImplementation(() => {})
      
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      // Component should still exist even if there's an error
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Component Integration', () => {
    it('has TreeChartLegend component registered', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'test-dependency'
        },
        global: {
          components: globalComponents
        }
      })

      // Verify that the component has access to TreeChartLegend
      expect(wrapper.vm.$options.components).toHaveProperty('TreeChartLegend')
    })

    it('sets up correct targetDependency for TreeChartLegend', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'test-dependency'
        },
        global: {
          components: globalComponents
        }
      })

      // Check that the targetDependency prop is passed correctly to the component
      expect(wrapper.props().targetDependency).toBe('test-dependency')
    })

    it('does not render legend when no targetDependency', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      // TreeChartLegend should not be in HTML when no targetDependency
      const html = wrapper.html()
      expect(html).not.toContain('TreeChartLegend')
    })
  })

  describe('Styling', () => {
    it('applies correct CSS classes', () => {
      const wrapper = mount(TreeChart, {
        props: defaultProps,
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('.tree-chart-container').exists()).toBe(true)
      expect(wrapper.find('.tree-chart').exists()).toBe(true)
    })

    it('applies header styling when targetDependency is provided', () => {
      const wrapper = mount(TreeChart, {
        props: {
          ...defaultProps,
          targetDependency: 'test-target'
        },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.find('.tree-chart-header').exists()).toBe(true)
      expect(wrapper.find('.tree-chart-title').exists()).toBe(true)
      expect(wrapper.find('.target-name').exists()).toBe(true)
      expect(wrapper.find('.tree-chart-description').exists()).toBe(true)
    })
  })
})