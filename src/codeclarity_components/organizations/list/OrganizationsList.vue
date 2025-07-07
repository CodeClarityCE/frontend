<script lang="ts" setup>
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { useAuthStore } from '@/stores/auth';
import { ref, watch, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import SearchBar from '@/base_components/filters/SearchBar.vue';
import Pagination from '@/base_components/utilities/PaginationComponent.vue';
import StatCard from '@/base_components/ui/cards/StatCard.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import Button from '@/shadcn/ui/button/Button.vue';
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
    <div class="space-y-6">
        <!-- Statistics Cards Row -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
                label="Total Organizations"
                :value="totalEntries"
                icon="solar:buildings-3-bold-duotone"
                variant="primary"
            />
            <StatCard
                label="Your Memberships"
                :value="memberships.length"
                icon="solar:users-group-rounded-bold-duotone"
                variant="default"
            />
            <StatCard
                label="Active Projects"
                :value="24"
                icon="solar:code-square-bold-duotone"
                variant="success"
                subtitle="All organizations"
            />
        </div>

        <!-- Quick Actions Card -->
        <InfoCard
            title="Quick Actions"
            description="Manage your organizations and create new ones"
            icon="solar:widget-4-bold-duotone"
            variant="primary"
        >
            <template #actions>
                <RouterLink :to="{ name: 'orgs', params: { action: 'add', page: 'main' } }">
                    <Button class="bg-theme-primary hover:bg-theme-primary-dark text-white">
                        <Icon icon="solar:add-circle-bold-duotone" class="h-4 w-4 mr-2" />
                        Create Organization
                    </Button>
                </RouterLink>
            </template>
            <div class="mt-4">
                <p class="text-sm text-theme-gray">
                    Start by creating your first organization to manage projects, invite team
                    members, and set up security policies.
                </p>
            </div>
        </InfoCard>

        <!-- Search Section -->
        <InfoCard
            title="Search Organizations"
            description="Find organizations by name or your role"
            icon="solar:magnifer-bold-duotone"
        >
            <div class="mt-4">
                <SearchBar v-model:search-key="search" :placeholder="placeholder" class="w-full" />
            </div>
        </InfoCard>

        <!-- Organizations List -->
        <div v-if="!loading">
            <Pagination
                v-model:page="currentPage"
                v-model:nmb-entries-showing="entriesPerPage"
                v-model:nmb-entries-total="totalEntries"
                v-model:total-pages="totalPages"
            >
                <template #content>
                    <!-- Empty State -->
                    <InfoCard
                        v-if="memberships.length === 0"
                        title="No organizations found"
                        description="You don't have any organizations yet or no organizations match your search"
                        icon="solar:buildings-3-bold-duotone"
                        variant="default"
                    >
                        <template #actions>
                            <RouterLink
                                :to="{ name: 'orgs', params: { action: 'add', page: 'main' } }"
                            >
                                <Button
                                    class="bg-theme-primary hover:bg-theme-primary-dark text-white"
                                >
                                    <Icon
                                        icon="solar:add-circle-bold-duotone"
                                        class="h-4 w-4 mr-2"
                                    />
                                    Create your first organization
                                </Button>
                            </RouterLink>
                        </template>
                        <div class="mt-4 text-center">
                            <div
                                class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <Icon
                                    icon="solar:buildings-3-bold-duotone"
                                    class="text-3xl text-gray-400"
                                />
                            </div>
                            <p class="text-theme-gray">
                                Organizations help you manage your projects, team members, and
                                security settings in one place.
                            </p>
                        </div>
                    </InfoCard>

                    <!-- Organizations Grid -->
                    <div
                        v-else
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            <div
                v-for="i in 8"
                :key="i"
                class="bg-white border border-gray-200 rounded-lg p-6 animate-pulse shadow-sm"
            >
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div class="h-20 bg-gray-200 rounded mb-4"></div>
                <div class="h-8 bg-gray-200 rounded"></div>
            </div>
        </div>

        <!-- Error State -->
        <InfoCard
            v-if="error"
            title="Failed to load organizations"
            description="We encountered an error while loading your organizations"
            icon="solar:danger-triangle-bold-duotone"
            variant="danger"
        >
            <template #actions>
                <Button
                    variant="outline"
                    class="border-red-500 text-red-600 hover:bg-red-50"
                    @click="fetch()"
                >
                    <Icon icon="solar:refresh-bold-duotone" class="h-4 w-4 mr-2" />
                    Try again
                </Button>
            </template>
            <div class="mt-4 text-center">
                <div
                    class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                    <Icon icon="solar:danger-triangle-bold-duotone" class="text-3xl text-red-600" />
                </div>
                <p class="text-theme-gray">
                    Please check your connection and try again. If the problem persists, contact
                    support.
                </p>
            </div>
        </InfoCard>
    </div>
</template>
