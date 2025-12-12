import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SemverToString from '@/base_components/utilities/SemverToString.vue'

// Mock Badge component
const mockBadge = {
  template: '<span class="badge" :class="variant ? `badge-${variant}` : \'\'"><slot /></span>',
  props: ['variant']
}

describe('SemverToString', () => {
  const globalComponents = {
    Badge: mockBadge
  }

  describe('Rendering with valid semver', () => {
    it('renders semver version string correctly', () => {
      const semver = {
        Major: 1,
        Minor: 2,
        Patch: 3,
        PreReleaseTag: '',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toBe('1.2.3')
      expect(wrapper.findComponent(mockBadge).exists()).toBe(true)
    })

    it('renders semver with pre-release tag', () => {
      const semver = {
        Major: 2,
        Minor: 0,
        Patch: 0,
        PreReleaseTag: 'alpha.1',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toBe('2.0.0-alpha.1')
    })

    it('handles zero versions correctly', () => {
      const semver = {
        Major: 0,
        Minor: 0,
        Patch: 1,
        PreReleaseTag: '',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toBe('0.0.1')
    })

    it('does not show dash when PreReleaseTag is empty', () => {
      const semver = {
        Major: 1,
        Minor: 0,
        Patch: 0,
        PreReleaseTag: '',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toBe('1.0.0')
      expect(wrapper.text()).not.toContain('-')
    })

    it('shows dash when PreReleaseTag is not empty', () => {
      const semver = {
        Major: 1,
        Minor: 0,
        Patch: 0,
        PreReleaseTag: 'beta',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toBe('1.0.0-beta')
      expect(wrapper.text()).toContain('-')
    })
  })

  describe('Rendering with null/undefined semver', () => {
    it('renders "unpatchable" when semver is null', () => {
      // Suppress Vue warning for intentional null prop test
      const originalWarn = console.warn;
      console.warn = vi.fn();

      const wrapper = mount(SemverToString, {
        props: { semver: undefined },
        global: {
          components: globalComponents
        }
      })
      
      // Restore console.warn
      console.warn = originalWarn;

      expect(wrapper.text()).toBe('unpatchable')
      const badge = wrapper.findComponent(mockBadge)
      expect(badge.exists()).toBe(true)
      expect(badge.props('variant')).toBe('destructive')
    })

    it('renders "unpatchable" when semver is undefined', () => {
      // Suppress Vue warning for intentional undefined prop test
      const originalWarn = console.warn;
      console.warn = vi.fn();
      
      const wrapper = mount(SemverToString, {
        props: { semver: undefined },
        global: {
          components: globalComponents
        }
      })
      
      // Restore console.warn
      console.warn = originalWarn;

      expect(wrapper.text()).toBe('unpatchable')
      const badge = wrapper.findComponent(mockBadge)
      expect(badge.props('variant')).toBe('destructive')
    })
  })

  describe('Badge component usage', () => {
    it('uses default badge for valid semver', () => {
      const semver = {
        Major: 1,
        Minor: 2,
        Patch: 3,
        PreReleaseTag: '',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      const badge = wrapper.findComponent(mockBadge)
      expect(badge.props('variant')).toBeUndefined()
    })

    it('uses destructive variant for unpatchable', () => {
      // Suppress Vue warning for intentional null prop test
      const originalWarn = console.warn;
      console.warn = vi.fn();

      const wrapper = mount(SemverToString, {
        props: { semver: undefined },
        global: {
          components: globalComponents
        }
      })
      
      // Restore console.warn
      console.warn = originalWarn;

      const badge = wrapper.findComponent(mockBadge)
      expect(badge.props('variant')).toBe('destructive')
    })
  })

  describe('Edge cases', () => {
    it('handles large version numbers', () => {
      const semver = {
        Major: 999,
        Minor: 888,
        Patch: 777,
        PreReleaseTag: '',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toBe('999.888.777')
    })

    it('handles complex pre-release tags', () => {
      const semver = {
        Major: 1,
        Minor: 0,
        Patch: 0,
        PreReleaseTag: 'alpha.beta.1+build.123',
        MetaData: ''
      }

      const wrapper = mount(SemverToString, {
        props: { semver },
        global: {
          components: globalComponents
        }
      })

      expect(wrapper.text()).toBe('1.0.0-alpha.beta.1+build.123')
    })
  })
})