<script lang="ts" setup>
import { ref, watch, type Ref } from 'vue';
import type { FailedProjectImport } from '../BaseImportComponent.vue';
import Pagination from '@/common_components/PaginationComponent.vue';
import moment from 'moment';
import { Icon } from '@iconify/vue/dist/iconify.js';
import SortableTable, { type TableHeader } from '@/common_components/tables/SortableTable.vue';
import { SortDirection } from '@/repositories/types/PaginatedRequestOptions';

// Props
const props = defineProps<{
    reposFailedToImport: { [key: string]: FailedProjectImport };
}>();

const headersImportFails: TableHeader[] = [
    { label: '', key: null },
    { label: 'Repo', key: null },
    { label: 'Import Error', key: null },
    { label: 'Created Date', key: null }
];

const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);

// State
const page = ref(0);
const entriesPerPage = ref(10);
const totalEntries = ref(Object.keys(props.reposFailedToImport).length);
const totalPages = ref(
    Math.ceil(Object.keys(props.reposFailedToImport).length / entriesPerPage.value)
);

watch([entriesPerPage, totalEntries, page], () => {
    changePage(page.value);
});
function changePage(_page: number) {
    page.value = _page;
}
</script>
<template>
    <Pagination
        v-model:page="page"
        v-model:nmbEntriesShowing="entriesPerPage"
        v-model:nmbEntriesTotal="totalEntries"
        v-model:totalPages="totalPages"
    >
        <template #content>
            <SortableTable
                class="w-full border-collapse"
                :headers="headersImportFails"
                :sortKey="''"
                :sortDirection="sortDirection"
            >
                <template #data>
                    <!-- <tr v-for="(failedImport, index) in Object.values(reposFailedToImport)" :key="index" style="background-color: #ff00000d"
                        v-if="index >= page * entriesPerPage &&
                            index < (page + 1) * entriesPerPage
                            "> -->
                    <tr
                        v-for="(failedImport, index) in Object.values(reposFailedToImport)"
                        :key="index"
                        style="background-color: #ff00000d"
                    >
                        <td></td>
                        <td>
                            <div class="py-1">
                                {{ failedImport.repo.fully_qualified_name }}
                            </div>
                        </td>
                        <td>
                            <div>
                                <div
                                    class="py-1 flex flex-row gap-1 items-center"
                                    style="color: red"
                                >
                                    <Icon
                                        class="text-xl text-destructive"
                                        icon="solar:danger-triangle-bold"
                                    ></Icon>
                                    <span
                                        ><span class="font-black">Error:</span>
                                        {{ failedImport.reason }}</span
                                    >
                                </div>
                            </div>
                        </td>
                        <td>
                            <div>
                                {{ moment(failedImport.repo.created_at).format('LL') }}
                            </div>
                        </td>
                    </tr>
                </template>
            </SortableTable>
        </template>
    </Pagination>
</template>
