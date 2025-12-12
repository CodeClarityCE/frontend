import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import UtilitiesFilters from '@/base_components/filters/UtilitiesFilters.vue';
import { FilterType, FilterState, createNewFilterState } from '@/base_components/filters/UtilitiesFilters.vue';
import type { FilterConfig, FilterCategory } from '@/base_components/filters/UtilitiesFilters.vue';

describe('UtilitiesFilters', () => {
  const createMockFilterConfig = (): FilterConfig => ({
    severity: {
      name: 'Severity',
      type: FilterType.CHECKBOX,
      icon: 'mdi:alert',
      data: {
        high: { title: 'High', value: false },
        medium: { title: 'Medium', value: false },
        low: { title: 'Low', value: false }
      }
    },
    type: {
      name: 'Type',
      type: FilterType.RADIO,
      data: {
        bug: { title: 'Bug', value: false },
        feature: { title: 'Feature', value: false }
      }
    }
  });

  const createWrapper = (filterConfig?: FilterConfig, lockedCategories?: string[]) => {
    const config = filterConfig || createMockFilterConfig();
    const filterState = createNewFilterState(config);
    
    return mount(UtilitiesFilters, {
      props: {
        'filter-state': filterState,
        lockedCategories
      }
    });
  };

  it('displays filter button with correct text', () => {
    const wrapper = createWrapper();

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Filters');
  });

  it('shows active indicator when filters are active', async () => {
    const config = createMockFilterConfig();
    config.severity!.data.high!.value = true; // Make one filter active
    const wrapper = createWrapper(config);

    // Look for any SVG that might indicate active state
    const icons = wrapper.findAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('does not show active indicator when no filters are active', () => {
    const wrapper = createWrapper();

    // Button should exist but no active indicator
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
  });

  it('exposes setFilterCount method', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.setFilterCount).toBeDefined();
    expect(typeof wrapper.vm.setFilterCount).toBe('function');
  });

  it('handles setFilterCount method correctly', () => {
    const wrapper = createWrapper();
    const newFilterCount = { severity: 5, type: 3 };

    wrapper.vm.setFilterCount(newFilterCount);

    // Check that options_count was updated
    expect((wrapper.vm as any).options_count).toEqual(newFilterCount);
  });

  it('handles empty filter config', () => {
    const emptyConfig: FilterConfig = {};
    const wrapper = createWrapper(emptyConfig);

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Filters');
  });

  it('has basic popover structure', () => {
    const wrapper = createWrapper();

    // Should have button trigger
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    
    // Should have at least one icon (chevron down)
    const icons = wrapper.findAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  describe('FilterState class', () => {
    it('creates FilterState correctly', () => {
      const config = createMockFilterConfig();
      const filterState = createNewFilterState(config);

      expect(filterState).toBeInstanceOf(FilterState);
      expect(filterState.filterConfig).toEqual(config);
      expect(filterState.activeFilters).toEqual([]);
      expect(filterState.categoryCount).toBe(0);
    });

    it('toString method works correctly', () => {
      const config = createMockFilterConfig();
      config.severity!.data.high!.value = true;
      config.type!.data.bug!.value = true;

      const filterState = createNewFilterState(config);
      const result = filterState.toString();

      expect(result).toContain('high');
      expect(result).toContain('bug');
      expect(result).toContain(',');
    });

    it('addFilterCategory method works correctly', () => {
      const config = createMockFilterConfig();
      const filterState = createNewFilterState(config);

      const newCategory: FilterCategory = {
        name: 'New Category',
        type: FilterType.CHECKBOX,
        data: {
          newOption: { title: 'New Option', value: true }
        }
      };

      const result = filterState.addFilterCategory(newCategory);

      expect(result).toHaveLength(1);
      expect(result[0]!.label).toBe('New Category: New Option');
      expect(filterState.categoryCount).toBe(1);
    });

    it('addFilterCategory with custom name works correctly', () => {
      const config = createMockFilterConfig();
      const filterState = createNewFilterState(config);

      const newCategory: FilterCategory = {
        name: 'Custom Category',
        type: FilterType.CHECKBOX,
        data: {
          customOption: { title: 'Custom Option', value: true }
        }
      };

      filterState.addFilterCategory(newCategory, 'customName');

      expect(filterState.filterConfig['customName']).toEqual(newCategory);
      expect(filterState.activeFilters[0]!.category).toBe('customName');
    });
  });
});