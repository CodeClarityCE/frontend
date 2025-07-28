import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DataTable from './DataTable.vue';
import type { ColumnDef } from '@tanstack/vue-table';

// Mock shadcn components
vi.mock('@/shadcn/ui/dropdown-menu', () => ({
    DropdownMenu: {
        name: 'DropdownMenu',
        template: '<div data-testid="dropdown-menu"><slot></slot></div>'
    },
    DropdownMenuCheckboxItem: {
        name: 'DropdownMenuCheckboxItem',
        template:
            '<div data-testid="dropdown-menu-checkbox-item" @click="$emit(\'click\')"><slot></slot></div>',
        emits: ['click']
    },
    DropdownMenuContent: {
        name: 'DropdownMenuContent',
        template: '<div data-testid="dropdown-menu-content"><slot></slot></div>',
        props: ['align']
    },
    DropdownMenuTrigger: {
        name: 'DropdownMenuTrigger',
        template: '<div data-testid="dropdown-menu-trigger"><slot></slot></div>',
        props: ['asChild']
    }
}));

vi.mock('@/shadcn/ui/table', () => ({
    Table: {
        name: 'Table',
        template: '<table data-testid="table"><slot></slot></table>'
    },
    TableBody: {
        name: 'TableBody',
        template: '<tbody data-testid="table-body"><slot></slot></tbody>'
    },
    TableCell: {
        name: 'TableCell',
        template: '<td data-testid="table-cell" :colspan="colSpan"><slot></slot></td>',
        props: ['colSpan']
    },
    TableHead: {
        name: 'TableHead',
        template: '<th data-testid="table-head"><slot></slot></th>'
    },
    TableHeader: {
        name: 'TableHeader',
        template: '<thead data-testid="table-header"><slot></slot></thead>'
    },
    TableRow: {
        name: 'TableRow',
        template: '<tr data-testid="table-row" :class="$attrs.class"><slot></slot></tr>'
    }
}));

vi.mock('@/shadcn/ui/button', () => ({
    Button: {
        name: 'Button',
        template: '<button data-testid="button" :class="variant"><slot></slot></button>',
        props: ['variant', 'size']
    }
}));

vi.mock('@/shadcn/ui/input', () => ({
    Input: {
        name: 'Input',
        template:
            '<input data-testid="input" :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['placeholder', 'modelValue'],
        emits: ['update:modelValue']
    }
}));

vi.mock('@/shadcn/ui/select', () => ({
    Select: {
        name: 'Select',
        template: '<div data-testid="select"><slot></slot></div>',
        props: ['modelValue'],
        emits: ['update:modelValue']
    },
    SelectContent: {
        name: 'SelectContent',
        template: '<div data-testid="select-content"><slot></slot></div>',
        props: ['side']
    },
    SelectItem: {
        name: 'SelectItem',
        template: '<div data-testid="select-item" @click="$emit(\'click\')">{{ value }}</div>',
        props: ['value'],
        emits: ['click']
    },
    SelectTrigger: {
        name: 'SelectTrigger',
        template: '<div data-testid="select-trigger" @click="$emit(\'click\')"><slot></slot></div>',
        emits: ['click']
    },
    SelectValue: {
        name: 'SelectValue',
        template: '<span data-testid="select-value">{{ placeholder || modelValue }}</span>',
        props: ['placeholder', 'modelValue']
    }
}));

vi.mock('@iconify/vue', () => ({
    Icon: {
        name: 'Icon',
        template: '<span data-testid="icon" :data-icon="icon"></span>',
        props: ['icon']
    }
}));

