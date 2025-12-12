<script setup lang="ts">
import SortableTable, { type TableHeader } from '@/base_components/data-display/tables/SortableTable.vue';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import Pagination from '@/base_components/utilities/PaginationComponent.vue';
import type { AuditLog } from '@/codeclarity_components/organizations/audit_logs/AuditLog';
import type { Organization } from '@/codeclarity_components/organizations/organization.entity';
import { type SortDirection } from '@/utils/api/PaginatedRequestOptions';
import OrgAuditLogItem from './audit/OrgAuditLogItem.vue';

defineProps<{
    placeholder: 'Search by user email, log class, log type or log text';
    headers: TableHeader[];
    sortKey: string;
    sortDirection: SortDirection;
    updateSort: (_sortKey: string, _sortDirection: SortDirection) => Promise<void>;
    orgAuditLogs: AuditLog[];
    orgInfo: Organization;
    onRefetch: () => Promise<void>;
}>();
const search = defineModel<string>('search', { required: true });
const totalEntries = defineModel<number>('totalEntries', { required: true });
const currentPage = defineModel<number>('currentPage', { required: true });
const entriesPerPage = defineModel<number>('entriesPerPage', { required: true });
const totalPages = defineModel<number>('totalPages', { required: true });
</script>

<template>
    <SearchBar v-model:search-key="search" :placeholder="placeholder" />

    <Pagination
        v-model:page="currentPage"
        v-model:nmb-entries-showing="entriesPerPage"
        v-model:nmb-entries-total="totalEntries"
        v-model:total-pages="totalPages"
    >
        <template #content>
            <div
                v-if="totalEntries === 0 && search !== ''"
                class="flex flex-row gap-4 justify-center"
                style="margin-top: 10px"
            >
                No audit logs match your search
            </div>
            <div
                v-if="totalEntries === 0 && search === ''"
                class="flex flex-row gap-4 justify-center"
                style="margin-top: 10px"
            >
                No audit logs
            </div>
            <SortableTable
                v-if="totalEntries > 0"
                :headers="headers"
                :sort-key="sortKey"
                :sort-direction="sortDirection"
                @on-sort-change="updateSort"
            >
                <template #data>
                    <OrgAuditLogItem
                        v-for="log in orgAuditLogs"
                        :key="log.id"
                        :log="log"
                        :org-info="orgInfo"
                        @refetch="onRefetch()"
                    >
                    </OrgAuditLogItem>
                </template>
            </SortableTable>
        </template>
    </Pagination>
</template>
