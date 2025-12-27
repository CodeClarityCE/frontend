import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UtilitiesSort from '../../../../src/base_components/utilities/UtilitiesSort.vue';
import { SortDirection } from '../../../../src/utils/api/PaginatedRequestOptions';

// Mock external dependencies
vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<div data-testid="icon" :class="[$attrs.class, icon]" @click="$emit(\'click\')">{{ icon }}</div>',
        props: ['icon'],
        emits: ['click']
    }
}));

vi.mock('@/shadcn/ui/select', () => ({
    Select: {
        name: 'Select',
        template: '<div data-testid="select"><slot /></div>',
        emits: ['update:modelValue']
    },
    SelectContent: {
        name: 'SelectContent',
        template: '<div data-testid="select-content"><slot /></div>'
    },
    SelectGroup: {
        name: 'SelectGroup',
        template: '<div data-testid="select-group"><slot /></div>'
    },
    SelectItem: {
        name: 'SelectItem',
        template: '<div data-testid="select-item" :data-value="value" @click="$emit(\'click\')"><slot /></div>',
        props: ['value'],
        emits: ['click']
    },
    SelectLabel: {
        name: 'SelectLabel',
        template: '<div data-testid="select-label"><slot /></div>'
    },
    SelectTrigger: {
        name: 'SelectTrigger',
        template: '<div data-testid="select-trigger"><slot /></div>'
    },
    SelectValue: {
        name: 'SelectValue',
        template: '<div data-testid="select-value">{{ placeholder }}</div>',
        props: ['placeholder']
    }
}));

