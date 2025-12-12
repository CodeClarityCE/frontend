<script lang="ts" setup>
import SortableTable, {
    type TableHeader
} from '@/base_components/data-display/tables/SortableTable.vue';
import Pagination from '@/base_components/utilities/PaginationComponent.vue';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { formatDate } from '@/utils/dateUtils';
import { Icon } from '@iconify/vue';
import { ref, watch, type Ref } from 'vue';
import type { FailedProjectImport } from '../BaseImportComponent.vue';

// Props
const props = defineProps<{
    reposFailedToImport: Record<string, FailedProjectImport>;
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
        v-model:nmb-entries-showing="entriesPerPage"
        v-model:nmb-entries-total="totalEntries"
        v-model:total-pages="totalPages"
    >
        <template #content>
            <SortableTable
                class="w-full border-collapse"
                :headers="headersImportFails"
                :sort-key="''"
                :sort-direction="sortDirection"
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
                                {{ formatDate(failedImport.repo.created_at, 'LL') }}
                            </div>
                        </td>
                    </tr>
                </template>
            </SortableTable>
        </template>
    </Pagination>
</template>
