<script lang="ts" setup>
import {
    isMemberRoleGreaterThan,
    MemberRole,
    type Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import { APIErrors } from '@/utils/api/ApiErrors';
import { debounce } from '@/utils/searchUtils';
import type { AuditLog } from '@/codeclarity_components/organizations/audit_logs/AuditLog';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { useAuthStore } from '@/stores/auth';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { Icon } from '@iconify/vue';

import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import BoxLoader from '@/base_components/BoxLoader.vue';
import BorderCard from '@/base_components/cards/BorderCard.vue';
import type { TableHeader } from '@/base_components/tables/SortableTable.vue';
import AuditLogsTable from '@/enterprise_components/activity_logs/AuditLogsTable.vue';

const orgRepo = new OrgRepository();
const authStore = useAuthStore();

const placeholder = 'Search by user email, log class, log type or log text';
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const search: Ref<string> = ref('');
const orgId: Ref<string> = ref('');
const orgInfo: Ref<Organization | undefined> = ref();
const totalEntries: Ref<number> = ref(0);
const currentPage: Ref<number> = ref(0);
const entriesPerPage: Ref<number> = ref(10);
const orgAuditLogs: Ref<AuditLog[]> = ref([]);
const totalPages = ref(0);

const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);
const sortKey: Ref<string> = ref('created_on');
const headers: TableHeader[] = [
    { label: 'Severity', key: 'action_severity' },
    { label: 'Log Class', key: 'action_class' },
    { label: 'Log Type', key: 'action' },
    { label: 'Description', key: 'description' },
    { label: 'Blame', key: 'blame_on_email' },
    { label: 'Date', key: 'created_on' }
];

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterThan(_orgInfo.role, MemberRole.USER)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

watch([search], async () => {
    debounce(async () => {
        await fetchOrgAuditLogs(true);
    }, 250);
});

watch([currentPage, entriesPerPage], async () => {
    await changePage(currentPage.value);
});

async function changePage(_page: number) {
    currentPage.value = _page;
    await fetchOrgAuditLogs(true);
}

async function updateSort(_sortKey: string, _sortDirection: SortDirection) {
    // if (key == undefined) return;
    // if (key != undefined)
    //     if (key == sortKey.value) {
    //         // If we select the same column then we reverse the direction
    //         sortDirection.value =
    //             sortDirection.value == SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
    //     } else {
    //         // Default direction
    //         sortDirection.value = SortDirection.DESC;
    //     }
    // sortKey.value = key;
    sortKey.value = _sortKey;
    sortDirection.value = _sortDirection;
    await fetchOrgAuditLogs(true);
}

async function onRefetch() {
    await fetchOrgAuditLogs(true);
}

async function fetchOrgAuditLogs(refresh: boolean = false) {
    if (!orgId.value) return;
    if (authStore.getAuthenticated && authStore.getToken) {
        error.value = false;
        errorCode.value = undefined;
        if (!refresh) loading.value = true;
        try {
            const resp = await orgRepo.getOrgAuditLogs({
                orgId: orgId.value,
                bearerToken: authStore.getToken,
                search: {
                    searchKey: search.value
                },
                pagination: {
                    page: currentPage.value,
                    entries_per_page: entriesPerPage.value
                },
                sort: {
                    sortKey: sortKey.value,
                    sortDirection: sortDirection.value
                },
                handleBusinessErrors: true
            });
            orgAuditLogs.value = resp.data;
            totalEntries.value = resp.total_entries;
            totalPages.value = resp.total_pages;
        } catch (err) {
            error.value = true;
            if (err instanceof BusinessLogicError) {
                errorCode.value = err.error_code;
            }
        } finally {
            if (!refresh) loading.value = false;
        }
    }
}

async function init() {
    const route = useRoute();
    const _orgId = route.params.orgId;
    const _search = route.query.search;

    if (!_orgId) {
        router.back();
    }

    if (_search && typeof _search == 'string') {
        search.value = _search;
    }

    if (typeof _orgId == 'string') {
        orgId.value = _orgId;
        await fetchOrgAuditLogs();
    } else {
        router.back();
    }
}

init();
</script>
<template>
    <div class="flex flex-col gap-8 org-audit-log-wrapper">
        <HeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></HeaderItem>
        <div v-if="orgInfo" class="flex flex-col gap-8 p-12">
            <div
                v-if="
                    (!orgInfo.personal && orgInfo.role == MemberRole.OWNER) ||
                    orgInfo.role == MemberRole.ADMIN ||
                    orgInfo.role == MemberRole.MODERATOR
                "
            >
                <h2 class="text-2xl font-semibold">Related Actions</h2>
                <div class="flex flex-row gap-4 flex-wrap items-stretch org-manage-items">
                    <RouterLink
                        :to="{ name: 'orgManage', params: { orgId: orgId, page: 'members' } }"
                    >
                        <BorderCard :hover="true" :slim="true">
                            <template #title> Manage organization members </template>
                        </BorderCard>
                    </RouterLink>
                </div>
            </div>
            <div>
                <h2 class="text-2xl font-semibold">Audit logs</h2>
                <div v-if="loading">
                    <div class="flex flex-col gap-2 justify-center" style="padding: 5px">
                        <BoxLoader
                            :dimensions="{ width: '100%', height: '50px' }"
                            :key="i"
                            v-for="i in 10"
                        />
                    </div>
                </div>
                <div v-else>
                    <div class="flex flex-col gap-5 org-members-list-wrapper" v-if="!error">
                        <AuditLogsTable
                            :placeholder="placeholder"
                            :headers="headers"
                            :sortKey="sortKey"
                            :sortDirection="sortDirection"
                            :updateSort="updateSort"
                            :orgAuditLogs="orgAuditLogs"
                            :orgInfo="orgInfo"
                            :onRefetch="onRefetch"
                            v-model:search="search"
                            v-model:totalEntries="totalEntries"
                            v-model:currentPage="currentPage"
                            v-model:entriesPerPage="entriesPerPage"
                            v-model:totalPages="totalPages"
                        />
                    </div>
                    <div v-else>
                        <div class="flex flex-row gap-2" style="font-size: 1.2em">
                            <Icon
                                class="icon user-icon"
                                icon="solar:confounded-square-outline"
                                style="font-size: 2.5rem; height: fit-content"
                            ></Icon>
                            <div>
                                <div class="flex flex-col gap-5">
                                    <div class="flex flex-col gap-2">
                                        <div>
                                            We failed to retrieve the organization's audit logs
                                        </div>
                                        <div style="font-size: 0.7em">
                                            <div v-if="errorCode == APIErrors.EntityNotFound">
                                                This organization does not exist.
                                            </div>
                                            <div v-if="errorCode == APIErrors.NotAuthorized">
                                                You do not have permission to access the
                                                organization's audit logs..
                                            </div>
                                            <div v-else>
                                                You can try again, and if the error persits, then
                                                please contact the webmaster.
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-row gap-2 items-center flex-wrap">
                                        <Button
                                            v-if="errorCode != APIErrors.NotAuthorized"
                                            @click="fetchOrgAuditLogs()"
                                        >
                                            Try again
                                        </Button>
                                        <Button @click="router.push({ name: 'orgs' })">
                                            Go to orgs
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