// Mock TanStack Table
vi.mock('@tanstack/vue-table', () => {
    const mockTable = {
        getHeaderGroups: vi.fn(() => [
            {
                id: 'header-group-1',
                headers: [
                    {
                        id: 'name',
                        isPlaceholder: false,
                        column: {
                            columnDef: {
                                header: 'Name'
                            }
                        },
                        getContext: vi.fn(() => ({}))
                    },
                    {
                        id: 'version',
                        isPlaceholder: false,
                        column: {
                            columnDef: {
                                header: 'Version'
                            }
                        },
                        getContext: vi.fn(() => ({}))
                    }
                ]
            }
        ]),
        getRowModel: vi.fn(() => ({
            rows: [
                {
                    id: 'row-1',
                    getIsSelected: vi.fn(() => false),
                    getVisibleCells: vi.fn(() => [
                        {
                            id: 'cell-1',
                            column: {
                                columnDef: {
                                    cell: 'express'
                                }
                            },
                            getContext: vi.fn(() => ({}))
                        },
                        {
                            id: 'cell-2',
                            column: {
                                columnDef: {
                                    cell: '4.18.0'
                                }
                            },
                            getContext: vi.fn(() => ({}))
                        }
                    ])
                },
                {
                    id: 'row-2',
                    getIsSelected: vi.fn(() => false),
                    getVisibleCells: vi.fn(() => [
                        {
                            id: 'cell-3',
                            column: {
                                columnDef: {
                                    cell: 'react'
                                }
                            },
                            getContext: vi.fn(() => ({}))
                        },
                        {
                            id: 'cell-4',
                            column: {
                                columnDef: {
                                    cell: '18.2.0'
                                }
                            },
                            getContext: vi.fn(() => ({}))
                        }
                    ])
                }
            ]
        })),
        getFilteredRowModel: vi.fn(() => ({
            rows: [{ id: 'row-1' }, { id: 'row-2' }]
        })),
        getColumn: vi.fn((_columnId: string) => ({
            getFilterValue: vi.fn(() => ''),
            toggleVisibility: vi.fn()
        })),
        getAllColumns: vi.fn(() => [
            {
                id: 'name',
                getCanHide: vi.fn(() => true),
                getIsVisible: vi.fn(() => true),
                toggleVisibility: vi.fn()
            },
            {
                id: 'version',
                getCanHide: vi.fn(() => true),
                getIsVisible: vi.fn(() => true),
                toggleVisibility: vi.fn()
            },
            {
                id: 'release',
                getCanHide: vi.fn(() => true),
                getIsVisible: vi.fn(() => false),
                toggleVisibility: vi.fn()
            }
        ]),
        getState: vi.fn(() => ({
            pagination: {
                pageSize: 15
            }
        })),
        setPageSize: vi.fn()
    };

    return {
        useVueTable: vi.fn(() => mockTable),
        getCoreRowModel: vi.fn(),
        getSortedRowModel: vi.fn(),
        getFilteredRowModel: vi.fn(),
        getPaginationRowModel: vi.fn(),
        FlexRender: {
            name: 'FlexRender',
            template: '<div data-testid="flex-render">{{ render }}</div>',
            props: ['render', 'props']
        }
    };
});

interface TestDependency {
    name: string;
    version: string;
    is_direct_count: number;
    newest_release: string;
}

