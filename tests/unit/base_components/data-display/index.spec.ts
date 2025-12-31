import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Data Display Index Exports', () => {
  // Reset module cache before each test to ensure clean imports
  beforeEach(() => {
    vi.resetModules()
  })
  describe('Component Exports', () => {
    it('exports all chart components', async () => {
      const chartComponents = [
        'BarChart',
        'DoughnutChart', 
        'LineChart',
        'RadarChart',
        'TreeChart',
        'TreeChartLegend',
        'WaffleChart'
      ]

      for (const componentName of chartComponents) {
      const module = await import(`@/base_components/data-display`)
        expect((module as any)[componentName]).toBeDefined()
        expect(typeof (module as any)[componentName]).toBe('object')
      }
    })

    it('exports all bubble components', async () => {
      const bubbleComponents = [
        'BubbleComponent',
        'SeverityBubble'
      ]

      for (const componentName of bubbleComponents) {
      const module = await import(`@/base_components/data-display`)
        expect((module as any)[componentName]).toBeDefined()
        expect(typeof (module as any)[componentName]).toBe('object')
      }
    })

    it('exports all table components', async () => {
      const tableComponents = [
        'SortSelector',
        'SortableTable'
      ]

      for (const componentName of tableComponents) {
      const module = await import(`@/base_components/data-display`)
        expect((module as any)[componentName]).toBeDefined()
        expect(typeof (module as any)[componentName]).toBe('object')
      }
    })
  })

  describe('Type and Utility Exports', () => {
    it('exports chart type definitions', async () => {
      const module = await import(`@/base_components/data-display`)
      
      // Check that chart-related types are exported
      expect((module as any).BarChart).toBeDefined() // BarChart component should be defined
      
      // Instead, verify the modules can be imported without errors
      const barChartModule = await import(`@/base_components/data-display/charts/barChart`)
      expect(barChartModule).toBeDefined()
      
      const doughnutModule = await import(`@/base_components/data-display/charts/doughnutChart`)
      expect(doughnutModule).toBeDefined()
      
      const groupedBarModule = await import(`@/base_components/data-display/charts/groupedBarChart`)
      expect(groupedBarModule).toBeDefined()
      
      const radarChartModule = await import(`@/base_components/data-display/charts/radarChart`)
      expect(radarChartModule).toBeDefined()
    })

    it('exports color utility functions', async () => {
      const module = await import(`@/base_components/data-display`)
      
      // Check that interpolateColors function is exported
      expect(module.interpolateColors).toBeDefined()
      expect(typeof module.interpolateColors).toBe('function')
    })
  })

  describe('Module Structure', () => {
    it('has all expected exports available', async () => {
      const module = await import(`@/base_components/data-display`)
      const exports = Object.keys(module)
      
      // Verify we have a reasonable number of exports
      expect(exports.length).toBeGreaterThan(10)
      
      // Check for essential component exports
      const essentialComponents = [
        'BarChart',
        'DoughnutChart',
        'BubbleComponent', 
        'SeverityBubble',
        'SortableTable',
        'SortSelector'
      ]
      
      essentialComponents.forEach(component => {
        expect(exports).toContain(component)
      })
    })

    it('does not export unexpected values', async () => {
      const module = await import(`@/base_components/data-display`)
      const exports = Object.keys(module)
      
      // Should not export internal implementation details
      const forbiddenExports = [
        'default',
        '__esModule',
        'internal',
        'private'
      ]
      
      forbiddenExports.forEach(forbidden => {
        expect(exports).not.toContain(forbidden)
      })
    })
  })

  describe('Component Accessibility', () => {
    it('chart components have proper Vue component structure', async () => {
      const chartComponents = ['BarChart', 'DoughnutChart', 'TreeChart']
      
      for (const componentName of chartComponents) {
      const module = await import(`@/base_components/data-display`)
        const component = (module as any)[componentName]

        expect(component).toBeDefined()
        expect(component).toHaveProperty('__name')
        expect(component.__name).toBe(componentName)
      }
    })

    it('bubble components have proper Vue component structure', async () => {
      const bubbleComponents = ['BubbleComponent', 'SeverityBubble']
      
      for (const componentName of bubbleComponents) {
      const module = await import(`@/base_components/data-display`)
        const component = (module as any)[componentName]

        expect(component).toBeDefined()
        expect(component).toHaveProperty('__name')
        expect(component.__name).toBe(componentName)
      }
    })

    it('table components have proper Vue component structure', async () => {
      const tableComponents = ['SortSelector', 'SortableTable']
      
      for (const componentName of tableComponents) {
      const module = await import(`@/base_components/data-display`)
        const component = (module as any)[componentName]

        expect(component).toBeDefined()
        expect(component).toHaveProperty('__name')
        expect(component.__name).toBe(componentName)
      }
    })
  })

  describe('Import Consistency', () => {
    it('direct imports match index exports', async () => {
      const indexModule = await import(`@/base_components/data-display`)
      
      // Test a few key components
      const directBarChart = (await import(`@/base_components/data-display/charts/BarChart.vue`)).default
      const directBubble = (await import(`@/base_components/data-display/bubbles/BubbleComponent.vue`)).default
      const directTable = (await import(`@/base_components/data-display/tables/SortableTable.vue`)).default
      
      expect(indexModule.BarChart).toBe(directBarChart)
      expect(indexModule.BubbleComponent).toBe(directBubble)
      expect(indexModule.SortableTable).toBe(directTable)
    })

    it('utility imports match index exports', async () => {
      const indexModule = await import(`@/base_components/data-display`)
      const directUtility = await import(`@/base_components/data-display/charts/colors-waffle`)
      
      expect(indexModule.interpolateColors).toBe(directUtility.interpolateColors)
    })
  })

  describe('Error Handling', () => {
    it('handles missing components gracefully in tests', async () => {
      // This test ensures our test setup doesn't break if a component is temporarily unavailable
      const module = await import(`@/base_components/data-display`)
      
      // All expected components should be defined
      const criticalComponents = ['BarChart', 'SortableTable', 'BubbleComponent']
      
      criticalComponents.forEach(component => {
        expect((module as any)[component]).toBeDefined()
        expect((module as any)[component]).not.toBeNull()
      })
    })
  })
})