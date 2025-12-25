<script lang="ts" setup>
import SortableTable from '@/base_components/data-display/tables/SortableTable.vue';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import Pagination from '@/base_components/utilities/PaginationComponent.vue';
import {
    MemberRole,
    type TeamMember,
    type Organization,
    isMemberRoleGreaterThan
} from '@/codeclarity_components/organizations/organization.entity';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import router from '@/router';
import Button from '@/shadcn/ui/button/Button.vue';
import { useAuthStore } from '@/stores/auth';
import { APIErrors } from '@/utils/api/ApiErrors';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { SortDirection } from '@/utils/api/PaginatedRequestOptions';
import { debounce } from '@/utils/searchUtils';
import { Icon } from '@iconify/vue';
import { onMounted, ref, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import OrgMemberItem from './members/MemberItem.vue';

const orgRepo = new OrgRepository();
const authStore = useAuthStore();
const placeholder = 'Search by user email or handle';

const search: Ref<string> = ref('');
const loadingMembers: Ref<boolean> = ref(false);
const orgInfo: Ref<Organization | undefined> = ref();
const errorCodeMembers: Ref<string> = ref('');
const errorMembers: Ref<boolean> = ref(false);
const orgId: Ref<string> = ref('');
const orgMembers: Ref<TeamMember[]> = ref([]);
const totalEntries: Ref<number> = ref(0);
const totalPages: Ref<number> = ref(0);
const currentPage: Ref<number> = ref(0);
const entriesPerPage: Ref<number> = ref(10);
const sortDirection: Ref<SortDirection> = ref(SortDirection.DESC);
const sortKey: Ref<string> = ref('role');

const headers = [
    { label: 'User', key: 'handle' },
    { label: 'Email', key: 'email' },
    { label: 'Role', key: 'role' },
    { label: 'Joined', key: 'joined_on' },
    { label: 'Actions', key: null }
];

watch([currentPage, entriesPerPage], async () => {
    await fetchOrganizationMembers(true);
});

async function fetchOrganizationMembers(refresh = false): Promise<void> {
    if (!orgId.value) return;
    if (authStore.getAuthenticated && authStore.getToken) {
        errorMembers.value = false;
        errorCodeMembers.value = '';
        if (!refresh) loadingMembers.value = true;
        try {
            const resp = await orgRepo.getOrgMembers({
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
            orgMembers.value = resp.data;
            totalEntries.value = resp.total_entries;
            totalPages.value = resp.total_pages;
        } catch (err) {
            errorMembers.value = true;
            if (err instanceof BusinessLogicError) {
                errorCodeMembers.value = err.error_code;
            }
        } finally {
            if (!refresh) loadingMembers.value = false;
        }
    }
}

async function updateSort(key: string | null | undefined): Promise<void> {
    if (key == null) return;
    if (key === sortKey.value) {
        // If we select the same column then we reverse the direction
        sortDirection.value =
            (sortDirection.value) === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC;
    } else {
        // Default direction
        sortDirection.value = SortDirection.DESC;
    }
    sortKey.value = key;
    await fetchOrganizationMembers(true);
}

onMounted(() => {
    void init();
});

watch([search], async () => {
    debounce(async () => {
        await fetchOrganizationMembers(true);
    }, 250);
});

function init(): void {
    const route = useRoute();
    const _orgId = route.params['orgId'];

    if (!_orgId) {
        router.back();
        return;
    }

    if (typeof _orgId === 'string') {
        orgId.value = _orgId;
        void fetchOrganizationMembers();
    } else {
        router.back();
    }
}

function setOrgInfo(_orgInfo: Organization): void {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterThan(_orgInfo.role, MemberRole.USER)) {
        void router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

async function onRefetch(): Promise<void> {
    await fetchOrganizationMembers(true);
}
</script>
<template>
    <div class="flex flex-col gap-8 org-members-manage-wrapper">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>
        <div v-if="orgInfo" class="flex flex-col gap-8 p-12">
            <div
                v-if="
                    (!orgInfo.personal && orgInfo.role === MemberRole.OWNER) ||
                    orgInfo.role === MemberRole.ADMIN ||
                    orgInfo.role === MemberRole.MODERATOR
                "
            >
                <h2 class="text-2xl font-semibold mb-4">Related Actions</h2>
                <div class="flex flex-row gap-4 flex-wrap items-stretch org-manage-items">
                    <RouterLink :to="{ name: 'orgAddInvite', params: { orgId: orgId } }">
                        <Button class="w-full flex flex-col gap-2" variant="outline">
                            Invite another User
                        </Button>
                    </RouterLink>
                    <RouterLink
                        :to="{ name: 'orgManage', params: { orgId: orgId, page: 'invites' } }"
                    >
                        <Button class="w-full flex flex-col gap-2" variant="outline">
                            Manage organization invites
                        </Button>
                    </RouterLink>
                </div>
            </div>
            <div>
                <h2 class="text-2xl font-semibold mb-4">Member Management</h2>
                <div v-if="loadingMembers">
                    <div class="flex flex-col gap-2 justify-between" style="padding: 5px">
                        <BoxLoader
                            v-for="i in 10"
                            :key="i"
                            :dimensions="{ width: '100%', height: '50px' }"
                        />
                    </div>
                </div>
                <div v-else>
                    <div v-if="!errorMembers" class="flex flex-col gap-5 org-members-list-wrapper">
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
                                    No members match your search
                                </div>
                                <div
                                    v-if="totalEntries === 0 && search === ''"
                                    class="flex flex-row gap-4 justify-center"
                                    style="margin-top: 10px"
                                >
                                    No members
                                </div>
                                <SortableTable
                                    :headers="headers"
                                    :sort-key="sortKey"
                                    :sort-direction="sortDirection"
                                    @on-sort-change="updateSort"
                                >
                                    <template #data>
                                        <OrgMemberItem
                                            v-for="member in orgMembers"
                                            :key="member.id"
                                            :member="member"
                                            :org-info="orgInfo"
                                            @refetch="onRefetch()"
                                        >
                                        </OrgMemberItem>
                                    </template>
                                </SortableTable>
                            </template>
                        </Pagination>
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
                                        <div>We failed to retrieve the organization's members</div>
                                        <div style="font-size: 0.7em">
                                            <div
                                                v-if="errorCodeMembers === APIErrors.EntityNotFound"
                                            >
                                                This organization does not exist.
                                            </div>
                                            <div v-if="errorCodeMembers === APIErrors.NotAuthorized">
                                                You do not have permission to access the
                                                organization's members..
                                            </div>
                                            <div v-else>
                                                You can try again, and if the error persits, then
                                                please contact the webmaster.
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex flex-row gap-2 items-center flex-wrap">
                                        <Button
                                            v-if="errorCodeMembers !== APIErrors.NotAuthorized"
                                            @click="fetchOrganizationMembers"
                                        >
                                            Try again
                                        </Button>
                                        <Button @click="router.push({ name: 'orgs' })">
                                            Go back
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
