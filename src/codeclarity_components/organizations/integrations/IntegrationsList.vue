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
import BoxLoader from '@/base_components/BoxLoader.vue';
import moment from 'moment';
import Button from '@/shadcn/ui/button/Button.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/ui/card';

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

function isAtRisk(vcs: VCS) {
    if (vcs.expiry_date)
        return (
            moment.duration(moment(vcs.expiry_date).diff(new Date())).asDays() <=
            EXPIRES_IN_DAYS_RISK
        );
    else return false;
}

init();
</script>
<template>
    <div class="flex flex-col gap-8">
        <HeaderItem v-if="orgId" :org-id="orgId" @on-org-info="setOrgInfo($event)"></HeaderItem>
        <div class="org-integrations-wrapper p-12">
            <div class="org-integrations-group">
                <div class="title">Version Control</div>

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
                                    <Button @click="fetchVcsIntegrations"> Try again </Button>
                                    <Button @click="router.back"> Go back </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        v-if="!error"
                        class="integration-box-wrapper flex flex-row gap-4 flex-wrap"
                    >
                        <template v-for="vcs in vcsIntegrations">
                            <RouterLink
                                v-if="vcs.integration_provider == IntegrationProvider.GITLAB"
                                :key="vcs.id"
                                class="integration-box-wrapper-item"
                                :to="{
                                    name: 'orgs',
                                    params: {
                                        provider: IntegrationProvider.GITLAB,
                                        integrationId: vcs.id,
                                        orgId: orgId,
                                        page: 'integrations',
                                        action: 'edit'
                                    }
                                }"
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle class="flex gap-2 items-center">
                                            <Icon icon="devicon:gitlab" class="text-4xl"></Icon>
                                            Gitlab
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div class="flex flex-col gap-1 items-center">
                                            <div
                                                v-if="vcs.invalid == true"
                                                class="text-[#d50909] font-black"
                                            >
                                                Invalid
                                            </div>
                                            <div
                                                v-else-if="isAtRisk(vcs)"
                                                class="text-[#ebc017] font-black"
                                            >
                                                At risk
                                            </div>
                                            <div
                                                v-else-if="vcs.invalid == false"
                                                class="text-[#1d7e2c] font-black"
                                            >
                                                Configured
                                            </div>
                                            <div>
                                                {{ vcs.service_domain }}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </RouterLink>
                            <RouterLink
                                v-if="vcs.integration_provider == IntegrationProvider.GITHUB"
                                :key="vcs.id"
                                class="integration-box-wrapper-item"
                                :to="{
                                    name: 'orgs',
                                    params: { action: 'edit', page: 'integrations', orgId: orgId },
                                    query: {
                                        provider: IntegrationProvider.GITHUB,
                                        integrationId: vcs.id
                                    }
                                }"
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle class="flex gap-2 items-center">
                                            <Icon icon="devicon:github" class="text-4xl"></Icon>
                                            Github
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div class="flex flex-col gap-1 items-center">
                                            <div
                                                v-if="vcs.invalid == true"
                                                class="text-[#d50909] font-black"
                                            >
                                                Invalid
                                            </div>
                                            <div
                                                v-else-if="isAtRisk(vcs)"
                                                class="text-[#ebc017] font-black"
                                            >
                                                At risk
                                            </div>
                                            <div
                                                v-else-if="vcs.invalid == false"
                                                class="text-[#1d7e2c] font-black"
                                            >
                                                Configured
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </RouterLink>
                        </template>
                        <RouterLink
                            v-if="
                                !vcsIntegrations.some(
                                    (v) => v.integration_provider == IntegrationProvider.GITHUB
                                )
                            "
                            class="integration-box-wrapper-item"
                            :to="{
                                name: 'orgAddIntegration',
                                params: { provider: IntegrationProvider.GITHUB }
                            }"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle class="flex gap-2 justify-evenly items-center">
                                        <Icon icon="devicon:github" class="text-4xl"></Icon>
                                        Github
                                        <Icon class="text-3xl" icon="solar:add-circle-bold"></Icon>
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </RouterLink>
                        <RouterLink
                            v-if="
                                !vcsIntegrations.some(
                                    (v) => v.integration_provider == IntegrationProvider.GITLAB
                                )
                            "
                            class="integration-box-wrapper-item"
                            :to="{
                                name: 'orgs',
                                params: { action: 'add', page: 'integrations', orgId: orgId },
                                query: { provider: IntegrationProvider.GITLAB }
                            }"
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle class="flex gap-2 justify-evenly items-center">
                                        <Icon icon="devicon:gitlab" class="text-4xl"></Icon>
                                        Gitlab
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

<style lang="scss" scoped>
.org-integrations-wrapper {
    .org-integrations-group {
        display: flex;
        flex-direction: column;
        row-gap: 15px;

        .title {
            color: #4f4e4e;
            font-size: 2em;
            font-weight: 600;
        }
    }
}

.org-integrations-wrapper {
    .integration-box-wrapper {
        .integration-box-wrapper-item {
            height: unset;
            width: 100%;
            min-height: 125px;
            max-width: 170px;
        }

        .integration-box {
            cursor: pointer;
            position: relative;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            aspect-ratio: unset;
            row-gap: 12px;
        }

        @media only screen and (min-width: 0px) {
            .integration-box-wrapper-item {
                width: 100%;
                max-width: 100%;
            }
        }

        @media only screen and (min-width: 650px) {
            .integration-box-wrapper-item {
                width: calc(50% - 7.5px);
                max-width: 100%;
            }
        }

        @media only screen and (min-width: 850px) {
            .integration-box-wrapper-item {
                width: calc((100% / 3) - (7.5 * 1.4px));
            }
        }

        @media only screen and (min-width: 1000px) {
            .integration-box-wrapper-item {
                width: calc((100% / 4) - (7.5 * 1.5px));
            }
        }

        @media only screen and (min-width: 1200px) {
            .integration-box-wrapper-item {
                width: calc((100% / 5) - (7.5 * 1.6px));
            }
        }

        @media only screen and (min-width: 1400px) {
            .integration-box-wrapper-item {
                width: calc((100% / 6) - (7.5 * 1.7px));
            }
        }
    }
}
</style>