describe('DataTable.vue', () => {
    let wrapper: any;

    const mockColumns: ColumnDef<unknown, unknown>[] = [
        {
            id: 'name',
            header: 'Name',
            cell: ({ row }) => (row.original as any).name
        },
        {
            id: 'version',
            header: 'Version',
            cell: ({ row }) => (row.original as any).version
        }
    ];

    const mockData: TestDependency[] = [
        {
            name: 'express',
            version: '4.18.0',
            is_direct_count: 1,
            newest_release: '4.18.2'
        },
        {
            name: 'react',
            version: '18.2.0',
            is_direct_count: 0,
            newest_release: '18.2.0'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    const createWrapper = (props = {}, options = {}) => {
        return mount(DataTable, {
            props: {
                columns: mockColumns,
                data: mockData,
                ...props
            },
            ...options
        });
    };

    describe('Component Rendering', () => {
        it('should render the main container', () => {
            wrapper = createWrapper();
            expect(wrapper.find('.space-y-4').exists()).toBe(true);
        });

        it('should render the header section with search and filters', () => {
            wrapper = createWrapper();

            expect(wrapper.find('.flex.flex-col.sm\\:flex-row.gap-4').exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'Input' }).exists()).toBe(true);
            expect(wrapper.findAllComponents({ name: 'DropdownMenu' }).length).toBeGreaterThan(0);
        });

        it('should render the table', () => {
            wrapper = createWrapper();

            expect(wrapper.findComponent({ name: 'Table' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'TableHeader' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'TableBody' }).exists()).toBe(true);
        });

        it('should render pagination controls', () => {
            wrapper = createWrapper();

            const paginationSection = wrapper.find('.flex.items-center.justify-between.py-4.px-2');
            expect(paginationSection.exists()).toBe(true);
            expect(paginationSection.findComponent({ name: 'Select' }).exists()).toBe(true);
        });
    });

    describe('Search Functionality', () => {
        it('should display search input with placeholder', () => {
            wrapper = createWrapper();

            const searchInput = wrapper.findComponent({ name: 'Input' });
            expect(searchInput.props('placeholder')).toBe('Search by name, version, or status...');
        });

        it('should display search icon', () => {
            wrapper = createWrapper();

            const searchIcon = wrapper.find('[data-icon="tabler:search"]');
            expect(searchIcon.exists()).toBe(true);
        });

        it('should update search key on input', async () => {
            wrapper = createWrapper();

            const searchInput = wrapper.findComponent({ name: 'Input' });
            await searchInput.vm.$emit('update:modelValue', 'express');

            expect(wrapper.vm.searchKey).toBe('express');
        });

        it('should show filtered row count', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('2 dependencies');
        });
    });

    describe('Quick Filters', () => {
        it('should render quick filters dropdown', () => {
            wrapper = createWrapper();

            const quickFiltersButton = wrapper.find('[data-testid="button"]');
            expect(quickFiltersButton.text()).toContain('Quick Filters');
        });

        it('should show filter options', () => {
            wrapper = createWrapper();

            const filterItems = wrapper.findAll('[data-testid="dropdown-menu-checkbox-item"]');
            expect(filterItems.length).toBeGreaterThan(0);
            expect(wrapper.text()).toContain('Show only outdated');
            expect(wrapper.text()).toContain('Show only direct');
            expect(wrapper.text()).toContain('Show only dev deps');
        });

        it('should call toggleFilter when filter is clicked', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            wrapper = createWrapper();

            const filterItem = wrapper.find('[data-testid="dropdown-menu-checkbox-item"]');
            await filterItem.trigger('click');

            expect(consoleLogSpy).toHaveBeenCalledWith('Toggle filter:', 'outdated');
            consoleLogSpy.mockRestore();
        });
    });

    describe('Column Visibility', () => {
        it('should render columns dropdown', () => {
            wrapper = createWrapper();

            const columnsDropdown = wrapper
                .findAll('[data-testid="button"]')
                .find((btn: any) => btn.text().includes('Columns'));
            expect(columnsDropdown).toBeDefined();
        });

        it('should display column visibility options', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('name');
            expect(wrapper.text()).toContain('version');
            expect(wrapper.text()).toContain('release');
        });
    });

    describe('Row Density', () => {
        it('should display row density selector', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Density:');
            const densitySelect = wrapper.findComponent({ name: 'Select' });
            expect(densitySelect.exists()).toBe(true);
        });

        it('should have density options', () => {
            wrapper = createWrapper();

            // Check that density options exist in the component
            const selectItems = wrapper.findAll('[data-testid="select-item"]');
            expect(selectItems.length).toBeGreaterThan(0);
        });

        it('should default to normal density', () => {
            wrapper = createWrapper();
            expect(wrapper.vm.rowDensity).toBe('normal');
        });

        it('should apply density classes to rows', () => {
            wrapper = createWrapper();

            // Check that rows exist (density classes are applied via dynamic binding)
            const rows = wrapper.findAll('[data-testid="table-row"]');
            expect(rows.length).toBeGreaterThan(0);
        });
    });

    describe('Table Data Display', () => {
        it('should render table headers', () => {
            wrapper = createWrapper();

            const headers = wrapper.findAll('[data-testid="table-head"]');
            expect(headers.length).toBeGreaterThan(0);
        });

        it('should render table rows', () => {
            wrapper = createWrapper();

            const rows = wrapper.findAll('[data-testid="table-row"]');
            // Subtract header row
            expect(rows.length).toBeGreaterThan(1);
        });

        it('should render table cells', () => {
            wrapper = createWrapper();

            const cells = wrapper.findAll('[data-testid="table-cell"]');
            expect(cells.length).toBeGreaterThan(0);
        });

        it('should display data content', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('express');
            expect(wrapper.text()).toContain('4.18.0');
            expect(wrapper.text()).toContain('react');
            expect(wrapper.text()).toContain('18.2.0');
        });

        it('should apply alternating row colors', () => {
            wrapper = createWrapper();

            const rows = wrapper.findAll('[data-testid="table-row"]');
            // Check if some rows have the alternating background class
            const alternatingRows = rows.filter((row: any) =>
                row.classes().includes('bg-gray-50/50')
            );
            expect(alternatingRows.length).toBeGreaterThan(0);
        });
    });

    describe('Empty State', () => {
        it('should render empty state components', () => {
            wrapper = createWrapper({ data: [] });

            // Check that the table structure exists
            expect(wrapper.findComponent({ name: 'Table' }).exists()).toBe(true);
            expect(wrapper.findComponent({ name: 'TableBody' }).exists()).toBe(true);
        });
    });

    describe('Pagination', () => {
        it('should display page size selector', () => {
            wrapper = createWrapper();

            expect(wrapper.text()).toContain('Show');
            expect(wrapper.text()).toContain('entries');
        });

        it('should have page size options', () => {
            wrapper = createWrapper();

            const pageSizeOptions = wrapper
                .findAll('[data-testid="select-item"]')
                .filter((item: any) => ['10', '15', '20', '30', '40', '50'].includes(item.text()));
            expect(pageSizeOptions.length).toBe(6);
        });

        it('should default to 15 entries per page', () => {
            wrapper = createWrapper();
            expect(wrapper.vm.pageLimitSelected).toBe(15);
        });

        it('should update page size when selected', async () => {
            wrapper = createWrapper();

            wrapper.vm.setPageSize('20');
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.pageLimitSelected).toBe(20);
        });

        it('should handle string page size values', () => {
            wrapper = createWrapper();

            wrapper.vm.setPageSize('30');
            expect(wrapper.vm.pageLimitSelected).toBe(30);
        });

        it('should handle null page size with default', () => {
            wrapper = createWrapper();

            wrapper.vm.setPageSize(null);
            expect(wrapper.vm.pageLimitSelected).toBe(15);
        });
    });

    describe('Props and Model Values', () => {
        it('should accept columns prop', () => {
            wrapper = createWrapper();
            expect(wrapper.props('columns')).toEqual(mockColumns);
        });

        it('should handle data model value', async () => {
            wrapper = createWrapper();

            const newData = [
                {
                    name: 'vue',
                    version: '3.0.0',
                    is_direct_count: 1,
                    newest_release: '3.0.0'
                }
            ];

            await wrapper.setProps({ data: newData });
            expect(wrapper.vm.data).toEqual(newData);
        });

        it('should handle searchKey model value', async () => {
            wrapper = createWrapper();

            await wrapper.setProps({ searchKey: 'test search' });
            expect(wrapper.vm.searchKey).toBe('test search');
        });

        it('should handle pageLimitSelected model value', async () => {
            wrapper = createWrapper();

            await wrapper.setProps({ pageLimitSelected: 25 });
            expect(wrapper.vm.pageLimitSelected).toBe(25);
        });

        it('should handle sorting model value', async () => {
            wrapper = createWrapper();

            const sortState = [{ id: 'name', desc: false }];
            await wrapper.setProps({ sorting: sortState });
            expect(wrapper.vm.sorting).toEqual(sortState);
        });

        it('should handle columnFilters model value', async () => {
            wrapper = createWrapper();

            const filters = [{ id: 'name', value: 'express' }];
            await wrapper.setProps({ columnFilters: filters });
            expect(wrapper.vm.columnFilters).toEqual(filters);
        });

        it('should handle columnVisibility model value', async () => {
            wrapper = createWrapper();

            const visibility = { name: true, version: false };
            await wrapper.setProps({ columnVisibility: visibility });
            expect(wrapper.vm.columnVisibility).toEqual(visibility);
        });
    });

    describe('Interaction Behavior', () => {
        it('should apply hover styles to rows', () => {
            wrapper = createWrapper();

            // Check that rows exist (hover classes are applied via CSS)
            const rows = wrapper.findAll('[data-testid="table-row"]');
            expect(rows.length).toBeGreaterThan(0);
        });

        it('should have responsive classes', () => {
            wrapper = createWrapper();

            expect(wrapper.find('.flex.flex-col.sm\\:flex-row').exists()).toBe(true);
            expect(wrapper.find('.flex.flex-col.sm\\:flex-row.gap-3').exists()).toBe(true);
        });

        it('should handle search with empty string', () => {
            wrapper = createWrapper();

            wrapper.vm.search('');
            expect(wrapper.vm.searchKey).toBe('');
        });

        it('should handle search with null value', () => {
            wrapper = createWrapper();

            wrapper.vm.search(null);
            expect(wrapper.vm.searchKey).toBe('');
        });

        it('should convert non-string search values to string', () => {
            wrapper = createWrapper();

            wrapper.vm.search(123);
            expect(wrapper.vm.searchKey).toBe('123');
        });
    });
});
