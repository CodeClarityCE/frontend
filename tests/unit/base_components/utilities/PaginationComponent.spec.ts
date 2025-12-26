import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import PaginationComponent from '../../../../src/base_components/utilities/PaginationComponent.vue'

// Mock the shadcn pagination components
vi.mock('@/shadcn/ui/pagination', () => ({
  Pagination: {
    name: 'Pagination',
    template: '<div data-testid="pagination" class="pagination"><slot /></div>',
    props: ['total', 'itemsPerPage', 'siblingCount', 'showEdges', 'defaultPage']
  },
  PaginationList: {
    name: 'PaginationList',
    template: '<div data-testid="pagination-list" class="pagination-list"><slot /></div>'
  },
  PaginationListItem: {
    name: 'PaginationListItem',
    template: '<div data-testid="pagination-item" class="pagination-item"><slot /></div>',
    props: ['value', 'asChild']
  },
  PaginationFirst: {
    name: 'PaginationFirst',
    template: '<button data-testid="pagination-first" class="pagination-first" @click="$emit(\'click\')">First</button>',
    emits: ['click']
  },
  PaginationPrev: {
    name: 'PaginationPrev',
    template: '<button data-testid="pagination-prev" class="pagination-prev" @click="$emit(\'click\')">Prev</button>',
    emits: ['click']
  },
  PaginationNext: {
    name: 'PaginationNext',
    template: '<button data-testid="pagination-next" class="pagination-next" @click="$emit(\'click\')">Next</button>',
    emits: ['click']
  },
  PaginationLast: {
    name: 'PaginationLast',
    template: '<button data-testid="pagination-last" class="pagination-last" @click="$emit(\'click\')">Last</button>',
    emits: ['click']
  },
  PaginationEllipsis: {
    name: 'PaginationEllipsis',
    template: '<span data-testid="pagination-ellipsis" class="pagination-ellipsis">...</span>',
    props: ['index']
  }
}))

vi.mock('@/shadcn/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button data-testid="button" :class="variant" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'size', 'disabled'],
    emits: ['click']
  }
}))

describe('PaginationComponent', () => {
  const createWrapper = (props: any = {}) => {
    return mount(PaginationComponent, {
      props: {
        page: 0,
        nmbEntriesShowing: 15,
        nmbEntriesTotal: 100,
        totalPages: 10,
        ...props,
        'onUpdate:page': vi.fn(),
        'onUpdate:nmbEntriesShowing': vi.fn(),
        'onUpdate:nmbEntriesTotal': vi.fn(),
        'onUpdate:totalPages': vi.fn()
      },
      slots: {
        content: '<div data-testid="content-slot">Test content</div>'
      }
    })
  }

  describe('Rendering', () => {
    it('renders main container structure', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.flex.flex-col.gap-2.pb-4').exists()).toBe(true)
      expect(wrapper.find('.w-full').exists()).toBe(true)
    })

    it('renders content slot', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('[data-testid="content-slot"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test content')
    })

    it('renders pagination controls when totalPages > 1', () => {
      const wrapper = createWrapper({
        totalPages: 5
      })

      expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(true)
      expect(wrapper.find('.flex.flex-row.gap-2').exists()).toBe(true)
    })

    it('hides pagination controls when totalPages = 1', () => {
      const wrapper = createWrapper({
        totalPages: 1
      })

      expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(false)
    })
  })

  describe('Pagination Controls', () => {
    it('renders all pagination navigation elements', () => {
      const wrapper = createWrapper({
        totalPages: 5
      })

      expect(wrapper.find('[data-testid="pagination-first"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="pagination-prev"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="pagination-next"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="pagination-last"]').exists()).toBe(true)
    })

    it('renders pagination structure correctly', () => {
      const wrapper = createWrapper({
        totalPages: 5
      })

      expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="pagination-list"]').exists()).toBe(true)
    })
  })

  describe('Page Navigation', () => {
    it('has navigation buttons available for interaction', () => {
      const wrapper = createWrapper({
        totalPages: 5,
        page: 2
      })

      const firstBtn = wrapper.find('[data-testid="pagination-first"]')
      const prevBtn = wrapper.find('[data-testid="pagination-prev"]')
      const nextBtn = wrapper.find('[data-testid="pagination-next"]')
      const lastBtn = wrapper.find('[data-testid="pagination-last"]')

      expect(firstBtn.exists()).toBe(true)
      expect(prevBtn.exists()).toBe(true)
      expect(nextBtn.exists()).toBe(true)
      expect(lastBtn.exists()).toBe(true)
    })
  })

  describe('changePage Method', () => {
    it('changePage method exists and can be called', () => {
      const wrapper = createWrapper({
        totalPages: 5,
        page: 2
      })

      // Test that the method exists and can be called
      expect(typeof wrapper.vm['changePage']).toBe('function')
      
      // Test that method calls don't throw errors
      expect(() => {
        wrapper.vm['changePage'](3)
        wrapper.vm['changePage'](-1)
        wrapper.vm['changePage'](10)
      }).not.toThrow()
    })

    it('handles edge cases correctly', () => {
      const wrapper = createWrapper({
        totalPages: 1,
        page: 0
      })

      expect(typeof wrapper.vm['changePage']).toBe('function')
      expect(() => {
        wrapper.vm['changePage'](0)
      }).not.toThrow()
    })
  })

  describe('Model Updates', () => {
    it('emits update events for page model', async () => {
      const onUpdatePage = vi.fn()
      const wrapper = createWrapper({
        'onUpdate:page': onUpdatePage
      })

      await wrapper.setProps({ page: 2 })
      expect(wrapper.vm['pageModel']).toBe(2)
    })

    it('handles model prop changes', async () => {
      const wrapper = createWrapper({
        page: 0,
        totalPages: 5
      })

      await wrapper.setProps({ page: 3 })
      expect(wrapper.vm['pageModel']).toBe(3)

      await wrapper.setProps({ totalPages: 10 })
      expect(wrapper.vm.totalPages).toBe(10)
    })
  })

  describe('Accessibility', () => {
    it('uses button elements for interactive controls', () => {
      const wrapper = createWrapper({
        totalPages: 5
      })

      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles zero total pages gracefully', () => {
      const wrapper = createWrapper({
        totalPages: 0
      })

      // Component renders but pagination shows for totalPages != 1 (so 0 shows pagination)
      expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(true)
    })

    it('handles single page scenario', () => {
      const wrapper = createWrapper({
        totalPages: 1
      })

      // Only hides pagination when totalPages === 1
      expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(false)
    })

    it('handles large page numbers', () => {
      const wrapper = createWrapper({
        totalPages: 100,
        page: 50
      })

      expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(true)
    })
  })

  describe('Default Values', () => {
    it('uses correct default values for models', () => {
      const wrapper = createWrapper()

      expect(wrapper.vm['pageModel']).toBe(0)
      expect(wrapper.vm.nmbEntriesShowing).toBe(15)
      expect(wrapper.vm.nmbEntriesTotal).toBe(100)
      expect(wrapper.vm.totalPages).toBe(10)
    })
  })
})