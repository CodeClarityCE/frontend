<script lang="ts" setup>
import {
    MemberRole,
    type Organization,
    isMemberRoleGreaterThan
} from '@/repositories/types/entities/Organization';
import router from '@/router';
import { ref, type Ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import OrgHeaderItem from '@/views/org/subcomponents/OrgHeaderItem.vue';
import BlueButton from '@/common_components/buttons/BlueButton.vue';
import BorderCard from '@/common_components/cards/BorderCard.vue';
import { BusinessLogicError } from '@/repositories/BaseRepository';
import { LicensePolicyRepository } from '@/repositories/LicensePolicyRepository';
import { Icon } from '@iconify/vue';
import type { LicensePolicy } from '@/repositories/types/entities/LicensePolicy';
import BoxLoader from '@/common_components/BoxLoader.vue';
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
    <div class="flex flex-col gap-8 org-members-manage-wrapper">
        <OrgHeaderItem
            v-if="orgId"
            :org-id="orgId"
            @on-org-info="setOrgInfo($event)"
        ></OrgHeaderItem>
        <div class="org-integrations-wrapper">
            <div class="flex flex-col gap-4 p-12">
                <div class="text-[#4f4e4e] text-3xl font-semibold">License Policies</div>

                <div v-if="loading">
                    <div class="integration-box-wrapper flex flex-row gap-4 flex-wrap">
                        <BoxLoader
                            :dimensions="{ width: '150px', height: '150px' }"
                            v-for="i in 4"
                            v-bind:key="i"
                        />
                    </div>
                </div>

                <div v-if="!loading">
                    <div class="flex flex-row gap-2" v-if="error">
                        <Icon
                            class="icon user-icon"
                            icon="solar:confounded-square-outline"
                            style="font-size: 3rem; height: fit-content"
                        ></Icon>
                        <div>
                            <div class="flex flex-col gap-5">
                                <div class="flex flex-col gap-2">
                                    <div>Failed to fetch VCS integrations</div>
                                    <div style="font-size: 0.9em" v-if="errorCode">
                                        We encountered an error while processing the request.
                                    </div>
                                    <div style="font-size: 0.9eem" v-else>
                                        <div>
                                            We encountered an error while processing the request.
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-row gap-2 items-center flex-wrap">
                                    <BlueButton @click="fetchPolicies">
                                        <template #text> Try again </template>
                                    </BlueButton>
                                    <BlueButton @click="router.back">
                                        <template #text> Go back </template>
                                    </BlueButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="integration-box-wrapper flex flex-row gap-4 flex-wrap"
                        v-if="!error"
                    >
                        <template
                            v-for="licensePolicy in licensePolicies"
                            v-bind:key="licensePolicy.id"
                        >
                            <RouterLink
                                class="integration-box-wrapper-iteme"
                                :to="{
                                    name: 'orgs',
                                    params: {
                                        page: 'policy',
                                        orgId: orgId,
                                        action: 'edit'
                                    },
                                    query: { policyId: licensePolicy.id }
                                }"
                            >
                                <BorderCard :hover="true" :integration="true">
                                    <template #title>
                                        <div class="text-2xl font-semibold text-[#606060]">
                                            {{ licensePolicy.name }}
                                        </div>
                                    </template>
                                    <template #icon>
                                        <Icon class="text-3xl" icon="solar:settings-bold"></Icon>
                                    </template>
                                    <template #content>
                                        <div class="flex flex-col gap-1 items-center">
                                            <div class="text-[#606060]">
                                                {{ licensePolicy.description }}
                                            </div>
                                        </div>
                                    </template>
                                </BorderCard>
                            </RouterLink>
                        </template>
                        <RouterLink
                            class="integration-box-wrapper-item"
                            :to="{
                                name: 'orgs',
                                params: {
                                    page: 'policy',
                                    orgId: orgId,
                                    action: 'add'
                                }
                            }"
                        >
                            <BorderCard :hover="true" :integration="true">
                                <template #title>
                                    <div class="text-2xl font-semibold text-[#606060]">
                                        Add a license policy
                                    </div>
                                </template>
                                <template #icon>
                                    <Icon class="text-3xl" icon="solar:add-circle-bold"></Icon>
                                </template>
                            </BorderCard>
                        </RouterLink>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
