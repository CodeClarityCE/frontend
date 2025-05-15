import { h } from 'vue';
import DropdownAction from './DataTableDropDown.vue';
import { ArrowUpDown } from 'lucide-vue-next';
import { Button } from '@/shadcn/ui/button';
import moment from 'moment';
import type { Dependency } from '@/codeclarity_components/results/graph.entity';
import type { ColumnDef } from '@tanstack/vue-table';
import { Icon } from '@iconify/vue/dist/iconify.js';

export const columns: ColumnDef<Dependency>[] = [
    // {
    //     id: 'select',
    //     header: ({ table }) =>
    //         h(Checkbox, {
    //             checked: table.getIsAllPageRowsSelected(),
    //             'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
    //             ariaLabel: 'Select all'
    //         }),
    //     cell: ({ row }) =>
    //         h(Checkbox, {
    //             checked: row.getIsSelected(),
    //             'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
    //             ariaLabel: 'Select row'
    //         }),
    //     enableSorting: false,
    //     enableHiding: false
    // },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Name', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) => {
            // Dependency is transitive
            return h('div', row.getValue('name'));
        },
        enableSorting: false // Sorting done on the API side
    },
    {
        accessorKey: 'version',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Version', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) => h('div', { class: 'lowercase' }, row.getValue('version')),
        enableSorting: false // Sorting done on the API side
    },
    {
        accessorKey: 'newest_release',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Update Available', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) => {
            if (row.getValue('newest_release') == row.getValue('version')) {
                return h('div', { class: 'lowercase' }, 'Up to date');
            }
            // console.log(row);

            return h('div', { class: 'lowercase' }, row.getValue('newest_release'));
        },
        enableSorting: false // Sorting done on the API side
    },
    {
        accessorKey: 'dev',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Dev', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) => {
            if (row.getValue('dev') == true) {
                return h(Icon, {
                    icon: 'line-md:circle-to-confirm-circle-transition',
                    class: 'text-severityLow'
                });
            }
            return h(Icon, { icon: 'line-md:close-circle-filled', class: 'text-severityHigh' });
        },
        enableSorting: false // Sorting done on the API side
    },
    {
        accessorKey: 'prod',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Prod', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) => {
            if (row.getValue('prod') == true) {
                return h(Icon, {
                    icon: 'line-md:circle-to-confirm-circle-transition',
                    class: 'text-severityLow'
                });
            }
            return h(Icon, { icon: 'line-md:close-circle-filled', class: 'text-severityHigh' });
        },
        enableSorting: false // Sorting done on the API side
    },
    {
        accessorKey: 'is_direct_count',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Direct', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) => {
            if ((row.getValue('is_direct_count') as number) > 0)
                return h('div', { class: 'lowercase' }, 'Yes');
            return h('div', { class: 'lowercase' }, 'No');
        },
        enableSorting: false // Sorting done on the API side
    },
    {
        accessorKey: 'is_transitive_count',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Transitive', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) => {
            if ((row.getValue('is_transitive_count') as number) > 0)
                return h('div', { class: 'lowercase' }, 'Yes');
            return h('div', { class: 'lowercase' }, 'No');
        },
        enableSorting: false // Sorting done on the API side
    },
    // {
    //     accessorKey: 'severity_dist',
    //     header: ({ column }) => {
    //         return h(
    //             Button,
    //             {
    //                 variant: 'ghost',
    //                 onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    //             },
    //             () => ['Severity', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
    //         );
    //     },
    //     cell: ({ row }) =>
    //         h(
    //             SeverityBubble,
    //             {
    //                 critical: row.getValue('severity_dist')??{critical:0}.critical > 0,
    //                 high: row.getValue('severity_dist')??{high:0}.high > 0,
    //                 medium: row.getValue('severity_dist')??{medium:0}.medium > 0,
    //                 low: row.getValue('severity_dist')??{low:0}.low > 0,
    //                 none: row.getValue('severity_dist')??{none:0}.none > 0
    //             },
    //             {
    //                 critical: () => row.getValue('severity_dist')??{critical:0}.critical,
    //                 high: () => row.getValue('severity_dist')??{high:0}.high,
    //                 medium: () => row.getValue('severity_dist')??{medium:0}.medium,
    //                 low: () => row.getValue('severity_dist')??{low:0}.low,
    //                 none: () => row.getValue('severity_dist')??{none:0}.none
    //             }
    //         ),
    //     enableSorting: false // Sorting done on the API side
    // },
    {
        accessorKey: 'release',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                },
                () => ['Release', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
            );
        },
        cell: ({ row }) =>
            h('div', { class: 'lowercase' }, formatLastPublished(row.getValue('release'))),
        enableSorting: false // Sorting done on the API side
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const dependency = row.original;

            return h(
                'div',
                { class: 'relative' },
                h(DropdownAction, {
                    dependency
                })
            );
        }
    }
];

function formatLastPublished(dateString: string) {
    const date = moment(dateString).fromNow();
    if (date == '2023 years ago') {
        return 'N/A';
    }
    return date;
}
