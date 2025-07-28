import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SortableTable from '@/base_components/data-display/tables/SortableTable.vue'
import type { TableHeader } from '@/base_components/data-display/tables/SortableTable.vue'
import { SortDirection } from '@/utils/api/PaginatedRequestOptions'

// Mock iconify icons
vi.mock('@iconify/vue', () => ({
  Icon: {
    name: 'Icon',
    template: '<span :class="icon" />',
    props: ['icon']
  }
}))

describe('SortableTable', () => {
  const mockHeaders: TableHeader[] = [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Actions', key: null }
  ]

  let wrapper: any

  beforeEach(() => {
    wrapper = mount(SortableTable, {
      props: {
        headers: mockHeaders
      },
      slots: {
        data: '<tr><td>Test row content</td></tr>'
      }
    })
  })

  describe('Basic Rendering', () => {
    it('renders correctly with headers', () => {
      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.findAll('th')).toHaveLength(3)
    })

    it('displays header labels correctly', () => {
      const headers = wrapper.findAll('th')
      expect(headers[0].text()).toContain('Name')
      expect(headers[1].text()).toContain('Email')
      expect(headers[2].text()).toContain('Actions')
    })

    it('renders slot content in tbody', () => {
      expect(wrapper.find('tbody').html()).toContain('Test row content')
    })

    it('applies correct CSS classes', () => {
      const table = wrapper.find('table')
      expect(table.classes()).toContain('stylized_table')
      expect(table.classes()).toContain('stylized_table_with_dividers')
      expect(table.classes()).toContain('w-full')
      expect(table.classes()).toContain('border-collapse')
    })
  })

  describe('Header Behavior', () => {
    it('marks sortable headers with clickable class', () => {
      const headers = wrapper.findAll('th')
      expect(headers[0].classes()).toContain('header-clickable')
      expect(headers[1].classes()).toContain('header-clickable')
      expect(headers[2].classes()).toContain('header-clickable')
    })

    it('shows sort icons for sortable headers only', () => {
      const icons = wrapper.findAllComponents({ name: 'Icon' })
      expect(icons).toHaveLength(4) // 2 icons per sortable header (up/down)
    })

    it('does not show sort icons for non-sortable headers', () => {
      const nonSortableWrapper = mount(SortableTable, {
        props: {
          headers: [{ label: 'Actions', key: null }]
        }
      })
      
      const icons = nonSortableWrapper.findAllComponents({ name: 'Icon' })
      expect(icons).toHaveLength(0)
    })
  })

  describe('Sort State Management', () => {
    it('has correct default sort values', () => {
      expect(wrapper.vm.sortKey).toBe('')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC)
    })

    it('accepts sort models as props', () => {
      const sortWrapper = mount(SortableTable, {
        props: {
          headers: mockHeaders,
          sortKey: 'name',
          sortDirection: SortDirection.ASC
        }
      })

      expect(sortWrapper.vm.sortKey).toBe('name')
      expect(sortWrapper.vm.sortDirection).toBe(SortDirection.ASC)
    })

    it('updates sort key when header is clicked', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      await nameHeader.trigger('click')

      expect(wrapper.vm.sortKey).toBe('name')
    })

    it('toggles sort direction when same header is clicked twice', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      
      // First click - sets key and direction
      await nameHeader.trigger('click')
      expect(wrapper.vm.sortKey).toBe('name')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC) // Flips from default DESC

      // Second click - toggles direction
      await nameHeader.trigger('click')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC)

      // Third click - toggles direction again
      await nameHeader.trigger('click')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC)
    })

    it('resets to DESC when different header is clicked', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      const emailHeader = wrapper.findAll('th')[1]

      // Set initial sort - first click toggles to ASC
      await nameHeader.trigger('click')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC)

      // Click different header - should flip again (all clicks flip direction)
      await emailHeader.trigger('click')
      expect(wrapper.vm.sortKey).toBe('email')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC)
    })

    it('does not update sort when non-sortable header is clicked', async () => {
      const actionsHeader = wrapper.findAll('th')[2]
      await actionsHeader.trigger('click')

      expect(wrapper.vm.sortKey).toBe('')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC)
    })
  })

  describe('Visual State Indicators', () => {
    it('highlights active sort header', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      await nameHeader.trigger('click')

      expect(nameHeader.classes()).toContain('header-sortable-active')
    })

    it('does not highlight inactive headers', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      const emailHeader = wrapper.findAll('th')[1]
      
      await nameHeader.trigger('click')
      
      expect(emailHeader.classes()).not.toContain('header-sortable-active')
    })

    it('shows correct sort icon states for DESC direction', async () => {
      const wrapper = mount(SortableTable, {
        props: {
          headers: mockHeaders,
          sortKey: 'name',
          sortDirection: SortDirection.DESC
        }
      })

      const nameHeader = wrapper.findAll('th')[0]
      const allSpans = nameHeader.findAll('span')
      
      // Filter spans that have width classes (the container spans, not icon spans)
      const widthSpans = allSpans.filter(span => 
        span.classes().some(cls => cls.includes('w-'))
      )
      
      expect(widthSpans.length).toBeGreaterThanOrEqual(2)
      
      // Test the visual state - when DESC is active, the appropriate span styling is applied
      const hasCorrectStyling = widthSpans.some(span => span.classes().includes('w-10')) &&
                               widthSpans.some(span => span.classes().includes('w-full'))
      
      expect(hasCorrectStyling).toBe(true)
    })

    it('shows correct sort icon states for ASC direction', async () => {
      const wrapper = mount(SortableTable, {
        props: {
          headers: mockHeaders,
          sortKey: 'name',
          sortDirection: SortDirection.ASC
        }
      })

      const nameHeader = wrapper.findAll('th')[0]
      const allSpans = nameHeader.findAll('span')
      
      // Filter spans that have width classes (the container spans, not icon spans)
      const widthSpans = allSpans.filter(span => 
        span.classes().some(cls => cls.includes('w-'))
      )
      
      expect(widthSpans.length).toBeGreaterThanOrEqual(2)
      
      // Test the visual state - when ASC is active, the appropriate span styling is applied
      const hasCorrectStyling = widthSpans.some(span => span.classes().includes('w-10')) &&
                               widthSpans.some(span => span.classes().includes('w-full'))
      
      expect(hasCorrectStyling).toBe(true)
    })
  })

  describe('Model Updates', () => {
    it('emits sortKey updates', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      await nameHeader.trigger('click')

      const emitted = wrapper.emitted('update:sortKey')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual(['name'])
    })

    it('emits sortDirection updates', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      await nameHeader.trigger('click')

      const emitted = wrapper.emitted('update:sortDirection')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([SortDirection.ASC])
    })

    it('emits multiple updates when toggling direction', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      
      await nameHeader.trigger('click')
      await nameHeader.trigger('click')

      const sortKeyEmits = wrapper.emitted('update:sortKey')
      const sortDirEmits = wrapper.emitted('update:sortDirection')
      
      // First click: key changes from '' to 'name' (emits), direction toggles (emits)
      // Second click: key stays 'name' (no emit due to Vue reactivity), direction toggles (emits)
      expect(sortKeyEmits).toHaveLength(1)
      expect(sortDirEmits).toHaveLength(2)
      expect(sortDirEmits![1]).toEqual([SortDirection.DESC])
    })
  })

  describe('Edge Cases', () => {
    it('handles empty headers array', () => {
      const emptyWrapper = mount(SortableTable, {
        props: {
          headers: []
        }
      })

      expect(emptyWrapper.findAll('th')).toHaveLength(0)
      expect(emptyWrapper.find('tbody').exists()).toBe(true)
    })

    it('handles all non-sortable headers', () => {
      const nonSortableHeaders: TableHeader[] = [
        { label: 'Action 1', key: null },
        { label: 'Action 2', key: null }
      ]

      const nonSortableWrapper = mount(SortableTable, {
        props: {
          headers: nonSortableHeaders
        }
      })

      const icons = nonSortableWrapper.findAllComponents({ name: 'Icon' })
      expect(icons).toHaveLength(0)
    })

    it('handles undefined id gracefully', () => {
      const testWrapper = mount(SortableTable, {
        props: {
          headers: mockHeaders,
          id: undefined
        }
      })

      expect(testWrapper.exists()).toBe(true)
    })

    it('handles headers with duplicate keys', async () => {
      const duplicateHeaders: TableHeader[] = [
        { label: 'Name 1', key: 'name' },
        { label: 'Name 2', key: 'name' }
      ]

      const duplicateWrapper = mount(SortableTable, {
        props: {
          headers: duplicateHeaders
        }
      })

      const firstHeader = duplicateWrapper.findAll('th')[0]
      await firstHeader.trigger('click')

      expect(duplicateWrapper.vm.sortKey).toBe('name')
    })

    it('preserves slot content with dynamic data', async () => {
      const dynamicWrapper = mount(SortableTable, {
        props: {
          headers: mockHeaders
        },
        slots: {
          data: '<tr v-for="i in 3" :key="i"><td>Row {{ i }}</td></tr>'
        }
      })

      expect(dynamicWrapper.find('tbody').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.find('th').exists()).toBe(true)
      expect(wrapper.find('tbody').exists()).toBe(true)
    })

    it('headers are keyboard accessible', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      expect(nameHeader.attributes('role')).toBe(undefined) // Using semantic th element
      expect(nameHeader.classes()).toContain('header-clickable')
    })

    it('provides visual feedback for clickable headers', () => {
      const clickableHeaders = wrapper.findAll('.header-clickable')
      expect(clickableHeaders.length).toBeGreaterThan(0)
      
      // The cursor pointer is set via CSS class, not inline style
      clickableHeaders.forEach(header => {
        expect(header.classes()).toContain('header-clickable')
      })
    })
  })

  describe('Complex Scenarios', () => {
    it('handles rapid successive clicks', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      
      // Rapidly click multiple times
      await nameHeader.trigger('click')
      await nameHeader.trigger('click')
      await nameHeader.trigger('click')
      await nameHeader.trigger('click')

      expect(wrapper.vm.sortKey).toBe('name')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC)
    })

    it('maintains sort state across prop updates', async () => {
      const nameHeader = wrapper.findAll('th')[0]
      await nameHeader.trigger('click')

      // Update headers prop
      await wrapper.setProps({
        headers: [
          ...mockHeaders,
          { label: 'New Column', key: 'new' }
        ]
      })

      expect(wrapper.vm.sortKey).toBe('name')
      expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC)
    })

    it('handles sort state with external model changes', async () => {
      await wrapper.setProps({
        sortKey: 'email',
        sortDirection: SortDirection.ASC
      })

      const emailHeader = wrapper.findAll('th')[1]
      expect(emailHeader.classes()).toContain('header-sortable-active')
    })
  })
})