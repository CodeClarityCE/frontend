<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import {
    VCS,
    IntegrationProvider
} from '@/codeclarity_components/organizations/integrations/Integrations';
import { useStateStore } from '@/stores/state';
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import { IntegrationsRepository } from '@/codeclarity_components/organizations/integrations/IntegrationsRepository';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import { Icon } from '@iconify/vue';
import router from '@/router';
import GithubImportComponent from './import/GithubImportComponent.vue';
import GitlabImportComponent from './import/GitlabImportComponent.vue';
import BoxLoader from '@/base_components/ui/loaders/BoxLoader.vue';
import { storeToRefs } from 'pinia';
import NoIntegration from './integrations/NoIntegration.vue';
import Integrations from './integrations/IntegrationsComponent.vue';
import Button from '@/shadcn/ui/button/Button.vue';

// Repositories
const integrationRepo: IntegrationsRepository = new IntegrationsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();
const stateStore = useStateStore();

const { defaultOrg } = storeToRefs(userStore);

watch(defaultOrg!, () => {
    fetchVcsIntegrations(true);
});

stateStore.$reset();
stateStore.page = 'projects';

// State
const error: Ref<boolean> = ref(false);
const errorCode: Ref<string | undefined> = ref();
const loading: Ref<boolean> = ref(true);
const selectedVCS: Ref<VCS | undefined> = ref();

// Data setup
const vcsIntegrations: Ref<VCS[]> = ref([]);

// Methods
async function fetchVcsIntegrations(refresh: boolean = false) {
    if (!defaultOrg!.value!.id) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    error.value = false;
    errorCode.value = undefined;
    if (!refresh) loading.value = true;

    try {
        const resp = await integrationRepo.getVCS({
            orgId: defaultOrg!.value!.id,
            bearerToken: authStore.getToken,
            pagination: {
                page: 0,
                entries_per_page: 100
            },
            handleBusinessErrors: true
        });
        vcsIntegrations.value = resp.data.filter((vcs) => !vcs.invalid);
        if (vcsIntegrations.value.length == 1) {
            selectedVCS.value = vcsIntegrations.value[0];
        }
    } catch (_err) {
        error.value = true;
        if (_err instanceof BusinessLogicError) {
            errorCode.value = _err.error_code;
        }
    } finally {
        loading.value = false;
    }
}

async function onIntegrationsRefresh() {
    await fetchVcsIntegrations();
}

async function onSelectedVCS(vcs: VCS) {
    selectedVCS.value = vcs;
}

fetchVcsIntegrations();
</script>

<template>
    <!-- Loading Placeholder -->
    <div v-if="loading">
        <div class="flex flex-row gap-4 flex-wrap">
            <BoxLoader v-for="i in 4" :key="i" :dimensions="{ width: '150px', height: '150px' }" />
        </div>
    </div>

    <div v-else>
        <!-- VCS Fetch Error -->
        <div v-if="error">
            <div class="flex flex-row gap-2">
                <Icon
                    class="text-xl"
                    icon="solar:confounded-square-outline"
                    style="font-size: 3rem; height: fit-content"
                ></Icon>
                <div>
                    <div class="flex flex-col gap-5">
                        <div class="flex flex-col gap-2">
                            <div>Failed to fetch VCS integrations</div>
                            <div v-if="errorCode" class="text-sm">
                                We encountered an error while processing the request.
                            </div>
                            <div v-else class="text-sm">
                                <div>We encountered an error while processing the request.</div>
                            </div>
                        </div>
                        <div class="flex flex-row gap-2 items-center flex-wrap">
                            <Button
                                class="bg-theme-primary hover:bg-theme-primary-dark text-white"
                                @click="fetchVcsIntegrations()"
                            >
                                Try again
                            </Button>
                            <Button
                                variant="outline"
                                class="border-slate-300 hover:border-theme-primary hover:text-theme-primary"
                                @click="router.back()"
                            >
                                Go back
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- VCS Selection -->
        <template v-else-if="!error && !selectedVCS">
            <div v-if="vcsIntegrations.length == 0">
                <NoIntegration :default-org="defaultOrg!" @on-refresh="onIntegrationsRefresh">
                </NoIntegration>
            </div>

            <div v-else-if="vcsIntegrations.length > 0">
                <Integrations
                    :vcs-integrations="vcsIntegrations"
                    @on-selected-v-c-s="onSelectedVCS"
                >
                </Integrations>
            </div>
        </template>

        <!-- Import Repo Screen -->
        <div v-else-if="!error && selectedVCS">
            <div class="flex flex-col gap-12">
                <h2
                    class="text-4xl font-bold tracking-tight bg-gradient-to-r from-black via-theme-gray to-theme-primary bg-clip-text text-transparent"
                >
                    Projects
                </h2>
                <GithubImportComponent
                    v-if="selectedVCS.integration_provider == IntegrationProvider.GITHUB"
                    :integration="selectedVCS.id"
                >
                </GithubImportComponent>
                <GitlabImportComponent
                    v-if="selectedVCS.integration_provider == IntegrationProvider.GITLAB"
                    :integration="selectedVCS.id"
                >
                </GitlabImportComponent>
            </div>
        </div>
    </div>
</template>
