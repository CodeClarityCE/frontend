import { h } from 'vue';
import DropdownAction from './DataTableDropDown.vue';
import { ArrowUpDown } from 'lucide-vue-next';
import { Button } from '@/shadcn/ui/button';
import moment from 'moment';
import type { Dependency } from '@/codeclarity_components/results/graph.entity';
import type { ColumnDef } from '@tanstack/vue-table';
import { Icon } from '@iconify/vue';

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
            const name = row.getValue('name') as string;
            return h('div', { 
                class: 'font-medium text-gray-900 dark:text-gray-100' 
            }, name);
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
        cell: ({ row }) => {
            const version = row.getValue('version') as string;
            return h('div', { 
                class: 'font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border' 
            }, version);
        },
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
            const currentVersion = row.getValue('version') as string;
            const newestVersion = row.getValue('newest_release') as string;
            
            if (newestVersion === currentVersion) {
                return h('div', { 
                    class: 'flex items-center gap-2' 
                }, [
                    h(Icon, { 
                        icon: 'line-md:circle-to-confirm-circle-transition', 
                        class: 'text-green-500 w-4 h-4' 
                    }),
                    h('span', { 
                        class: 'text-green-700 dark:text-green-400 font-medium text-sm' 
                    }, 'Up to date')
                ]);
            }
            
            return h('div', { 
                class: 'flex items-center gap-2' 
            }, [
                h(Icon, { 
                    icon: 'line-md:alert-circle', 
                    class: 'text-amber-500 w-4 h-4' 
                }),
                h('span', { 
                    class: 'font-mono text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded border border-amber-200 dark:border-amber-800' 
                }, newestVersion)
            ]);
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
            const isDev = row.getValue('dev') as boolean;
            
            if (isDev) {
                return h('div', { 
                    class: 'flex items-center justify-center' 
                }, [
                    h('div', {
                        class: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800'
                    }, 'Yes')
                ]);
            }
            
            return h('div', { 
                class: 'flex items-center justify-center' 
            }, [
                h('div', {
                    class: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs font-medium border'
                }, 'No')
            ]);
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
            const isProd = row.getValue('prod') as boolean;
            
            if (isProd) {
                return h('div', { 
                    class: 'flex items-center justify-center' 
                }, [
                    h('div', {
                        class: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium border border-green-200 dark:border-green-800'
                    }, 'Yes')
                ]);
            }
            
            return h('div', { 
                class: 'flex items-center justify-center' 
            }, [
                h('div', {
                    class: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs font-medium border'
                }, 'No')
            ]);
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
            const isDirectCount = row.getValue('is_direct_count') as number;
            const isDirect = isDirectCount > 0;
            
            return h('div', { 
                class: 'flex items-center justify-center' 
            }, [
                h('div', {
                    class: isDirect 
                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs font-medium border'
                }, isDirect ? 'Yes' : 'No')
            ]);
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
            const isTransitiveCount = row.getValue('is_transitive_count') as number;
            const isTransitive = isTransitiveCount > 0;
            
            return h('div', { 
                class: 'flex items-center justify-center' 
            }, [
                h('div', {
                    class: isTransitive 
                        ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full text-xs font-medium border border-orange-200 dark:border-orange-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs font-medium border'
                }, isTransitive ? 'Yes' : 'No')
            ]);
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
