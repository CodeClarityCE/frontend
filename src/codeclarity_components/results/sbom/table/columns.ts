import { h } from 'vue';
import DropdownAction from './DataTableDropDown.vue';
import { ArrowUpDown } from 'lucide-vue-next';
import { Button } from '@/shadcn/ui/button';
import { formatRelativeTime } from '@/utils/dateUtils';
import type { Dependency } from '@/codeclarity_components/results/graph.entity';
import type { ColumnDef } from '@tanstack/vue-table';
import { Icon } from '@iconify/vue';
import EcosystemBadge from '@/base_components/ui/EcosystemBadge.vue';
import { EcosystemDetector } from '@/utils/packageEcosystem';

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
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
                    class: 'h-auto p-0 font-semibold text-left justify-start'
                },
                () => [
                    h('div', { class: 'flex items-center gap-2' }, [
                        h('span', 'Package Name'),
                        h(ArrowUpDown, { class: 'h-3 w-3 text-gray-400' })
                    ])
                ]
            );
        },
        cell: ({ row }) => {
            const name = row.getValue('name') as string;

            return h(
                'span',
                {
                    class: 'font-medium text-gray-900 truncate'
                },
                name
            );
        },
        enableSorting: false
    },
    {
        accessorKey: 'ecosystem',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
                    class: 'h-auto p-0 font-semibold text-left justify-start'
                },
                () => [
                    h('div', { class: 'flex items-center gap-2' }, [
                        h('span', 'Ecosystem'),
                        h(ArrowUpDown, { class: 'h-3 w-3 text-gray-400' })
                    ])
                ]
            );
        },
        cell: ({ row }) => {
            const dependency = row.original;
            const ecosystem = EcosystemDetector.detectFromDependency(dependency);

            return h(
                'div',
                {
                    class: 'flex items-center justify-start'
                },
                [
                    h(EcosystemBadge, {
                        ecosystem,
                        size: 'sm',
                        variant: 'default',
                        showName: true
                    })
                ]
            );
        },
        enableSorting: false,
        filterFn: (row, _id, value) => {
            const dependency = row.original;
            const ecosystem = EcosystemDetector.detectFromDependency(dependency);
            return value.includes(ecosystem.type);
        }
    },
    {
        accessorKey: 'version',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
                    class: 'h-auto p-0 font-semibold text-left justify-start'
                },
                () => [
                    h('div', { class: 'flex items-center gap-2' }, [
                        h('span', 'Current Version'),
                        h(ArrowUpDown, { class: 'h-3 w-3 text-gray-400' })
                    ])
                ]
            );
        },
        cell: ({ row }) => {
            const version = row.getValue('version') as string;
            if (!version) {
                return h('div', { class: 'text-gray-400 text-sm' }, 'N/A');
            }
            const parts = version.split('.');

            return h(
                'div',
                {
                    class: 'inline-flex items-center gap-1'
                },
                [
                    h(
                        'div',
                        {
                            class: 'font-mono text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded border font-medium'
                        },
                        [
                            h('span', { class: 'text-emerald-600 font-semibold' }, parts[0] || '0'),
                            h('span', { class: 'text-slate-400' }, '.'),
                            h('span', { class: 'text-blue-600 font-semibold' }, parts[1] || '0'),
                            h('span', { class: 'text-slate-400' }, '.'),
                            h('span', { class: 'text-purple-600' }, parts.slice(2).join('.') || '0')
                        ]
                    )
                ]
            );
        },
        enableSorting: false
    },
    {
        accessorKey: 'newest_release',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
                    class: 'h-auto p-0 font-semibold text-left justify-start'
                },
                () => [
                    h('div', { class: 'flex items-center gap-2' }, [
                        h('span', 'Update Status'),
                        h(ArrowUpDown, { class: 'h-3 w-3 text-gray-400' })
                    ])
                ]
            );
        },
        cell: ({ row }) => {
            const currentVersion = row.getValue('version') as string;
            const newestVersion = row.getValue('newest_release') as string;

            if (!currentVersion || !newestVersion) {
                return h('div', { class: 'text-gray-400 text-sm' }, 'N/A');
            }

            const isUpToDate = newestVersion === currentVersion;

            if (isUpToDate) {
                return h(
                    'div',
                    {
                        class: 'flex items-center gap-2'
                    },
                    [
                        h(
                            'div',
                            {
                                class: 'flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200'
                            },
                            [
                                h(Icon, {
                                    icon: 'tabler:circle-check',
                                    class: 'w-4 h-4'
                                }),
                                h(
                                    'span',
                                    {
                                        class: 'font-medium text-sm'
                                    },
                                    'Up to date'
                                )
                            ]
                        )
                    ]
                );
            }

            // Determine update severity (major, minor, patch)
            const currentParts = currentVersion.split('.').map(Number);
            const newestParts = newestVersion.split('.').map(Number);
            let updateType = 'patch';
            let severity: 'low' | 'medium' | 'high' = 'low';

            if ((newestParts[0] ?? 0) > (currentParts[0] ?? 0)) {
                updateType = 'major';
                severity = 'high';
            } else if ((newestParts[1] ?? 0) > (currentParts[1] ?? 0)) {
                updateType = 'minor';
                severity = 'medium';
            }

            const severityColors = {
                low: 'bg-blue-50 text-blue-700 border-blue-200',
                medium: 'bg-amber-50 text-amber-700 border-amber-200',
                high: 'bg-red-50 text-red-700 border-red-200'
            };

            return h(
                'div',
                {
                    class: 'flex flex-col gap-1'
                },
                [
                    h(
                        'div',
                        {
                            class: `flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${severityColors[severity]}`
                        },
                        [
                            h(Icon, {
                                icon:
                                    updateType === 'major'
                                        ? 'tabler:arrow-big-up'
                                        : updateType === 'minor'
                                          ? 'tabler:arrow-up'
                                          : 'tabler:arrow-narrow-up',
                                class: 'w-4 h-4'
                            }),
                            h(
                                'span',
                                {
                                    class: 'font-mono font-medium'
                                },
                                newestVersion
                            ),
                            h(
                                'span',
                                {
                                    class: 'text-xs opacity-75 uppercase font-semibold'
                                },
                                updateType
                            )
                        ]
                    )
                ]
            );
        },
        enableSorting: false
    },
    {
        accessorKey: 'deprecated',
        header: ({ column }) => {
            return h(
                Button,
                {
                    variant: 'ghost',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
                    class: 'h-auto p-0 font-semibold text-left justify-start'
                },
                () => [
                    h('div', { class: 'flex items-center gap-2' }, [
                        h('span', 'Deprecated'),
                        h(ArrowUpDown, { class: 'h-3 w-3 text-gray-400' })
                    ])
                ]
            );
        },
        cell: ({ row }) => {
            const isDeprecated = row.getValue('deprecated') as boolean;
            const deprecatedMessage = (row.original as any).deprecated_message as string;

            if (isDeprecated) {
                return h(
                    'div',
                    {
                        class: 'flex items-center justify-center',
                        title: deprecatedMessage || 'This package is deprecated'
                    },
                    [
                        h(
                            'div',
                            {
                                class: 'bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 flex items-center gap-2'
                            },
                            [
                                h(Icon, {
                                    icon: 'tabler:alert-triangle',
                                    class: 'w-4 h-4'
                                }),
                                h('span', 'Deprecated')
                            ]
                        )
                    ]
                );
            }

            return h(
                'div',
                {
                    class: 'flex items-center justify-center'
                },
                [
                    h(
                        'div',
                        {
                            class: 'bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium border'
                        },
                        'No'
                    )
                ]
            );
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
                return h(
                    'div',
                    {
                        class: 'flex items-center justify-center'
                    },
                    [
                        h(
                            'div',
                            {
                                class: 'bg-blue-100  text-blue-700  px-2 py-1 rounded-full text-xs font-medium border border-blue-200 '
                            },
                            'Yes'
                        )
                    ]
                );
            }

            return h(
                'div',
                {
                    class: 'flex items-center justify-center'
                },
                [
                    h(
                        'div',
                        {
                            class: 'bg-gray-100  text-gray-600  px-2 py-1 rounded-full text-xs font-medium border'
                        },
                        'No'
                    )
                ]
            );
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
                return h(
                    'div',
                    {
                        class: 'flex items-center justify-center'
                    },
                    [
                        h(
                            'div',
                            {
                                class: 'bg-green-100  text-green-700  px-2 py-1 rounded-full text-xs font-medium border border-green-200 '
                            },
                            'Yes'
                        )
                    ]
                );
            }

            return h(
                'div',
                {
                    class: 'flex items-center justify-center'
                },
                [
                    h(
                        'div',
                        {
                            class: 'bg-gray-100  text-gray-600  px-2 py-1 rounded-full text-xs font-medium border'
                        },
                        'No'
                    )
                ]
            );
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

            return h(
                'div',
                {
                    class: 'flex items-center justify-center'
                },
                [
                    h(
                        'div',
                        {
                            class: isDirect
                                ? 'bg-purple-100  text-purple-700  px-2 py-1 rounded-full text-xs font-medium border border-purple-200 '
                                : 'bg-gray-100  text-gray-600  px-2 py-1 rounded-full text-xs font-medium border'
                        },
                        isDirect ? 'Yes' : 'No'
                    )
                ]
            );
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

            return h(
                'div',
                {
                    class: 'flex items-center justify-center'
                },
                [
                    h(
                        'div',
                        {
                            class: isTransitive
                                ? 'bg-orange-100  text-orange-700  px-2 py-1 rounded-full text-xs font-medium border border-orange-200 '
                                : 'bg-gray-100  text-gray-600  px-2 py-1 rounded-full text-xs font-medium border'
                        },
                        isTransitive ? 'Yes' : 'No'
                    )
                ]
            );
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
    const date = formatRelativeTime(dateString);
    if (date == '2023 years ago') {
        return 'N/A';
    }
    return date;
}
