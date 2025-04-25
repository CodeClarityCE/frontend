import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';

export interface CodeQLResult {
    ruleId: string;
    ruleIndex: number;
    message: Message;
}

interface Message {
    text: string;
}

export const columns: ColumnDef<CodeQLResult>[] = [
    {
        accessorKey: 'ruleId',
        header: () => h('div', { class: 'text-left' }, 'Rule ID'),
        cell: ({ row }) => {
            return h('div', { class: 'text-left font-medium' }, row.getValue('ruleId'));
        }
    },
    {
        accessorKey: 'ruleIndex',
        header: () => h('div', 'Rule Index'),
        cell: ({ row }) => {
            return h('div', { class: 'font-medium' }, row.getValue('ruleIndex'));
        }
    },
    {
        accessorKey: 'message',
        header: () => h('div', { class: 'text-right' }, 'Rule ID'),
        cell: ({ row }) => {
            return h(
                'div',
                { class: 'text-right font-medium' },
                (row.getValue('message') as Message).text
            );
        }
    }
];
