<script lang="ts">
export interface TableHeader {
    label: string;
    key: string | null;
}
</script>
<script setup lang="ts">
// Imports
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { Icon } from '@iconify/vue';

// Props
const props = defineProps<{
    headers: TableHeader[];
}>();

// Models
const sortKey = defineModel<string>('sortKey', { default: '' });
const sortDirection = defineModel<SortDirection>('sortDirection', { default: SortDirection.DESC });

async function updateSort(key: string | null) {
    if (!key) return;
    sortKey.value = key;
    if (key == sortKey.value) {
        // If we select the same column then we reverse the direction
        sortDirection.value =
            sortDirection.value == SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
    } else {
        // Default direction
        sortDirection.value = SortDirection.DESC;
    }
}
</script>
<template>
    <table class="stylized_table stylized_table_with_dividers w-full border-collapse">
        <th v-for="(header, key, index) in props.headers" :key="index" class="header header-clickable" :class="{
            'header-sortable-active': props.headers[key].key == sortKey
        }" @click="updateSort(props.headers[key].key)">
            <div class="header-sortable">
                <div>
                    {{ header.label }}
                </div>
                <div v-if="headers[key].key != null">
                    <span :class="headers[key].key != sortKey ||
                            (headers[key].key == sortKey && sortDirection == SortDirection.ASC)
                            ? 'w-full'
                            : 'w-10'
                        ">
                        <Icon class="text-2xl" icon="tabler:caret-up-filled"></Icon>
                    </span>
                    <span :class="headers[key].key != sortKey ||
                            (headers[key].key == sortKey && sortDirection == SortDirection.DESC)
                            ? 'w-full'
                            : 'w-10'
                        ">
                        <Icon class="text-2xl" icon="tabler:caret-down-filled"></Icon>
                    </span>
                </div>
            </div>
        </th>

        <tbody>
            <slot name="data"> </slot>
        </tbody>
    </table>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';

.stylized_table :deep(tbody)>tr>td>div {
    padding-top: 5px;
    padding-bottom: 5px;
}

.stylized_table :deep(tr) {
    padding-top: 5px;
    padding-bottom: 5px;
}

.stylized_table th,
.stylized_table :deep(td:not(:last-child)) {
    padding: 0px;
}

.stylized_table .header {
    font-family: 'lato';
    white-space: nowrap;
    text-align: left;
}

.stylized_table :deep(body) {
    font-size: 1.1em;
}

.stylized_table .header .header_sortable_arrow_disabled {
    visibility: hidden;
}

.stylized_table .header-sortable {
    display: flex;
    flex-direction: row;
    column-gap: 5px;
    align-items: center;
    height: 40px;
}

.stylized_table .header-sortable>div:nth-child(2) {
    display: flex;
    flex-direction: column;
    color: #b9b9b9;
    font-size: 0.9em;
    justify-content: stretch;
}

.stylized_table .header-sortable>div:nth-child(2)>*:nth-child(1) {
    margin-bottom: -8px;
}

.stylized_table .header-clickable {
    cursor: pointer;
}

.stylized_table .header-sortable-active {
    background-color: rgba(17, 251, 196, 0.06);
}

.stylized_table .header-sortable-active .header-sortable {
    border-bottom: 1px solid colors.$base-color;
}

.stylized_table_with_dividers th>div {
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #bdbdbd;
}

.stylized_table_with_dividers .header-sortable-active>div {
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 0px;
}

.stylized_table_with_dividers :deep(tbody:not(:first-child)) tr {
    border-bottom: 1px solid #bdbdbd;
}

.stylized_table :deep(tbody:not(:first-child)) td>div {
    padding-right: 10px;
    padding-left: 10px;
}

.stylized_table :deep(tbody:first-child) th>div {
    padding-right: 10px;
    padding-left: 10px;
}

.stylized_table :deep(tr:not(:first-child)) td>div {
    padding-right: 10px;
    padding-left: 10px;
}

.stylized_table tr:first-child th>div {
    padding-right: 10px;
    padding-left: 10px;
}

.stylized_table :deep(.not-patchable-finding) {
    background-color: #ff00000a;
}

.stylized_table_with_dividers th>div {
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #bdbdbd;
}

.stylized_table_with_dividers .header-sortable-active>div {
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 0px;
}

.stylized_table_with_dividers :deep(tbody:not(:first-child)) tr {
    border-bottom: 1px solid #bdbdbd;
}
</style>
