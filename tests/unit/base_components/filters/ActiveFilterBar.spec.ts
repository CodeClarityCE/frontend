import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ActiveFilterBar from '@/base_components/filters/ActiveFilterBar.vue';
import type { FilterState, ActiveFilter } from '@/base_components/filters/UtilitiesFilters.vue';
import { FilterType } from '@/base_components/filters/UtilitiesFilters.vue';

describe('ActiveFilterBar', () => {
  const createMockFilterState = (activeFilters: ActiveFilter[] = []): FilterState => ({
    filterConfig: {
      severity: {
        name: 'Severity',
        type: FilterType.CHECKBOX,
        data: {
          high: { title: 'High', value: true },
          medium: { title: 'Medium', value: false }
        }
      }
    },
    activeFilters,
    categoryCount: 1
  } as FilterState);

  const mockCheckboxFilter: ActiveFilter = {
    label: 'Severity: High',
    category: 'severity',
    type: FilterType.CHECKBOX,
    option: 'high'
  };

  const mockRadioFilter: ActiveFilter = {
    label: 'Type: Bug',
    category: 'type',
    type: FilterType.RADIO,
    option: 'bug'
  };

  it('renders correctly with no active filters', () => {
    const filterState = createMockFilterState([]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    expect(wrapper.find('.flex').exists()).toBe(true);
    expect(wrapper.findAll('.bg-gray-200')).toHaveLength(0);
  });

  it('renders correctly with active filters', () => {
    const filterState = createMockFilterState([mockCheckboxFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    expect(wrapper.findAll('.bg-gray-200')).toHaveLength(1);
    expect(wrapper.text()).toContain('Severity: High');
  });

  it('displays multiple active filters', () => {
    const filterState = createMockFilterState([mockCheckboxFilter, mockRadioFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    expect(wrapper.findAll('.bg-gray-200')).toHaveLength(2);
    expect(wrapper.text()).toContain('Severity: High');
    expect(wrapper.text()).toContain('Type: Bug');
  });

  it('shows remove button for checkbox filters', () => {
    const filterState = createMockFilterState([mockCheckboxFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const removeButton = wrapper.find('.cursor-pointer');
    expect(removeButton.exists()).toBe(true);
    expect(removeButton.attributes('title')).toBe('Remove filter');
  });

  it('does not show remove button for radio filters', () => {
    const filterState = createMockFilterState([mockRadioFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const removeButton = wrapper.find('.cursor-pointer');
    expect(removeButton.exists()).toBe(false);
  });

  it('removes filter when close button is clicked', async () => {
    const filterState = createMockFilterState([mockCheckboxFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const removeButton = wrapper.find('.cursor-pointer');
    expect(removeButton.exists()).toBe(true);

    await removeButton.trigger('click');

    // Check that the filter value was set to false
    expect(filterState.filterConfig.severity.data.high.value).toBe(false);
  });

  it('has correct styling for filter chips', () => {
    const filterState = createMockFilterState([mockCheckboxFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const filterChip = wrapper.find('.bg-gray-200');
    expect(filterChip.classes()).toContain('w-fit');
    expect(filterChip.classes()).toContain('bg-gray-200');
    expect(filterChip.classes()).toContain('py-1');
    expect(filterChip.classes()).toContain('px-2');
    expect(filterChip.classes()).toContain('rounded');
    expect(filterChip.classes()).toContain('flex');
    expect(filterChip.classes()).toContain('flex-row');
    expect(filterChip.classes()).toContain('gap-2');
    expect(filterChip.classes()).toContain('items-center');
    expect(filterChip.classes()).toContain('font-normal');
    expect(filterChip.classes()).toContain('text-grayTitle');
  });

  it('has correct container styling', () => {
    const filterState = createMockFilterState([]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const container = wrapper.find('.flex');
    expect(container.classes()).toContain('flex');
    expect(container.classes()).toContain('flex-row');
    expect(container.classes()).toContain('gap-2');
    expect(container.classes()).toContain('flex-wrap');
  });

  it('handles filter state updates correctly', async () => {
    const filterState = createMockFilterState([mockCheckboxFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    // Initially should show one filter
    expect(wrapper.findAll('.bg-gray-200')).toHaveLength(1);

    // Create new filter state with both filters
    const updatedFilterState = createMockFilterState([mockCheckboxFilter, mockRadioFilter]);
    await wrapper.setProps({ filterState: updatedFilterState });

    expect(wrapper.findAll('.bg-gray-200')).toHaveLength(2);
  });

  it('displays correct filter labels', () => {
    const customFilter: ActiveFilter = {
      label: 'Custom Category: Custom Value',
      category: 'custom',
      type: FilterType.CHECKBOX,
      option: 'value'
    };
    const filterState = createMockFilterState([customFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    expect(wrapper.text()).toContain('Custom Category: Custom Value');
  });

  it('handles remove button styling for checkbox filters', () => {
    const filterState = createMockFilterState([mockCheckboxFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const removeButton = wrapper.find('.cursor-pointer');
    expect(removeButton.classes()).toContain('cursor-pointer');
    expect(removeButton.classes()).toContain('text-gray-400');
    expect(removeButton.attributes('style')).toContain('cursor: pointer');
    expect(removeButton.attributes('style')).toContain('color: rgb(191, 191, 191)');
  });

  it('handles radio filter display correctly', () => {
    const filterState = createMockFilterState([mockRadioFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const radioIndicator = wrapper.find('.text-gray-400');
    expect(radioIndicator.exists()).toBe(true);
    
    // Should not have remove functionality
    const removeButton = wrapper.find('.cursor-pointer');
    expect(removeButton.exists()).toBe(false);
  });

  it('maintains filter order', () => {
    const filter1: ActiveFilter = {
      label: 'First: Value1',
      category: 'first',
      type: FilterType.CHECKBOX,
      option: 'value1'
    };
    const filter2: ActiveFilter = {
      label: 'Second: Value2',
      category: 'second',
      type: FilterType.CHECKBOX,
      option: 'value2'
    };
    const filterState = createMockFilterState([filter1, filter2]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const filterElements = wrapper.findAll('.bg-gray-200');
    expect(filterElements[0].text()).toContain('First: Value1');
    expect(filterElements[1].text()).toContain('Second: Value2');
  });

  it('handles mixed filter types correctly', () => {
    const filterState = createMockFilterState([mockCheckboxFilter, mockRadioFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const filterElements = wrapper.findAll('.bg-gray-200');
    expect(filterElements).toHaveLength(2);

    // Checkbox filter should have remove button
    const checkboxFilter = filterElements[0];
    expect(checkboxFilter.find('.cursor-pointer').exists()).toBe(true);

    // Radio filter should not have remove button
    const radioFilter = filterElements[1];
    expect(radioFilter.find('.cursor-pointer').exists()).toBe(false);
  });

  it('updates filter state correctly when removing filters', async () => {
    const filterState = createMockFilterState([mockCheckboxFilter]);
    
    // Spy on the filter state to ensure it gets modified
    const originalValue = filterState.filterConfig.severity.data.high.value;
    expect(originalValue).toBe(true);

    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const removeButton = wrapper.find('.cursor-pointer');
    await removeButton.trigger('click');

    expect(filterState.filterConfig.severity.data.high.value).toBe(false);
  });

  it('handles empty filter list gracefully', () => {
    const filterState = createMockFilterState([]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    expect(wrapper.find('.flex').exists()).toBe(true);
    expect(wrapper.findAll('.bg-gray-200')).toHaveLength(0);
    expect(wrapper.text().trim()).toBe('');
  });

  it('handles filter with complex labels', () => {
    const complexFilter: ActiveFilter = {
      label: 'Very Long Category Name: Very Long Option Name With Special Characters!@#$%',
      category: 'complex',
      type: FilterType.CHECKBOX,
      option: 'complex_option'
    };
    const filterState = createMockFilterState([complexFilter]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    expect(wrapper.text()).toContain('Very Long Category Name: Very Long Option Name With Special Characters!@#$%');
  });

  it('uses unique keys for filter elements', () => {
    const filter1: ActiveFilter = {
      label: 'Category: Option1',
      category: 'test',
      type: FilterType.CHECKBOX,
      option: 'option1'
    };
    const filter2: ActiveFilter = {
      label: 'Category: Option2',
      category: 'test',
      type: FilterType.CHECKBOX,
      option: 'option2'
    };
    const filterState = createMockFilterState([filter1, filter2]);
    const wrapper = mount(ActiveFilterBar, {
      props: {
        filterState
      }
    });

    const filterElements = wrapper.findAll('.bg-gray-200');
    expect(filterElements.length).toBe(2);
  });
});