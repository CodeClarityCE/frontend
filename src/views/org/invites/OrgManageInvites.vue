<script lang="ts" setup>
import { onMounted, ref, watch, type Ref } from 'vue';
import OrgHeaderItem from '@/views/org/subcomponents/OrgHeaderItem.vue';
import { useRoute } from 'vue-router';
import router from '@/router';
import type { Organization } from '@/repositories/types/entities/Organization';
import { isMemberRoleGreaterThan, MemberRole } from '@/repositories/types/entities/Organization';
import type { Invitation } from '@/repositories/types/entities/Invitation';
import { OrgRepository } from '@/repositories/OrganizationRepository';
import { useAuthStore } from '@/stores/auth';
import { SortDirection } from '@/repositories/types/PaginatedRequestOptions';
import { BusinessLogicError } from '@/repositories/BaseRepository';
import Pagination from '@/common_components/PaginationComponent.vue';
import SearchBar from '@/common_components/SearchBar.vue';
import { debounce } from '@/utils/searchUtils';
import OrgInviteItem from '@/views/org/invites/invite/OrgInviteItem.vue';
import BoxLoader from '@/common_components/BoxLoader.vue';
import BorderCard from '@/common_components/cards/BorderCard.vue';
import SortableTable from '@/common_components/tables/SortableTable.vue';

const placeholder = 'Search by invitee email, inviter email, or inviter handle';
const orgRepository = new OrgRepository();
const authStore = useAuthStore();

const search: Ref<string> = ref('');
const orgId: Ref<string | undefined> = ref();
const orgInfo: Ref<Organization | undefined> = ref();
const invitations: Ref<Invitation[]> = ref([]);

const currentPage: Ref<number> = ref(0);
const entriesPerPage: Ref<number> = ref(10);
const totalEntries: Ref<number> = ref(0);
const totalPages: Ref<number> = ref(0);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const sortDirection: Ref<SortDirection> = ref(SortDirection.ASC);
const sortKey: Ref<string> = ref('invited_on');

const headers = [
    { label: 'Invitee', key: 'invitee_email' },
    { label: 'Role', key: 'invitee_role' },
    { label: 'Invited By', key: 'inviter_handle' },
    { label: 'Invited On', key: 'invited_on' },
    { label: 'Expires', key: 'ttl' },
    { label: 'Actions', key: null }
];

watch([currentPage, entriesPerPage], async () => {
    await fetchInvitations(true);
});

async function fetchInvitations(refresh: boolean = false) {
    if (!orgId.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    try {
        const resp = await orgRepository.getInvitations({
            orgId: orgId.value,
            bearerToken: authStore.getToken,
            pagination: {
                page: currentPage.value,
                entries_per_page: entriesPerPage.value
            },
            search: {
                searchKey: search.value
            },
            sort: {
                sortKey: sortKey.value,
                sortDirection: sortDirection.value
            }
        });
        invitations.value = resp.data;
        totalEntries.value = resp.total_entries;
        totalPages.value = resp.total_pages;
    } catch (err) {
        error.value = true;
        if (err instanceof BusinessLogicError) {
            errorCode.value = err.error_code;
        }
    } finally {
        loading.value = false;
    }
}

function init() {
    const route = useRoute();
    const _orgId = route.params.orgId;

    if (!_orgId) {
        router.back();
    }

    if (typeof _orgId == 'string') {
        orgId.value = _orgId;
        fetchInvitations();
    } else {
        router.back();
    }
}

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterThan(_orgInfo.role, MemberRole.USER)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

watch([search], async () => {
    debounce(async () => {
        await fetchInvitations(true);
    }, 250);
});

async function updateSort(key: any) {
    if (key == undefined) return;
    if (key != undefined)
        if (key == sortKey.value) {
            // If we select the same column then we reverse the direction
            sortDirection.value =
                sortDirection.value == SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
        } else {
            // Default direction
            sortDirection.value = SortDirection.DESC;
        }
    sortKey.value = key;
    await fetchInvitations(true);
}

async function onRefetch() {
    await fetchInvitations(true);
}

onMounted(() => {
    init();
});
</script>
<template>
    <div class="flex flex-col gap-8 org-member-invitation-wrapper">
        <OrgHeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></OrgHeaderItem>
        <div v-if="orgInfo && orgId" class="flex flex-col gap-8 p-12">
            <div>
                <h2 class="text-2xl font-semibold">Related Actions</h2>
                <div class="flex flex-row gap-4 flex-wrap items-stretch org-manage-items">
                    <template
                        v-if="
                            (!orgInfo.personal && orgInfo.role == MemberRole.OWNER) ||
                            orgInfo.role == MemberRole.ADMIN ||
                            orgInfo.role == MemberRole.MODERATOR
                        "
                    >
                        <RouterLink
                            :to="{
                                name: 'orgAddInvite',
                                params: { action: 'add', page: 'invites', orgId: orgId }
                            }"
                        >
                            <BorderCard :hover="true" :slim="true">
                                <template #title> Invite another User </template>
                            </BorderCard>
                        </RouterLink>
                        <RouterLink
                            :to="{ name: 'orgManage', params: { orgId: orgId, page: 'members' } }"
                        >
                            <BorderCard :hover="true" :slim="true">
                                <template #title> Manage organization members </template>
                            </BorderCard>
                        </RouterLink>
                    </template>
                </div>
            </div>
            <div>
                <h2>Open invitations</h2>
                <div v-if="loading">
                    <div class="flex flex-col gap-2 justify-between" style="padding: 5px">
                        <BoxLoader
                            :dimensions="{ width: '100%', height: '50px' }"
                            v-for="i in 10"
                            :key="i"
                        />
                    </div>
                </div>
                <div v-else>
                    <div class="flex flex-col gap-5 org-members-list-wrapper" v-if="!error">
                        <SearchBar v-model:searchKey="search" :placeholder="placeholder" />

                        <Pagination
                            v-model:page="currentPage"
                            v-model:nmbEntriesShowing="entriesPerPage"
                            v-model:nmbEntriesTotal="totalEntries"
                            v-model:totalPages="totalPages"
                        >
                            <template #content>
                                <div
                                    v-if="totalEntries == 0 && search != ''"
                                    class="flex flex-row gap-4 justify-center"
                                    style="margin-top: 10px"
                                >
                                    No invites match your search
                                </div>
                                <div
                                    v-if="totalEntries == 0 && search == ''"
                                    class="flex flex-row gap-4 justify-center"
                                    style="margin-top: 10px"
                                >
                                    No open invites
                                </div>
                                <SortableTable
                                    v-if="totalEntries > 0"
                                    :headers="headers"
                                    :sort-key="sortKey"
                                    :sort-direction="sortDirection"
                                    @on-sort-change="updateSort"
                                >
                                    <template #data>
                                        <OrgInviteItem
                                            v-for="invitation in invitations"
                                            :key="invitation.id"
                                            :org-id="orgId"
                                            :org-info="orgInfo"
                                            :invitation="invitation"
                                            @refetch="onRefetch()"
                                        ></OrgInviteItem>
                                    </template>
                                </SortableTable>
                            </template>
                        </Pagination>
                    </div>
                    <div v-else>
                        {{ errorCode }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
