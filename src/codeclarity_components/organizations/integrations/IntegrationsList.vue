<script lang="ts" setup>
import {
    isMemberRoleGreaterOrEqualTo,
    MemberRole,
    Organization
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { Icon } from '@iconify/vue';
import { ref, type Ref } from 'vue';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import {
    IntegrationProvider,
    type VCS
} from '@/codeclarity_components/organizations/integrations/Integrations';
import { useAuthStore } from '@/stores/auth';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import { getDaysUntilExpiry } from '@/utils/dateUtils';
import Button from '@/shadcn/ui/button/Button.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import StatCard from '@/base_components/ui/cards/StatCard.vue';

// Constants
const EXPIRES_IN_DAYS_RISK = 14;

const authStore = useAuthStore();

const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

const orgInfo: Ref<Organization | undefined> = ref();
const vcsIntegrations: Ref<VCS[]> = ref([]);
const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();

const props = defineProps<{
    orgId: string;
}>();

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterOrEqualTo(_orgInfo.role, MemberRole.ADMIN)) {
        router.push({
            name: 'orgs',
            params: { action: 'manage', page: 'integrations', orgId: _orgInfo.id }
        });
    }
}

async function init() {
    await fetchVcsIntegrations();
}

async function fetchVcsIntegrations(refresh: boolean = false) {
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    try {
        const resp = await integrationRepo.getVCS({
            orgId: props.orgId,
            bearerToken: authStore.getToken,
            pagination: {
                page: 0,
                entries_per_page: 100
            },
            handleBusinessErrors: true
        });
        vcsIntegrations.value = resp.data;
    } catch (err) {
        error.value = true;
        if (err instanceof BusinessLogicError) {
            errorCode.value = err.error_code;
        }
    } finally {
        loading.value = false;
    }
}

async function deleteIntegration(integrationId: string) {
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;

    try {
        await integrationRepo.deleteIntegration({
            orgId: props.orgId,
            bearerToken: authStore.getToken,
            integrationId: integrationId,
            handleBusinessErrors: true
        });
    } catch (err) {
        error.value = true;
        if (err instanceof BusinessLogicError) {
            errorCode.value = err.error_code;
        }
    } finally {
        loading.value = false;
    }
    router.go(0);
}

function isAtRisk(vcs: VCS) {
    if (vcs.expiry_date) return getDaysUntilExpiry(vcs.expiry_date) <= EXPIRES_IN_DAYS_RISK;
    else return false;
}

