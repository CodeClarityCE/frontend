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
import BoxLoader from '@/base_components/BoxLoader.vue';
import Button from '@/shadcn/ui/button/Button.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';
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
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>
        <div class="org-integrations-wrapper">
            <div class="flex flex-col gap-4 p-12">
                <div class="text-[#4f4e4e] text-3xl font-semibold">License Policies</div>

                <div v-if="loading">
                    <div class="integration-box-wrapper flex flex-row gap-4 flex-wrap">
                        <BoxLoader
                            v-for="i in 4"
                            :key="i"
                            :dimensions="{ width: '150px', height: '150px' }"
                        />
                    </div>
                </div>

                <div v-if="!loading">
                    <div v-if="error" class="flex flex-row gap-2">
                        <Icon
                            class="icon user-icon"
                            icon="solar:confounded-square-outline"
                            style="font-size: 3rem; height: fit-content"
                        ></Icon>
                        <div>
                            <div class="flex flex-col gap-5">
                                <div class="flex flex-col gap-2">
                                    <div>Failed to fetch VCS integrations</div>
                                    <div v-if="errorCode" style="font-size: 0.9em">
                                        We encountered an error while processing the request.
                                    </div>
                                    <div v-else style="font-size: 0.9eem">
                                        <div>
                                            We encountered an error while processing the request.
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-row gap-2 items-center flex-wrap">
                                    <Button @click="fetchPolicies"> Try again </Button>
                                    <Button @click="router.back"> Go back </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="!error"
                        class="integration-box-wrapper flex flex-row gap-4 flex-wrap"
                    >
                        <template
                            v-for="licensePolicy in licensePolicies"
                            :key="licensePolicy.id"
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
                                <Card>
                                    <CardHeader>
                                        <CardTitle class="flex gap-4 items-center">
                                            {{ licensePolicy.name }}
                                            <Icon
                                                class="text-3xl"
                                                icon="solar:settings-bold"
                                            ></Icon>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>{{ licensePolicy.description }}</CardContent>
                                </Card>
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
                            <Card>
                                <CardHeader>
                                    <CardTitle class="flex gap-4 items-center">
                                        Add a license policy
                                        <Icon class="text-3xl" icon="solar:add-circle-bold"></Icon>
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </RouterLink>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
