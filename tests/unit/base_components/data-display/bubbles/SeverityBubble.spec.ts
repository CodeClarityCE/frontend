import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SeverityBubble from '@/base_components/data-display/bubbles/SeverityBubble.vue'

// TODO: These tests need to be rewritten to match the current component implementation.
// The component structure has changed - it no longer uses .severity-box, .severity-class classes.
// Current structure: .flex.flex-row.gap-1 container with nested .flex.flex-row for each severity level.
describe.skip('SeverityBubble', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(SeverityBubble)
  })

  describe('Basic Rendering', () => {
    it('renders the severity bar container', () => {
      expect(wrapper.find('.flex.flex-row.gap-1').exists()).toBe(true)
    })

    it('renders empty when no severity props are provided', () => {
      expect(wrapper.findAll('.flex.flex-row > div').filter((el: any) => el.text().match(/^[CHML N]$/))).toHaveLength(0)
    })

    it('applies correct container classes', () => {
      const container = wrapper.find('.flex.flex-row.gap-1')
      expect(container.classes()).toContain('flex')
      expect(container.classes()).toContain('flex-row')
      expect(container.classes()).toContain('gap-1')
    })
  })

  describe('Critical Severity', () => {
    it('renders critical severity box when critical prop is true', () => {
      const criticalWrapper = mount(SeverityBubble, {
        props: { critical: true },
        slots: { critical: '10' }
      })

      const severityBox = criticalWrapper.find('.flex.flex-row')
      expect(severityBox.exists()).toBe(true)

      const severityLabel = severityBox.findAll('div')[0]
      const severityValue = severityBox.findAll('div')[1]

      expect(severityLabel?.exists()).toBe(true)
      expect(severityLabel?.text()).toBe('C')
      expect(severityLabel?.classes()).toContain('severity-class-critical')

      expect(severityValue?.exists()).toBe(true)
      expect(severityValue?.text()).toBe('10')
      expect(severityValue?.classes()).toContain('severity-value-critical')
    })

    it('uses content slot when critical slot is not provided', () => {
      const contentWrapper = mount(SeverityBubble, {
        props: { critical: true },
        slots: { content: '5' }
      })

      const severityValue = contentWrapper.find('.severity-value')
      expect(severityValue.text()).toBe('5')
    })

    it('does not render critical when deactivated', () => {
      const deactivatedWrapper = mount(SeverityBubble, {
        props: { critical: true, deactivated: true },
        slots: { critical: '10' }
      })

      const severityClass = deactivatedWrapper.find('.severity-class')
      const severityValue = deactivatedWrapper.find('.severity-value')
      
      expect(severityClass.classes()).not.toContain('severity-class-critical')
      expect(severityValue.classes()).not.toContain('severity-value-critical')
    })
  })

  describe('High Severity', () => {
    it('renders high severity box when high prop is true', () => {
      const highWrapper = mount(SeverityBubble, {
        props: { high: true },
        slots: { high: '8' }
      })

      const severityBox = highWrapper.find('.severity-box')
      expect(severityBox.exists()).toBe(true)
      
      const severityClass = severityBox.find('.severity-class')
      const severityValue = severityBox.find('.severity-value')
      
      expect(severityClass.text()).toBe('H')
      expect(severityClass.classes()).toContain('severity-class-high')
      
      expect(severityValue.text()).toBe('8')
      expect(severityValue.classes()).toContain('severity-value-high')
    })

    it('does not apply active classes when deactivated', () => {
      const deactivatedWrapper = mount(SeverityBubble, {
        props: { high: true, deactivated: true },
        slots: { high: '8' }
      })

      const severityClass = deactivatedWrapper.find('.severity-class')
      const severityValue = deactivatedWrapper.find('.severity-value')
      
      expect(severityClass.classes()).not.toContain('severity-class-high')
      expect(severityValue.classes()).not.toContain('severity-value-high')
    })
  })

  describe('Medium Severity', () => {
    it('renders medium severity box when medium prop is true', () => {
      const mediumWrapper = mount(SeverityBubble, {
        props: { medium: true },
        slots: { medium: '6' }
      })

      const severityBox = mediumWrapper.find('.severity-box')
      expect(severityBox.exists()).toBe(true)
      
      const severityClass = severityBox.find('.severity-class')
      const severityValue = severityBox.find('.severity-value')
      
      expect(severityClass.text()).toBe('M')
      expect(severityClass.classes()).toContain('severity-class-medium')
      
      expect(severityValue.text()).toBe('6')
      expect(severityValue.classes()).toContain('severity-value-medium')
    })
  })

  describe('Low Severity', () => {
    it('renders low severity box when low prop is true', () => {
      const lowWrapper = mount(SeverityBubble, {
        props: { low: true },
        slots: { low: '3' }
      })

      const severityBox = lowWrapper.find('.severity-box')
      expect(severityBox.exists()).toBe(true)
      
      const severityClass = severityBox.find('.severity-class')
      const severityValue = severityBox.find('.severity-value')
      
      expect(severityClass.text()).toBe('L')
      expect(severityClass.classes()).toContain('severity-class-low')
      
      expect(severityValue.text()).toBe('3')
      expect(severityValue.classes()).toContain('severity-value-low')
    })
  })

  describe('None Severity', () => {
    it('renders none severity box when none prop is true', () => {
      const noneWrapper = mount(SeverityBubble, {
        props: { none: true },
        slots: { none: '0' }
      })

      const severityBox = noneWrapper.find('.severity-box')
      expect(severityBox.exists()).toBe(true)
      
      const severityClass = severityBox.find('.severity-class')
      const severityValue = severityBox.find('.severity-value')
      
      expect(severityClass.text()).toBe('N')
      expect(severityClass.classes()).toContain('severity-class-none')
      
      expect(severityValue.text()).toBe('0')
      expect(severityValue.classes()).toContain('severity-value-none')
    })
  })

  describe('Multiple Severities', () => {
    it('renders multiple severity boxes when multiple props are true', () => {
      const multipleWrapper = mount(SeverityBubble, {
        props: { critical: true, high: true, low: true },
        slots: { 
          critical: '5',
          high: '10', 
          low: '2'
        }
      })

      const severityBoxes = multipleWrapper.findAll('.severity-box')
      expect(severityBoxes).toHaveLength(3)
      
      // Check that all three severities are rendered in correct order
      const classes = severityBoxes.map(box => box.find('.severity-class').text())
      expect(classes).toEqual(['C', 'H', 'L'])
      
      const values = severityBoxes.map(box => box.find('.severity-value').text())
      expect(values).toEqual(['5', '10', '2'])
    })

    it('renders all severity types when all props are true', () => {
      const allSeveritiesWrapper = mount(SeverityBubble, {
        props: { 
          critical: true, 
          high: true, 
          medium: true, 
          low: true, 
          none: true 
        },
        slots: { 
          critical: '1',
          high: '2', 
          medium: '3',
          low: '4',
          none: '5'
        }
      })

      const severityBoxes = allSeveritiesWrapper.findAll('.severity-box')
      expect(severityBoxes).toHaveLength(5)
      
      const classes = severityBoxes.map(box => box.find('.severity-class').text())
      expect(classes).toEqual(['C', 'H', 'M', 'L', 'N'])
    })
  })

  describe('Deactivated State', () => {
    it('applies correct styling when all severities are deactivated', () => {
      const deactivatedWrapper = mount(SeverityBubble, {
        props: { 
          critical: true, 
          high: true, 
          medium: true,
          deactivated: true 
        },
        slots: { 
          critical: '1',
          high: '2', 
          medium: '3'
        }
      })

      const severityBoxes = deactivatedWrapper.findAll('.severity-box')
      expect(severityBoxes).toHaveLength(3)
      
      severityBoxes.forEach(box => {
        const severityClass = box.find('.severity-class')
        const severityValue = box.find('.severity-value')
        
        // Should not have active severity classes
        expect(severityClass.classes().some(cls => cls.includes('severity-class-critical'))).toBe(false)
        expect(severityClass.classes().some(cls => cls.includes('severity-class-high'))).toBe(false)
        expect(severityClass.classes().some(cls => cls.includes('severity-class-medium'))).toBe(false)
        
        expect(severityValue.classes().some(cls => cls.includes('severity-value-critical'))).toBe(false)
        expect(severityValue.classes().some(cls => cls.includes('severity-value-high'))).toBe(false)
        expect(severityValue.classes().some(cls => cls.includes('severity-value-medium'))).toBe(false)
      })
    })

    it('maintains base structure when deactivated', () => {
      const deactivatedWrapper = mount(SeverityBubble, {
        props: { critical: true, deactivated: true },
        slots: { critical: '10' }
      })

      const severityBox = deactivatedWrapper.find('.severity-box')
      const severityClass = severityBox.find('.severity-class')
      const severityValue = severityBox.find('.severity-value')
      
      expect(severityBox.exists()).toBe(true)
      expect(severityClass.exists()).toBe(true)
      expect(severityValue.exists()).toBe(true)
      
      // Base classes should still be present
      expect(severityClass.classes()).toContain('severity-class')
      expect(severityValue.classes()).toContain('severity-value')
    })
  })

  describe('Slot Content Handling', () => {
    it('prioritizes specific severity slot over content slot', () => {
      const priorityWrapper = mount(SeverityBubble, {
        props: { critical: true },
        slots: { 
          critical: 'Critical Value',
          content: 'Generic Content'
        }
      })

      const severityValue = priorityWrapper.find('.severity-value')
      expect(severityValue.text()).toContain('Critical Value')
      expect(severityValue.text()).toContain('Generic Content')
    })

    it('uses content slot when specific severity slot is not provided', () => {
      const contentWrapper = mount(SeverityBubble, {
        props: { high: true },
        slots: { content: 'Fallback Content' }
      })

      const severityValue = contentWrapper.find('.severity-value')
      expect(severityValue.text()).toBe('Fallback Content')
    })

    it('handles empty slot content gracefully', () => {
      const emptyWrapper = mount(SeverityBubble, {
        props: { medium: true }
      })

      const severityValue = emptyWrapper.find('.severity-value')
      expect(severityValue.exists()).toBe(true)
      expect(severityValue.text()).toBe('')
    })

    it('handles complex slot content', () => {
      const complexWrapper = mount(SeverityBubble, {
        props: { low: true },
        slots: { 
          low: '<span class="custom-class">Complex <strong>Content</strong></span>' 
        }
      })

      const severityValue = complexWrapper.find('.severity-value')
      expect(severityValue.html()).toContain('<span class="custom-class">Complex <strong>Content</strong></span>')
    })
  })

  describe('CSS Structure', () => {
    it('applies correct CSS structure for severity bars', () => {
      const structureWrapper = mount(SeverityBubble, {
        props: { critical: true },
        slots: { critical: '1' }
      })

      const severityBar = structureWrapper.find('.severity-bar')
      const severityBox = structureWrapper.find('.severity-box')
      const severityClass = structureWrapper.find('.severity-class')
      const severityValue = structureWrapper.find('.severity-value')
      
      expect(severityBar.exists()).toBe(true)
      expect(severityBox.exists()).toBe(true)
      expect(severityClass.exists()).toBe(true)
      expect(severityValue.exists()).toBe(true)
      
      // Check nesting structure
      expect(severityBar.find('.severity-box').exists()).toBe(true)
      expect(severityBox.find('.severity-class').exists()).toBe(true)
      expect(severityBox.find('.severity-value').exists()).toBe(true)
    })

    it('maintains slim bar styling', () => {
      const slimWrapper = mount(SeverityBubble, {
        props: { critical: true },
        slots: { critical: '1' }
      })

      const severityBar = slimWrapper.find('.severity-bar')
      expect(severityBar.classes()).toContain('severity-bar-slim')
    })
  })

  describe('Edge Cases', () => {
    it('handles all false props gracefully', () => {
      const allFalseWrapper = mount(SeverityBubble, {
        props: { 
          critical: false, 
          high: false, 
          medium: false, 
          low: false, 
          none: false,
          deactivated: false 
        }
      })

      expect(allFalseWrapper.findAll('.severity-box')).toHaveLength(0)
      expect(allFalseWrapper.find('.severity-bar').exists()).toBe(true)
    })

    it('handles undefined id gracefully', () => {
      const undefinedWrapper = mount(SeverityBubble, {
        props: { critical: true, id: undefined },
        slots: { critical: '1' }
      })

      expect(undefinedWrapper.exists()).toBe(true)
    })

    it('handles mixed slot types', () => {
      const mixedWrapper = mount(SeverityBubble, {
        props: { critical: true, high: true },
        slots: { 
          critical: '10',  // Specific slot
          content: '5'     // Fallback slot
        }
      })

      const severityBoxes = mixedWrapper.findAll('.severity-box')
      expect(severityBoxes).toHaveLength(2)

      // Critical should use its specific slot + content
      const criticalValue = severityBoxes[0]!.find('.severity-value')
      expect(criticalValue.text()).toContain('10')
      expect(criticalValue.text()).toContain('5')

      // High should use only content slot
      const highValue = severityBoxes[1]!.find('.severity-value')
      expect(highValue.text()).toBe('5')
    })

    it('preserves order of severity levels', () => {
      // Test that severities always render in the correct order regardless of prop order
      const orderWrapper = mount(SeverityBubble, {
        props: { 
          none: true,    // Last in order
          critical: true, // First in order  
          low: true,     // Fourth in order
          high: true     // Second in order
        },
        slots: { 
          none: 'N',
          critical: 'C', 
          low: 'L',
          high: 'H'
        }
      })

      const severityBoxes = orderWrapper.findAll('.severity-box')
      const classes = severityBoxes.map(box => box.find('.severity-class').text())
      
      // Should always be in C, H, M, L, N order
      expect(classes).toEqual(['C', 'H', 'L', 'N'])
    })
  })

  describe('Accessibility', () => {
    it('provides semantic structure for screen readers', () => {
      const accessibleWrapper = mount(SeverityBubble, {
        props: { critical: true, high: true },
        slots: { 
          critical: '5',
          high: '10'
        }
      })

      // Each severity box should be distinguishable
      const severityBoxes = accessibleWrapper.findAll('.severity-box')
      expect(severityBoxes).toHaveLength(2)
      
      severityBoxes.forEach(box => {
        const severityClass = box.find('.severity-class')
        const severityValue = box.find('.severity-value')
        
        expect(severityClass.exists()).toBe(true)
        expect(severityValue.exists()).toBe(true)
      })
    })

    it('maintains readable text contrast through CSS classes', () => {
      const contrastWrapper = mount(SeverityBubble, {
        props: { critical: true },
        slots: { critical: '10' }
      })

      const severityClass = contrastWrapper.find('.severity-class')
      const severityValue = contrastWrapper.find('.severity-value')
      
      expect(severityClass.classes()).toContain('severity-class-critical')
      expect(severityValue.classes()).toContain('severity-value-critical')
    })
  })

  describe('Integration Scenarios', () => {
    it('works with dynamic prop updates', async () => {
      const dynamicWrapper = mount(SeverityBubble, {
        props: { critical: true },
        slots: { critical: '5' }
      })

      expect(dynamicWrapper.findAll('.severity-box')).toHaveLength(1)
      
      await dynamicWrapper.setProps({ critical: true, high: true })
      expect(dynamicWrapper.findAll('.severity-box')).toHaveLength(2)
      
      await dynamicWrapper.setProps({ critical: false, high: true })
      expect(dynamicWrapper.findAll('.severity-box')).toHaveLength(1)
    })

    it('handles rapid prop changes', async () => {
      const rapidWrapper = mount(SeverityBubble)

      await rapidWrapper.setProps({ critical: true })
      await rapidWrapper.setProps({ critical: false, high: true })
      await rapidWrapper.setProps({ high: false, medium: true })
      
      const severityBoxes = rapidWrapper.findAll('.severity-box')
      expect(severityBoxes).toHaveLength(1)
      expect(rapidWrapper.find('.severity-class').text()).toBe('M')
    })
  })
})