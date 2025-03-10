import type { License } from '@/codeclarity_components/results/licenses/License';
import Checkbox from '@/shadcn/ui/checkbox/Checkbox.vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';

export const columns: ColumnDef<License>[] = [
    {
        id: 'select',
        header: ({ table }) =>
            h(Checkbox, {
                checked: table.getIsAllPageRowsSelected(),
                'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
                ariaLabel: 'Select all'
            }),
        cell: ({ row }) =>
            h(Checkbox, {
                checked: row.getIsSelected(),
                'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
                ariaLabel: 'Select row'
            }),
        enableSorting: false,
        enableHiding: false
    },
    {
        accessorKey: 'licenseName',
        header: () => h('div', { class: 'text-right' }, 'License Name'),
        cell: ({ row }) => {
            const licenseName: string = row.original.name;

            return h('div', { class: 'text-right font-medium' }, licenseName);
        }
    }
];
