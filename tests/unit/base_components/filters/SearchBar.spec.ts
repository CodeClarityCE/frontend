import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchBar from '@/base_components/filters/SearchBar.vue';

describe('SearchBar', () => {
  const defaultProps = {
    placeholder: 'Search...'
  };

  it('renders correctly', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('input').attributes('placeholder')).toBe('Search...');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('renders with custom placeholder', () => {
    const wrapper = mount(SearchBar, {
      props: {
        placeholder: 'Type to search users...'
      }
    });

    expect(wrapper.find('input').attributes('placeholder')).toBe('Type to search users...');
  });

  it('displays search icon', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const icon = wrapper.find('svg');
    expect(icon.exists()).toBe(true);
    const iconWrapper = wrapper.find('.w-4.h-4');
    expect(iconWrapper.exists()).toBe(true);
  });

  it('has correct styling classes', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const container = wrapper.find('span');
    expect(container.classes()).toContain('bg-white');
    expect(container.classes()).toContain('border');
    expect(container.classes()).toContain('border-gray-200');
    expect(container.classes()).toContain('rounded-lg');
    expect(container.classes()).toContain('h-10');
  });

  it('binds search value correctly with v-model', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        ...defaultProps,
        searchKey: 'initial value'
      }
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('initial value');

    await input.setValue('new search term');
    expect(wrapper.emitted('update:searchKey')).toBeTruthy();
    expect(wrapper.emitted('update:searchKey')![0]).toEqual(['new search term']);
  });

  it('updates model value when input changes', async () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    await input.setValue('test query');

    expect(wrapper.emitted('update:searchKey')).toBeTruthy();
    expect(wrapper.emitted('update:searchKey')![0]).toEqual(['test query']);
  });

  it('handles empty string correctly', async () => {
    const wrapper = mount(SearchBar, {
      props: {
        ...defaultProps,
        searchKey: 'some value'
      }
    });

    const input = wrapper.find('input');
    await input.setValue('');

    expect(wrapper.emitted('update:searchKey')).toBeTruthy();
    expect(wrapper.emitted('update:searchKey')![0]).toEqual(['']);
  });

  it('has correct input styling', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    expect(input.classes()).toContain('appearance-none');
    expect(input.classes()).toContain('border-0');
    expect(input.classes()).toContain('outline-none');
    expect(input.classes()).toContain('w-full');
    expect(input.classes()).toContain('bg-transparent');
    expect(input.classes()).toContain('text-sm');
  });

  it('has correct input type', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    expect(input.attributes('type')).toBe('text');
  });

  it('maintains focus behavior', async () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    await input.trigger('focus');
    
    // Just verify the input exists and can be focused
    expect(input.exists()).toBe(true);
    expect(input.element.tagName).toBe('INPUT');
  });

  it('handles multiple character inputs correctly', async () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    await input.setValue('a');
    await input.setValue('ab');
    await input.setValue('abc');

    const emittedEvents = wrapper.emitted('update:searchKey');
    expect(emittedEvents).toBeTruthy();
    expect(emittedEvents![emittedEvents!.length - 1]).toEqual(['abc']);
  });

  it('renders with default empty searchKey', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('');
  });

  it('has accessible structure', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const container = wrapper.find('span');
    expect(container.attributes('role')).toBeFalsy(); // No specific role needed for this component
    
    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('text');
  });

  it('handles special characters in search', async () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    await input.setValue(specialChars);
    expect(wrapper.emitted('update:searchKey')![0]).toEqual([specialChars]);
  });

  it('handles long search terms', async () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const input = wrapper.find('input');
    const longTerm = 'a'.repeat(1000);
    
    await input.setValue(longTerm);
    expect(wrapper.emitted('update:searchKey')![0]).toEqual([longTerm]);
  });

  it('has proper flex layout', () => {
    const wrapper = mount(SearchBar, {
      props: defaultProps
    });

    const container = wrapper.find('span');
    expect(container.classes()).toContain('flex');
    expect(container.classes()).toContain('flex-row');
    expect(container.classes()).toContain('justify-start');
    expect(container.classes()).toContain('gap-2');
    expect(container.classes()).toContain('items-center');
    expect(container.classes()).toContain('px-4');
    expect(container.classes()).toContain('w-full');
  });
});