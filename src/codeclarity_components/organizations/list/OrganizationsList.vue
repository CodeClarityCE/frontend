<script lang="ts" setup>
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { useAuthStore } from '@/stores/auth';
import { ref, watch, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import SearchBar from '@/base_components/SearchBar.vue';
import Pagination from '@/base_components/PaginationComponent.vue';
import OrgListItem from './ListItem.vue';
import type { OrganizationMembership } from '@/codeclarity_components/organizations/organization_membership.entity';

const search = ref('');
const placeholder = 'Search by organization name or role';
const authStore = useAuthStore();
const loading: Ref<boolean> = ref(true);
const totalEntries: Ref<number> = ref(0);
const totalPages: Ref<number> = ref(0);
const currentPage: Ref<number> = ref(0);
const entriesPerPage: Ref<number> = ref(10);
const errorCode: Ref<string> = ref('');
const error: Ref<boolean> = ref(false);
const orgRepo = new OrgRepository();
const memberships: Ref<OrganizationMembership[]> = ref([]);

async function fetch(refresh: boolean = false) {
    errorCode.value = '';
    error.value = false;
    if (authStore.getAuthenticated && authStore.getToken) {
        if (!refresh) loading.value = true;
        try {
            const _memberships = await orgRepo.getMany({
                bearerToken: authStore.getToken,
                handleBusinessErrors: true,
                pagination: {
                    page: currentPage.value,
                    entries_per_page: entriesPerPage.value
                }
            });
            memberships.value = _memberships.data;
            totalEntries.value = _memberships.total_entries;
            totalPages.value = _memberships.total_pages;
        } catch (_error) {
            error.value = true;
            if (_error instanceof BusinessLogicError) {
                errorCode.value = _error.error_code;
            }
        } finally {
            if (!refresh) loading.value = false;
        }
    }
}

function refresh() {
    fetch(true);
}

watch([search, currentPage], async () => {
    await fetch(true);
});

fetch();
</script>
<template>
    <div class="min-h-screen bg-white">
        <div class="max-w-7xl mx-auto p-6">
            <div class="flex flex-col gap-6">
                <!-- Header Section -->
                <div class="flex flex-row justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-900">Organizations</h1>
                    <RouterLink
                        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
                        :to="{ name: 'orgs', params: { action: 'add', page: 'main' } }"
                    >
                        <Icon icon="solar:add-circle-bold-duotone" class="text-sm" />
                        <span>Create Organization</span>
                    </RouterLink>
                </div>

                <!-- Search Section -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <SearchBar
                        v-model:search-key="search"
                        :placeholder="placeholder"
                        class="w-full"
                    />
                </div>

                <!-- Organizations List -->
                <div v-if="!loading">
                    <Pagination
                        v-model:page="currentPage"
                        v-model:nmb-entries-showing="entriesPerPage"
                        v-model:nmb-entries-total="totalEntries"
                        v-model:total-pages="totalPages"
                    >
                        <template #content>
                            <div
                                v-if="memberships.length === 0"
                                class="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center"
                            >
                                <div
                                    class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <Icon
                                        icon="solar:buildings-3-bold-duotone"
                                        class="text-3xl text-gray-400"
                                    />
                                </div>
                                <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                    No organizations found
                                </h3>
                                <p class="text-gray-600 mb-4">
                                    You don't have any organizations yet or no organizations match
                                    your search.
                                </p>
                                <RouterLink
                                    class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                                    :to="{ name: 'orgs', params: { action: 'add', page: 'main' } }"
                                >
                                    <Icon icon="solar:add-circle-bold-duotone" />
                                    Create your first organization
                                </RouterLink>
                            </div>

                            <div
                                v-else
                                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            >
                                <OrgListItem
                                    v-for="membership in memberships"
                                    :key="membership.organization.id"
                                    :membership="membership"
                                    @refresh="refresh()"
                                />
                            </div>
                        </template>
                    </Pagination>
                </div>

                <!-- Loading State -->
                <div
                    v-if="loading"
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    <div
                        v-for="i in 8"
                        :key="i"
                        class="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse"
                    >
                        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div class="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div class="h-20 bg-gray-200 rounded mb-4"></div>
                        <div class="h-8 bg-gray-200 rounded"></div>
                    </div>
                </div>

                <!-- Error State -->
                <div
                    v-if="error"
                    class="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center"
                >
                    <div
                        class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Icon
                            icon="solar:danger-triangle-bold-duotone"
                            class="text-3xl text-red-600"
                        />
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">
                        Failed to load organizations
                    </h3>
                    <p class="text-gray-600 mb-4">
                        We encountered an error while loading your organizations.
                    </p>
                    <button
                        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                        @click="fetch()"
                    >
                        <Icon icon="solar:refresh-bold-duotone" />
                        Try again
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