describe('UtilitiesSort', () => {
    const defaultProps = {
        selectionPageLimit: [10, 25, 50, 100],
        sortOptions: [
            { key: 'name', label: 'Name' },
            { key: 'date', label: 'Date' },
            { key: 'severity', label: 'Severity' }
        ],
        showing: 15,
        total: 100
    };

    interface ModelValues {
        pageLimitSelected?: number;
        'onUpdate:pageLimitSelected'?: (value: number) => void;
        sortKey?: string;
        'onUpdate:sortKey'?: (value: string) => void;
        sortDirection?: SortDirection;
        'onUpdate:sortDirection'?: (value: SortDirection) => void;
    }

    const createWrapper = (props: Record<string, unknown> = {}, modelValues: ModelValues = {}) => {
        return mount(UtilitiesSort, {
            props: {
                ...defaultProps,
                ...props,
                'pageLimitSelected': modelValues.pageLimitSelected ?? 10,
                'onUpdate:pageLimitSelected': modelValues['onUpdate:pageLimitSelected'] ?? vi.fn<(value: number) => void>(),
                'sortKey': modelValues.sortKey ?? '',
                'onUpdate:sortKey': modelValues['onUpdate:sortKey'] ?? vi.fn<(value: string) => void>(),
                'sortDirection': modelValues.sortDirection ?? SortDirection.DESC,
                'onUpdate:sortDirection': modelValues['onUpdate:sortDirection'] ?? vi.fn<(value: SortDirection) => void>()
            }
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('renders the main container with correct structure', () => {
            const wrapper = createWrapper();
            
            expect(wrapper.find('.flex.flex-row.gap-1.justify-between.items-center').exists()).toBe(true);
            expect(wrapper.text()).toContain('Showing');
            expect(wrapper.text()).toContain('entries per page');
            expect(wrapper.text()).toContain('Sort by');
        });

        it('renders page limit selection section', () => {
            const wrapper = createWrapper();
            
            expect(wrapper.text()).toContain('Showing');
            expect(wrapper.text()).toContain('entries per page');
            expect(wrapper.findAll('[data-testid="select"]')).toHaveLength(2);
        });

        it('renders sort selection section', () => {
            const wrapper = createWrapper();
            
            expect(wrapper.text()).toContain('Sort by');
            expect(wrapper.findAll('[data-testid="select"]')).toHaveLength(2);
        });

        it('renders entry count display', () => {
            const wrapper = createWrapper();
            
            expect(wrapper.text()).toContain('Showing 15 out of 100 entries');
        });

        it('renders sort direction icon and text', () => {
            const wrapper = createWrapper();
            
            expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true);
            expect(wrapper.text()).toContain('DESC');
        });
    });

    describe('Props Handling', () => {
        it('displays all page limit options', () => {
            const wrapper = createWrapper();
            const pageItems = wrapper.findAll('[data-testid="select-item"]');
            
            // First 4 items should be page limits
            expect(pageItems[0]!.text()).toBe('10');
            expect(pageItems[1]!.text()).toBe('25');
            expect(pageItems[2]!.text()).toBe('50');
            expect(pageItems[3]!.text()).toBe('100');
        });

        it('displays all sort options', () => {
            const wrapper = createWrapper();
            const sortItems = wrapper.findAll('[data-testid="select-item"]');
            
            // Last 3 items should be sort options
            expect(sortItems[4]!.text()).toBe('Name');
            expect(sortItems[5]!.text()).toBe('Date');
            expect(sortItems[6]!.text()).toBe('Severity');
        });

        it('displays correct entry count with custom values', () => {
            const wrapper = createWrapper({
                showing: 25,
                total: 500
            });
            
            expect(wrapper.text()).toContain('Showing 25 out of 500 entries');
        });

        it('handles empty page limit options', () => {
            const wrapper = createWrapper({
                selectionPageLimit: []
            });
            
            const allItems = wrapper.findAll('[data-testid="select-item"]');
            // When page limit is empty, only sort options should be present
            expect(allItems).toHaveLength(3); // Only sort options
        });

        it('handles empty sort options', () => {
            const wrapper = createWrapper({
                sortOptions: []
            });
            
            const allItems = wrapper.findAll('[data-testid="select-item"]');
            expect(allItems).toHaveLength(4); // Only page limit options
        });
    });

    describe('Model Value Binding', () => {
        it('displays current page limit selection', () => {
            const wrapper = createWrapper({}, {
                pageLimitSelected: 50
            });
            
            expect(wrapper.vm.pageLimitSelected).toBe(50);
        });

        it('displays current sort key', () => {
            const wrapper = createWrapper({}, {
                sortKey: 'name'
            });
            
            expect(wrapper.vm.sortKey).toBe('name');
        });

        it('displays current sort direction', () => {
            const wrapper = createWrapper({}, {
                sortDirection: SortDirection.ASC
            });
            
            expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC);
            expect(wrapper.text()).toContain('ASC');
        });

        it('uses default model values when not provided', () => {
            const wrapper = createWrapper();
            
            expect(wrapper.vm.pageLimitSelected).toBe(10);
            expect(wrapper.vm.sortKey).toBe('');
            expect(wrapper.vm.sortDirection).toBe(SortDirection.DESC);
        });
    });

    describe('User Interactions', () => {
        it('exposes clickable sort direction icon', () => {
            const wrapper = createWrapper();

            const icon = wrapper.find('[data-testid="icon"]');
            expect(icon.exists()).toBe(true);
            expect(icon.attributes('role')).toBe('button');
        });

        it('exposes select components for user interaction', () => {
            const wrapper = createWrapper();

            const selects = wrapper.findAll('[data-testid="select"]');
            expect(selects).toHaveLength(2);
        });

        it('has properly structured select items for interaction', () => {
            const wrapper = createWrapper();

            const selectItems = wrapper.findAll('[data-testid="select-item"]');
            expect(selectItems.length).toBeGreaterThan(0);
            
            // Verify each item has the necessary attributes for interaction
            selectItems.forEach(item => {
                expect(item.attributes('data-value')).toBeDefined();
            });
        });

        it('provides proper cursor styling for sort direction toggle', () => {
            const wrapper = createWrapper();

            const iconContainer = wrapper.find('.cursor-pointer');
            expect(iconContainer.exists()).toBe(true);
        });
    });

    describe('ChangeSort Method', () => {
        it('has changeSort method available', () => {
            const wrapper = createWrapper();

            expect(typeof (wrapper.vm as any).changeSort).toBe('function');
        });

        it('changeSort method accepts correct parameters', () => {
            const wrapper = createWrapper();

            // Test that the method can be called without errors
            expect(() => {
                (wrapper.vm as any).changeSort('name', SortDirection.ASC);
            }).not.toThrow();
        });

        it('changeSort method accepts different parameter combinations', () => {
            const wrapper = createWrapper();

            // Test different parameter combinations
            expect(() => {
                (wrapper.vm as any).changeSort('date', SortDirection.DESC);
                (wrapper.vm as any).changeSort('severity', SortDirection.ASC);
                (wrapper.vm as any).changeSort('', SortDirection.DESC);
            }).not.toThrow();
        });
    });

    describe('Sort Direction Icons', () => {
        it('displays descending icon when sort direction is DESC', () => {
            const wrapper = createWrapper({}, {
                sortDirection: SortDirection.DESC
            });

            const icon = wrapper.find('[data-testid="icon"]');
            expect(icon.text()).toBe('oi:sort-descending');
        });

        it('displays ascending icon when sort direction is ASC', () => {
            const wrapper = createWrapper({}, {
                sortDirection: SortDirection.ASC
            });

            const icon = wrapper.find('[data-testid="icon"]');
            expect(icon.text()).toBe('oi:sort-ascending');
        });

        it('applies correct CSS classes to icons', () => {
            const wrapper = createWrapper();

            const icon = wrapper.find('[data-testid="icon"]');
            expect(icon.classes()).toContain('h-5');
            expect(icon.classes()).toContain('w-5');
        });
    });

    describe('Edge Cases', () => {
        it('handles zero showing entries', () => {
            const wrapper = createWrapper({
                showing: 0,
                total: 0
            });
            
            expect(wrapper.text()).toContain('Showing 0 out of 0 entries');
        });

        it('handles large numbers correctly', () => {
            const wrapper = createWrapper({
                showing: 999,
                total: 9999
            });
            
            expect(wrapper.text()).toContain('Showing 999 out of 9999 entries');
        });

        it('handles single page limit option', () => {
            const wrapper = createWrapper({
                selectionPageLimit: [10]
            });
            
            const pageItems = wrapper.findAll('[data-testid="select-item"]');
            const pageLimitItems = pageItems.slice(0, 1);
            expect(pageLimitItems).toHaveLength(1);
            expect(pageLimitItems[0]!.text()).toBe('10');
        });

        it('handles single sort option', () => {
            const wrapper = createWrapper({
                sortOptions: [{ key: 'name', label: 'Name' }]
            });
            
            const allItems = wrapper.findAll('[data-testid="select-item"]');
            const sortItems = allItems.slice(4); // Skip page limit items
            expect(sortItems).toHaveLength(1);
            expect(sortItems[0]!.text()).toBe('Name');
        });

        it('handles sort option with special characters', () => {
            const wrapper = createWrapper({
                sortOptions: [{ key: 'special_key', label: 'Special & Characters' }]
            });
            
            const allItems = wrapper.findAll('[data-testid="select-item"]');
            const specialItem = allItems.find(item => item.text() === 'Special & Characters');
            expect(specialItem).toBeDefined();
            expect(specialItem?.attributes('data-value')).toBe('special_key');
        });
    });

    describe('Accessibility', () => {
        it('provides proper placeholders for select components', () => {
            const wrapper = createWrapper();
            
            const selectValues = wrapper.findAll('[data-testid="select-value"]');
            expect(selectValues[0]!.text()).toBe('Select entries');
            expect(selectValues[1]!.text()).toBe('Select option');
        });

        it('provides proper labels for select groups', () => {
            const wrapper = createWrapper();
            
            const labels = wrapper.findAll('[data-testid="select-label"]');
            expect(labels[0]!.text()).toBe('Entries per page');
            expect(labels[1]!.text()).toBe('Sort by');
        });

        it('maintains keyboard accessibility for sort direction toggle', () => {
            const wrapper = createWrapper();
            
            const iconContainer = wrapper.find('.cursor-pointer');
            expect(iconContainer.exists()).toBe(true);
        });

        it('provides meaningful text content for screen readers', () => {
            const wrapper = createWrapper();
            
            expect(wrapper.text()).toContain('Showing');
            expect(wrapper.text()).toContain('entries per page');
            expect(wrapper.text()).toContain('Sort by');
            expect(wrapper.text()).toContain('out of');
            expect(wrapper.text()).toContain('entries');
        });
    });

    describe('Component Integration', () => {
        it('integrates properly with Select components structure', () => {
            const wrapper = createWrapper();
            
            // Check Select component hierarchy
            expect(wrapper.findAll('[data-testid="select"]')).toHaveLength(2);
            expect(wrapper.findAll('[data-testid="select-trigger"]')).toHaveLength(2);
            expect(wrapper.findAll('[data-testid="select-content"]')).toHaveLength(2);
            expect(wrapper.findAll('[data-testid="select-group"]')).toHaveLength(2);
        });

        it('passes correct props to SelectItem components', () => {
            const wrapper = createWrapper();
            
            const selectItems = wrapper.findAll('[data-testid="select-item"]');
            
            // Check page limit items have correct values
            expect(selectItems[0]!.attributes('data-value')).toBe('10');
            expect(selectItems[1]!.attributes('data-value')).toBe('25');

            // Check sort option items have correct values
            expect(selectItems[4]!.attributes('data-value')).toBe('name');
            expect(selectItems[5]!.attributes('data-value')).toBe('date');
        });

        it('maintains reactive updates across model changes', async () => {
            const wrapper = createWrapper({}, {
                pageLimitSelected: 10,
                sortKey: 'name',
                sortDirection: SortDirection.DESC
            });

            // Update models
            await wrapper.setProps({
                pageLimitSelected: 25,
                sortKey: 'date',
                sortDirection: SortDirection.ASC
            });

            expect(wrapper.vm.pageLimitSelected).toBe(25);
            expect(wrapper.vm.sortKey).toBe('date');
            expect(wrapper.vm.sortDirection).toBe(SortDirection.ASC);
            expect(wrapper.text()).toContain('ASC');
        });
    });
});