init();
</script>
<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Page Header -->
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)" />

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-8 py-8">
            <!-- Integrations Overview -->
            <InfoCard
                title="Integrations"
                description="Connect external tools and services"
                icon="solar:settings-bold"
                variant="primary"
                class="mb-8"
            >
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        label="Active Integrations"
                        :value="vcsIntegrations.filter((v: any) => !v.invalid).length"
                        icon="solar:check-circle-bold"
                        variant="success"
                        subtitle="Connected services"
                    />

                    <StatCard
                        label="At Risk"
                        :value="vcsIntegrations.filter((v: any) => isAtRisk(v)).length"
                        icon="solar:clock-circle-bold"
                        variant="primary"
                        subtitle="Expiring soon"
                    />

                    <StatCard
                        label="Invalid"
                        :value="vcsIntegrations.filter((v: any) => v.invalid).length"
                        icon="solar:close-circle-bold"
                        variant="danger"
                        subtitle="Need attention"
                    />

                    <StatCard
                        label="Total"
                        :value="vcsIntegrations.length"
                        icon="solar:database-bold"
                        variant="default"
                        subtitle="All integrations"
                    />
                </div>
            </InfoCard>

            <!-- Version Control Section -->
            <InfoCard
                title="Version Control"
                description="Manage your Git repository integrations"
                icon="solar:code-square-bold"
                variant="default"
                class="mb-8"
            >
                <div v-if="loading" class="flex flex-row gap-4 flex-wrap">
                    <BoxLoader
                        v-for="i in 4"
                        :key="i"
                        :dimensions="{ width: '300px', height: '200px' }"
                    />
                </div>

                <div v-if="!loading">
                    <div
                        v-if="error"
                        class="flex flex-row gap-4 items-center p-8 bg-red-50 border border-red-200 rounded-xl"
                    >
                        <Icon
                            class="text-red-500"
                            icon="solar:confounded-square-outline"
                            style="font-size: 3rem"
                        />
                        <div class="flex-1">
                            <div class="text-lg font-semibold text-red-700 mb-2">
                                Failed to fetch VCS integrations
                            </div>
                            <div v-if="errorCode" class="text-red-600 mb-4">
                                We encountered an error while processing the request.
                            </div>
                            <div v-else class="text-red-600 mb-4">
                                We encountered an error while processing the request.
                            </div>
                            <div class="flex flex-row gap-3">
                                <Button variant="destructive" @click="fetchVcsIntegrations"
                                    >Try again</Button
                                >
                                <Button variant="outline" @click="router.back">Go back</Button>
                            </div>
                        </div>
                    </div>

                    <div v-if="!error" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <!-- GitLab Integrations -->
                        <div
                            v-for="vcs in vcsIntegrations.filter(
                                (v: any) => v.integration_provider === IntegrationProvider.GITLAB
                            )"
                            :key="vcs.id"
                            class="bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-200 border-l-4"
                            :class="{
                                'border-l-red-500': vcs.invalid,
                                'border-l-yellow-500': !vcs.invalid && isAtRisk(vcs),
                                'border-l-theme-primary': !vcs.invalid && !isAtRisk(vcs)
                            }"
                        >
                            <div class="flex items-center gap-3 mb-4">
                                <Icon icon="devicon:gitlab" class="text-4xl" />
                                <div>
                                    <h3 class="text-lg font-semibold text-theme-black">GitLab</h3>
                                    <p class="text-sm text-theme-gray">{{ vcs.service_domain }}</p>
                                </div>
                            </div>

                            <div class="mb-6">
                                <div
                                    v-if="vcs.invalid"
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full"
                                >
                                    <Icon icon="solar:close-circle-bold" class="mr-1 text-xs" />
                                    Invalid
                                </div>
                                <div
                                    v-else-if="isAtRisk(vcs)"
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full"
                                >
                                    <Icon icon="solar:clock-circle-bold" class="mr-1 text-xs" />
                                    At Risk
                                </div>
                                <div
                                    v-else
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-theme-primary rounded-full"
                                >
                                    <Icon icon="solar:check-circle-bold" class="mr-1 text-xs" />
                                    Configured
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <RouterLink
                                    :to="{
                                        name: 'orgs',
                                        params: {
                                            action: 'edit',
                                            page: 'integrations',
                                            orgId: orgId
                                        },
                                        query: {
                                            provider: IntegrationProvider.GITLAB,
                                            integrationId: vcs.id
                                        }
                                    }"
                                    class="flex-1"
                                >
                                    <Button
                                        class="w-full bg-theme-black hover:bg-theme-gray text-white"
                                    >
                                        <Icon icon="solar:eye-bold" class="mr-2 text-sm" />
                                        Show
                                    </Button>
                                </RouterLink>
                                <Button
                                    variant="outline"
                                    class="border-red-500 text-red-500 hover:bg-red-50"
                                    @click="deleteIntegration(vcs.id)"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold" class="text-sm" />
                                </Button>
                            </div>
                        </div>

                        <!-- GitHub Integrations -->
                        <div
                            v-for="vcs in vcsIntegrations.filter(
                                (v: any) => v.integration_provider === IntegrationProvider.GITHUB
                            )"
                            :key="vcs.id"
                            class="bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-200 border-l-4"
                            :class="{
                                'border-l-red-500': vcs.invalid,
                                'border-l-yellow-500': !vcs.invalid && isAtRisk(vcs),
                                'border-l-theme-primary': !vcs.invalid && !isAtRisk(vcs)
                            }"
                        >
                            <div class="flex items-center gap-3 mb-4">
                                <Icon icon="devicon:github" class="text-4xl" />
                                <div>
                                    <h3 class="text-lg font-semibold text-theme-black">GitHub</h3>
                                    <p class="text-sm text-theme-gray">
                                        {{ vcs.service_domain || 'GitHub.com' }}
                                    </p>
                                </div>
                            </div>

                            <div class="mb-6">
                                <div
                                    v-if="vcs.invalid"
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full"
                                >
                                    <Icon icon="solar:close-circle-bold" class="mr-1 text-xs" />
                                    Invalid
                                </div>
                                <div
                                    v-else-if="isAtRisk(vcs)"
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full"
                                >
                                    <Icon icon="solar:clock-circle-bold" class="mr-1 text-xs" />
                                    At Risk
                                </div>
                                <div
                                    v-else
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-theme-primary rounded-full"
                                >
                                    <Icon icon="solar:check-circle-bold" class="mr-1 text-xs" />
                                    Configured
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <RouterLink
                                    :to="{
                                        name: 'orgs',
                                        params: {
                                            action: 'edit',
                                            page: 'integrations',
                                            orgId: orgId
                                        },
                                        query: {
                                            provider: IntegrationProvider.GITHUB,
                                            integrationId: vcs.id
                                        }
                                    }"
                                    class="flex-1"
                                >
                                    <Button
                                        class="w-full bg-theme-black hover:bg-theme-gray text-white"
                                    >
                                        <Icon icon="solar:eye-bold" class="mr-2 text-sm" />
                                        Show
                                    </Button>
                                </RouterLink>
                                <Button
                                    variant="outline"
                                    class="border-red-500 text-red-500 hover:bg-red-50"
                                    @click="deleteIntegration(vcs.id)"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold" class="text-sm" />
                                </Button>
                            </div>
                        </div>

                        <!-- Add GitHub Integration -->
                        <RouterLink
                            v-if="
                                !vcsIntegrations.some(
                                    (v: any) =>
                                        v.integration_provider === IntegrationProvider.GITHUB
                                )
                            "
                            :to="{
                                name: 'orgs',
                                params: {
                                    orgId: orgId,
                                    page: 'integrations',
                                    action: 'add',
                                    provider: IntegrationProvider.GITHUB
                                }
                            }"
                            class="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-theme-primary hover:bg-gray-50 transition-all duration-200 group"
                        >
                            <div
                                class="flex flex-col items-center justify-center h-full text-center"
                            >
                                <div class="flex items-center gap-3 mb-4">
                                    <Icon
                                        icon="devicon:github"
                                        class="text-4xl text-gray-400 group-hover:text-theme-black transition-colors"
                                    />
                                    <Icon
                                        icon="solar:add-circle-bold"
                                        class="text-2xl text-theme-primary"
                                    />
                                </div>
                                <h3 class="text-lg font-semibold text-theme-black mb-2">
                                    Add GitHub
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Connect your GitHub repositories
                                </p>
                            </div>
                        </RouterLink>

                        <!-- Add GitLab Integration -->
                        <RouterLink
                            v-if="
                                !vcsIntegrations.some(
                                    (v: any) =>
                                        v.integration_provider === IntegrationProvider.GITLAB
                                )
                            "
                            :to="{
                                name: 'orgs',
                                params: { action: 'add', page: 'integrations', orgId: orgId },
                                query: { provider: IntegrationProvider.GITLAB }
                            }"
                            class="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-theme-primary hover:bg-gray-50 transition-all duration-200 group"
                        >
                            <div
                                class="flex flex-col items-center justify-center h-full text-center"
                            >
                                <div class="flex items-center gap-3 mb-4">
                                    <Icon
                                        icon="devicon:gitlab"
                                        class="text-4xl text-gray-400 group-hover:text-orange-500 transition-colors"
                                    />
                                    <Icon
                                        icon="solar:add-circle-bold"
                                        class="text-2xl text-theme-primary"
                                    />
                                </div>
                                <h3 class="text-lg font-semibold text-theme-black mb-2">
                                    Add GitLab
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Connect your GitLab repositories
                                </p>
                            </div>
                        </RouterLink>
                    </div>
                </div>
            </InfoCard>
        </div>
    </div>
</template>

<style lang="scss" scoped>
/* Custom styles if needed - most styling is now handled by Tailwind classes */
</style>
