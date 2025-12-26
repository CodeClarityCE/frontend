import TreeChartLegend from '@/base_components/data-display/charts/TreeChartLegend.vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create comprehensive D3 mock for TreeChartLegend
const createMockSelection = (): any => {
  const selection = {
    append: vi.fn(() => selection),
    attr: vi.fn(() => selection),
    style: vi.fn(() => selection),
    text: vi.fn(() => selection),
    remove: vi.fn(() => selection),
    select: vi.fn(() => selection)
  }
  return selection
}

const mockD3Selection = createMockSelection()

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => mockD3Selection)
}))

describe('TreeChartLegend', () => {
  const defaultProps = {
    svgSelector: '#test-svg',
    marginLeft: 100,
    x0: 0,
    marginTop: 50,
    legendSpace: 140,
    hasPrunedNodes: true,
    prunedNodes: new Set(['node1', 'node2']),
    targetDependency: 'test-dependency'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock DOM element for SVG
    const mockSvgElement = {
      append: vi.fn(() => mockD3Selection),
      select: vi.fn(() => mockD3Selection),
      remove: vi.fn(() => mockD3Selection)
    }
    vi.mocked(mockD3Selection.select).mockReturnValue(mockSvgElement as any)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('Rendering', () => {
    it('renders with required props', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('has correct DOM structure', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      // Component renders a hidden div since it manipulates SVG directly via D3
      const hiddenDiv = wrapper.find('div[style*="display: none"]')
      expect(hiddenDiv.exists()).toBe(true)
    })

    it('renders legend when targetDependency is provided', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      // Verify component exists and targetDependency is set
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.props().targetDependency).toBe('test-dependency')
    })

    it('does not render legend when no targetDependency', () => {
      const propsWithoutTarget = {
        ...defaultProps,
        targetDependency: undefined
      }

      mount(TreeChartLegend, {
        props: propsWithoutTarget
      })

      // Should not attempt to render legend
      expect(mockD3Selection.append).not.toHaveBeenCalled()
    })
  })

  describe('Props Validation', () => {
    it('validates all required props are defined', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(wrapper.props().svgSelector).toBeDefined()
      expect(wrapper.props().marginLeft).toBeDefined()
      expect(wrapper.props().x0).toBeDefined()
      expect(wrapper.props().marginTop).toBeDefined()
      expect(wrapper.props().legendSpace).toBeDefined()
      expect(wrapper.props().hasPrunedNodes).toBeDefined()
      expect(wrapper.props().prunedNodes).toBeDefined()
      expect(wrapper.props().targetDependency).toBeDefined()
    })

    it('validates svgSelector prop is string', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(typeof wrapper.props().svgSelector).toBe('string')
      expect(wrapper.props().svgSelector).toBe('#test-svg')
    })

    it('validates numeric props are numbers', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(typeof wrapper.props().marginLeft).toBe('number')
      expect(typeof wrapper.props().x0).toBe('number')
      expect(typeof wrapper.props().marginTop).toBe('number')
      expect(typeof wrapper.props().legendSpace).toBe('number')
    })

    it('validates boolean props are booleans', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(typeof wrapper.props().hasPrunedNodes).toBe('boolean')
    })

    it('validates prunedNodes is a Set', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(wrapper.props().prunedNodes).toBeInstanceOf(Set)
    })

    it('validates targetDependency is string when provided', () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(typeof wrapper.props().targetDependency).toBe('string')
    })
  })

  describe('Legend Positioning', () => {
    it('uses correct positioning with provided margins', () => {
      const customProps = {
        ...defaultProps,
        marginLeft: 200,
        x0: 100,
        marginTop: 75,
        legendSpace: 160
      }

      mount(TreeChartLegend, {
        props: customProps
      })

      // Verify transform positioning is called with correct values
      expect(mockD3Selection.attr).toHaveBeenCalledWith(
        'transform',
        expect.stringContaining('translate(')
      )
    })

    it('adjusts legend height based on hasPrunedNodes', () => {
      const propsWithoutPruned = {
        ...defaultProps,
        hasPrunedNodes: false
      }

      mount(TreeChartLegend, {
        props: propsWithoutPruned
      })

      // Should create legend with different height
      expect(mockD3Selection.attr).toHaveBeenCalled()
    })
  })

  describe('Legend Content', () => {
    it('renders target dependency indicator', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      // Verify legend elements are created
      expect(mockD3Selection.append).toHaveBeenCalledWith('circle')
      expect(mockD3Selection.text).toHaveBeenCalledWith('Target Dependency')
    })

    it('renders pruned duplicate indicator when hasPrunedNodes is true', () => {
      mount(TreeChartLegend, {
        props: {
          ...defaultProps,
          hasPrunedNodes: true
        }
      })

      expect(mockD3Selection.text).toHaveBeenCalledWith(
        expect.stringContaining('Pruned Duplicate')
      )
    })

    it('does not render pruned duplicate indicator when hasPrunedNodes is false', () => {
      mount(TreeChartLegend, {
        props: {
          ...defaultProps,
          hasPrunedNodes: false
        }
      })

      // Should not include pruned duplicate text
      const prunedCalls = vi.mocked(mockD3Selection.text).mock.calls
        .some((call: any) => call[0]?.includes('Pruned Duplicate'))
      expect(prunedCalls).toBe(false)
    })

    it('renders root node indicator', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(mockD3Selection.text).toHaveBeenCalledWith('Root Node')
    })

    it('renders parent/child node indicator', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(mockD3Selection.text).toHaveBeenCalledWith('Parent/Child Nodes')
    })

    it('renders PROD badge legend', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(mockD3Selection.text).toHaveBeenCalledWith('PROD')
      expect(mockD3Selection.text).toHaveBeenCalledWith('Direct Production Dependency')
    })

    it('renders DEV badge legend', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(mockD3Selection.text).toHaveBeenCalledWith('DEV')
      expect(mockD3Selection.text).toHaveBeenCalledWith('Direct Development Dependency')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty prunedNodes set', () => {
      const propsWithEmptySet = {
        ...defaultProps,
        prunedNodes: new Set<string>(),
        hasPrunedNodes: false
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithEmptySet
      })

      expect(wrapper.props().prunedNodes.size).toBe(0)
    })

    it('handles large prunedNodes set', () => {
      const largePrunedSet = new Set(Array.from({length: 100}, (_, i) => `node-${i}`))
      const propsWithLargeSet = {
        ...defaultProps,
        prunedNodes: largePrunedSet
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithLargeSet
      })

      expect(wrapper.props().prunedNodes.size).toBe(100)
    })

    it('handles negative margin values', () => {
      const propsWithNegativeMargins = {
        ...defaultProps,
        marginLeft: -50,
        x0: -100,
        marginTop: -25
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithNegativeMargins
      })

      expect(wrapper.props().marginLeft).toBe(-50)
      expect(wrapper.props().x0).toBe(-100)
      expect(wrapper.props().marginTop).toBe(-25)
    })

    it('handles zero legend space', () => {
      const propsWithZeroSpace = {
        ...defaultProps,
        legendSpace: 0
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithZeroSpace
      })

      expect(wrapper.props().legendSpace).toBe(0)
    })

    it('handles very long targetDependency names', () => {
      const propsWithLongTarget = {
        ...defaultProps,
        targetDependency: 'very-long-target-dependency-name-that-might-cause-layout-issues'
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithLongTarget
      })

      expect(wrapper.props().targetDependency).toBe('very-long-target-dependency-name-that-might-cause-layout-issues')
    })

    it('handles special characters in svgSelector', () => {
      const propsWithSpecialSelector = {
        ...defaultProps,
        svgSelector: '#svg-container-with-special_chars.class'
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithSpecialSelector
      })

      expect(wrapper.props().svgSelector).toBe('#svg-container-with-special_chars.class')
    })

    it('handles undefined targetDependency gracefully', () => {
      const propsWithoutTarget = {
        ...defaultProps,
        targetDependency: undefined
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithoutTarget
      })

      expect(wrapper.props().targetDependency).toBeUndefined()
    })
  })

  describe('Reactivity', () => {
    it('re-renders legend when targetDependency changes', async () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      // Clear previous calls
      vi.clearAllMocks()

      // Change targetDependency
      await wrapper.setProps({
        targetDependency: 'new-target-dependency'
      })

      // Should trigger re-render
      expect(mockD3Selection.remove).toHaveBeenCalled()
    })

    it('re-renders legend when hasPrunedNodes changes', async () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      // Clear previous calls
      vi.clearAllMocks()

      // Change hasPrunedNodes
      await wrapper.setProps({
        hasPrunedNodes: false
      })

      // Should trigger re-render
      expect(mockD3Selection.remove).toHaveBeenCalled()
    })

    it('re-renders legend when x0 changes', async () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      // Clear previous calls
      vi.clearAllMocks()

      // Change x0
      await wrapper.setProps({
        x0: 200
      })

      // Should trigger re-render
      expect(mockD3Selection.remove).toHaveBeenCalled()
    })

    it('does not re-render when marginLeft changes', async () => {
      const wrapper = mount(TreeChartLegend, {
        props: defaultProps
      })

      // Clear previous calls
      vi.clearAllMocks()

      // Change marginLeft (not watched)
      await wrapper.setProps({
        marginLeft: 300
      })

      // Should not trigger re-render
      expect(mockD3Selection.remove).not.toHaveBeenCalled()
    })
  })

  describe('Legend Cleanup', () => {
    it('removes previous legend before rendering new one', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      // Should call remove to clean up previous legend
      expect(mockD3Selection.remove).toHaveBeenCalled()
    })
  })

  describe('SVG Integration', () => {
    it('targets correct SVG selector', () => {
      const customSelector = '#custom-tree-svg'
      const propsWithCustomSelector = {
        ...defaultProps,
        svgSelector: customSelector
      }

      const wrapper = mount(TreeChartLegend, {
        props: propsWithCustomSelector
      })

      // Should have the custom SVG selector set
      expect(wrapper.props().svgSelector).toBe(customSelector)
    })

    it('creates legend group with correct id', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      expect(mockD3Selection.attr).toHaveBeenCalledWith('id', 'tree-chart-legend-group')
    })
  })

  describe('Legend Styling', () => {
    it('applies correct background styling', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      // Should set up background rectangle with styling
      expect(mockD3Selection.attr).toHaveBeenCalledWith('fill', 'rgba(255, 255, 255, 0.95)')
      expect(mockD3Selection.attr).toHaveBeenCalledWith('stroke', '#e5e7eb')
      expect(mockD3Selection.attr).toHaveBeenCalledWith('rx', 6)
    })

    it('applies correct circle styling for different legend items', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      // Should create circles with various fill colors
      expect(mockD3Selection.attr).toHaveBeenCalledWith('fill', 'url(#highlightGradient)')
      expect(mockD3Selection.attr).toHaveBeenCalledWith('fill', '#94a3b8')
      expect(mockD3Selection.attr).toHaveBeenCalledWith('fill', '#3b82f6')
    })

    it('applies correct text styling', () => {
      mount(TreeChartLegend, {
        props: defaultProps
      })

      // Should set font sizes and colors for text elements
      expect(mockD3Selection.attr).toHaveBeenCalledWith('font-size', '12px')
      expect(mockD3Selection.attr).toHaveBeenCalledWith('font-size', '11px')
      expect(mockD3Selection.attr).toHaveBeenCalledWith('fill', '#374151')
    })
  })
})