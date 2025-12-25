import { Badge } from '@/shadcn/ui/badge';
import Button from '@/shadcn/ui/button/Button.vue';
import { Checkbox } from '@/shadcn/ui/checkbox';
import { Icon } from '@iconify/vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import type { LicensePolicy } from '../license_policy.entity';

export const columns: ColumnDef<LicensePolicy>[] = [
    {
        id: 'select',
        header: ({ table }) =>
            h(Checkbox, {
                checked: table.getIsAllPageRowsSelected(),
                onCheckedChange: (value: boolean) => table.toggleAllPageRowsSelected(!!value),
                ariaLabel: 'Select all'
            }),
        cell: ({ row }) =>
            h(Checkbox, {
                checked: row.getIsSelected(),
                onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
                ariaLabel: 'Select row'
            }),
        enableSorting: false,
        enableHiding: false
    },
    {
        accessorKey: 'name',
        header: 'Policy Name',
        cell: ({ row }) => {
            const policy = row.original;
            return h('div', { class: 'flex items-center gap-2' }, [
                h(Icon, {
                    icon: 'solar:shield-check-bold',
                    class: 'text-green-500 flex-shrink-0'
                }),
                h('div', { class: 'min-w-0' }, [
                    h('div', { class: 'font-medium text-gray-900 truncate' }, policy.name),
                    policy.default &&
                        h(
                            Badge,
                            {
                                variant: 'secondary',
                                class: 'mt-1 text-xs'
                            },
                            'Default'
                        )
                ])
            ]);
        }
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
            const description = row.getValue('description') as string | undefined;
            return h(
                'div',
                {
                    class: 'max-w-xs text-gray-600 truncate',
                    title: description
                },
                description ?? 'No description'
            );
        }
    },
    {
        accessorKey: 'policy_type',
        header: 'Type',
        cell: ({ row }) => {
            const type = row.getValue('policy_type');
            const isWhitelist = type === 'WHITELIST';
            return h(
                Badge,
                {
                    variant: 'outline',
                    class: isWhitelist
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                },
                [
                    h(Icon, {
                        icon: isWhitelist ? 'solar:check-circle-bold' : 'solar:close-circle-bold',
                        class: 'mr-1 h-3 w-3'
                    }),
                    isWhitelist ? 'Whitelist' : 'Blacklist'
                ]
            );
        }
    },
    {
        accessorKey: 'content',
        header: 'Licenses',
        cell: ({ row }) => {
             
            const licenses: string[] | undefined = row.getValue('content');
            const count = licenses?.length ?? 0;
            return h('div', { class: 'flex items-center gap-2' }, [
                h(
                    Badge,
                    {
                        variant: 'secondary'
                    },
                    String(count)
                ),
                h('span', { class: 'text-sm text-gray-600' }, count === 1 ? 'license' : 'licenses')
            ]);
        }
    },
    {
        accessorKey: 'created_by',
        header: 'Created By',
        cell: ({ row }) => {
            const createdBy = row.getValue('created_by') as string | undefined;
            return h('div', { class: 'text-sm text-gray-600' }, createdBy ?? 'Unknown');
        }
    },
    {
        accessorKey: 'created_on',
        header: 'Created On',
        cell: ({ row }) => {
            const date = row.getValue('created_on') as string | number | Date | undefined;
            if (!date) return h('span', { class: 'text-gray-400' }, 'Unknown');

            return h(
                'div',
                { class: 'text-sm text-gray-600' },
                new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })
            );
        }
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row, table }) => {
            const policy = row.original;

            return h('div', { class: 'flex items-center gap-1' }, [
                h(
                    Button,
                    {
                        variant: 'ghost',
                        size: 'sm',
                        onClick: () => {
                            // Emit edit event through table meta
                            const meta = table.options.meta as { onEdit?: (policy: LicensePolicy) => void } | undefined;
                            meta?.onEdit?.(policy);
                        }
                    },
                    [h(Icon, { icon: 'solar:pen-bold', class: 'h-4 w-4' })]
                ),
                h(
                    Button,
                    {
                        variant: 'ghost',
                        size: 'sm',
                        onClick: () => {
                            // Emit delete event through table meta
                            const meta = table.options.meta as { onDelete?: (policy: LicensePolicy) => void } | undefined;
                            meta?.onDelete?.(policy);
                        }
                    },
                    [
                        h(Icon, {
                            icon: 'solar:trash-bin-minimalistic-bold',
                            class: 'h-4 w-4 text-red-500'
                        })
                    ]
                )
            ]);
        },
        enableSorting: false,
        enableHiding: false
    }
];
