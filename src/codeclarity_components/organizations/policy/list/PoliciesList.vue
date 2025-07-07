<script lang="ts" setup>
import {
    MemberRole,
    type Organization,
    isMemberRoleGreaterThan
} from '@/codeclarity_components/organizations/organization.entity';
import router from '@/router';
import { ref, type Ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import HeaderItem from '@/codeclarity_components/organizations/subcomponents/HeaderItem.vue';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { LicensePolicyRepository } from '@/codeclarity_components/organizations/policy/license_policy.repository';
import { Icon } from '@iconify/vue';
import type { LicensePolicy } from '@/codeclarity_components/organizations/policy/license_policy.entity';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import InfoCard from '@/base_components/ui/cards/InfoCard.vue';
import StatCard from '@/base_components/ui/cards/StatCard.vue';
const orgInfo: Ref<Organization | undefined> = ref();

const props = defineProps<{
    page: string;
    orgId: string;
    action?: string;
}>();

const loading: Ref<boolean> = ref(false);
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();

const authStore = useAuthStore();
const licensePolicyRepository: LicensePolicyRepository = new LicensePolicyRepository();

const licensePolicies: Ref<LicensePolicy[]> = ref([]);

function setOrgInfo(_orgInfo: Organization) {
    orgInfo.value = _orgInfo;
    if (!isMemberRoleGreaterThan(_orgInfo.role, MemberRole.USER)) {
        router.push({ name: 'orgManage', params: { page: '', orgId: _orgInfo.id } });
    }
}

async function fetchPolicies(refresh: boolean = false) {
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    try {
        const resp = await licensePolicyRepository.getLicensePolicies({
            orgId: props.orgId,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true,
            page: 0,
            entries_per_page: 0,
            search_key: ''
        });
        licensePolicies.value = resp.data;
    } catch (err) {
        error.value = true;
        if (err instanceof BusinessLogicError) {
            errorCode.value = err.error_code;
        }
    } finally {
        loading.value = false;
    }
}

fetchPolicies();
</script>
<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Page Header -->
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)" />

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-8 py-8">
            <!-- License Policies Overview -->
            <InfoCard
                title="License Policies"
                description="Manage license compliance policies for your organization"
                icon="solar:shield-check-bold"
                variant="primary"
                class="mb-8"
            >
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        label="Total Policies"
                        :value="licensePolicies.length"
                        icon="solar:shield-bold"
                        variant="default"
                        subtitle="All policies"
                    />

                    <StatCard
                        label="Active Policies"
                        :value="licensePolicies.length"
                        icon="solar:check-circle-bold"
                        variant="success"
                        subtitle="Currently enforced"
                    />

                    <StatCard
                        label="License Types"
                        :value="new Set(licensePolicies.flatMap((p) => p.content || [])).size"
                        icon="solar:document-text-bold"
                        variant="primary"
                        subtitle="Unique licenses"
                    />
                </div>
            </InfoCard>

            <!-- License Policies Section -->
            <InfoCard
                title="Policy Management"
                description="Configure and manage your license compliance policies"
                icon="solar:settings-bold"
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
                                Failed to fetch license policies
                            </div>
                            <div v-if="errorCode" class="text-red-600 mb-4">
                                We encountered an error while processing the request.
                            </div>
                            <div v-else class="text-red-600 mb-4">
                                We encountered an error while processing the request.
                            </div>
                            <div class="flex flex-row gap-3">
                                <Button variant="destructive" @click="fetchPolicies"
                                    >Try again</Button
                                >
                                <Button variant="outline" @click="router.back">Go back</Button>
                            </div>
                        </div>
                    </div>

                    <div v-if="!error" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <!-- Existing License Policies -->
                        <div
                            v-for="licensePolicy in licensePolicies"
                            :key="licensePolicy.id"
                            class="bg-white border rounded-xl p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-theme-primary"
                        >
                            <div class="flex items-center gap-3 mb-4">
                                <Icon
                                    icon="solar:shield-check-bold"
                                    class="text-4xl text-theme-primary"
                                />
                                <div class="flex-1">
                                    <h3 class="text-lg font-semibold text-theme-black">
                                        {{ licensePolicy.name }}
                                    </h3>
                                    <p class="text-sm text-theme-gray line-clamp-2">
                                        {{ licensePolicy.description }}
                                    </p>
                                </div>
                            </div>

                            <div class="mb-6">
                                <div
                                    class="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-theme-primary rounded-full"
                                >
                                    <Icon icon="solar:check-circle-bold" class="mr-1 text-xs" />
                                    Active
                                </div>
                            </div>

                            <div class="mb-4">
                                <div class="text-xs text-theme-gray mb-2">
                                    {{
                                        licensePolicy.policy_type === 'WHITELIST'
                                            ? 'Allowed Licenses'
                                            : 'Blocked Licenses'
                                    }}
                                </div>
                                <div class="flex flex-wrap gap-1">
                                    <span
                                        v-for="license in licensePolicy.content?.slice(0, 3)"
                                        :key="license"
                                        class="inline-block px-2 py-1 text-xs rounded"
                                        :class="
                                            licensePolicy.policy_type === 'WHITELIST'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        "
                                    >
                                        {{ license }}
                                    </span>
                                    <span
                                        v-if="(licensePolicy.content?.length || 0) > 3"
                                        class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                                    >
                                        +{{ (licensePolicy.content?.length || 0) - 3 }} more
                                    </span>
                                </div>
                            </div>

                            <div class="flex gap-2">
                                <RouterLink
                                    :to="{
                                        name: 'orgs',
                                        params: {
                                            page: 'policy',
                                            orgId: orgId,
                                            action: 'edit'
                                        },
                                        query: { policyId: licensePolicy.id }
                                    }"
                                    class="flex-1"
                                >
                                    <Button
                                        class="w-full bg-theme-black hover:bg-theme-gray text-white"
                                    >
                                        <Icon icon="solar:eye-bold" class="mr-2 text-sm" />
                                        View
                                    </Button>
                                </RouterLink>
                            </div>
                        </div>

                        <!-- Add New Policy -->
                        <RouterLink
                            :to="{
                                name: 'orgs',
                                params: {
                                    page: 'policy',
                                    orgId: orgId,
                                    action: 'add'
                                }
                            }"
                            class="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-theme-primary hover:bg-gray-50 transition-all duration-200 group"
                        >
                            <div
                                class="flex flex-col items-center justify-center h-full text-center"
                            >
                                <div class="flex items-center gap-3 mb-4">
                                    <Icon
                                        icon="solar:shield-plus-bold"
                                        class="text-4xl text-gray-400 group-hover:text-theme-primary transition-colors"
                                    />
                                    <Icon
                                        icon="solar:add-circle-bold"
                                        class="text-2xl text-theme-primary"
                                    />
                                </div>
                                <h3 class="text-lg font-semibold text-theme-black mb-2">
                                    Add License Policy
                                </h3>
                                <p class="text-sm text-theme-gray">
                                    Create a new license compliance policy
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
