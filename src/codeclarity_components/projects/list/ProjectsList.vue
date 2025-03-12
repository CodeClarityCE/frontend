<script lang="ts" setup>
import { onBeforeUnmount, ref, type Ref } from 'vue';
import { Icon } from '@iconify/vue';
import TextLoader from '@/base_components/TextLoader.vue';
import BoxLoader from '@/base_components/BoxLoader.vue';
// import { useStateStore } from '@/stores/state';
import ProjectsList from './components/ProjectsList.vue';
import { useProjectsMainStore } from '@/stores/StateStore';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { OrgRepository } from '@/codeclarity_components/organizations/organization.repository';
import { useAuthStore } from '@/stores/auth';
import type { OrganizationMetaData } from '@/codeclarity_components/organizations/organization.entity';
import { BusinessLogicError } from '@/utils/api/BaseRepository';
import TitleAndSubtitle from '@/base_components/headers/TitleAndSubtitle.vue';
import { Button } from '@/shadcn/ui/button';
import Skeleton from '@/shadcn/ui/skeleton/Skeleton.vue';

// Repositories
const orgRepo: OrgRepository = new OrgRepository();

// Stores
// const globalState = useStateStore();
const viewState = useProjectsMainStore();
const userStore = useUserStore();
const authStore = useAuthStore();

// globalState.$reset();
// globalState.page = 'projects';

viewState.setOrgId(userStore.getUser!.default_org.id);
const { reposLoading, projectsResponse } = storeToRefs(viewState);

// State
const orgMetaDataLoading: Ref<boolean> = ref(false);
const orgMetaDataError: Ref<boolean> = ref(false);
const orgMetaDataErrorCode: Ref<string | undefined> = ref();
const orgMetaData: Ref<OrganizationMetaData | undefined> = ref();
const { defaultOrg } = storeToRefs(userStore);

onBeforeUnmount(() => {
    viewState.$reset();
});

/**
 * Fetches meta data about an org
 * including amongst other things: whether an integration was added, a projects was addded, and anlyses have been started
 */
async function fetchOrgMetaData() {
    if (!defaultOrg || !defaultOrg.value) return;
    if (!(authStore.getAuthenticated && authStore.getToken)) return;

    orgMetaDataError.value = false;
    orgMetaDataErrorCode.value = undefined;
    orgMetaDataLoading.value = true;

    try {
        const resp = await orgRepo.getOrgMetaData({
            orgId: defaultOrg.value.id,
            bearerToken: authStore.getToken,
            handleBusinessErrors: true
        });
        orgMetaData.value = resp;
    } catch (err) {
        orgMetaDataError.value = true;
        if (err instanceof BusinessLogicError) {
            orgMetaDataErrorCode.value = err.error_code;
        }
    } finally {
        orgMetaDataLoading.value = false;
    }
}

fetchOrgMetaData();
</script>
<template>
    <div class="flex flex-col gap-8 h-full">
        <!-- Header -->
        <div class="flex flex-row gap-4 justify-between items-center">
            <div class="flex flex-row gap-4 justify-between flex-wrap items-center w-full">
                <TitleAndSubtitle>
                    <template #title>Analyze your project</template>
                    <template #description>
                        <div v-if="!reposLoading && projectsResponse">
                            You have {{ projectsResponse!.total_entries }} projects
                        </div>
                        <div v-else-if="projectsResponse">
                            <div class="flex flex-row gap-5 justify-start items-center">
                                <TextLoader class="max-w-72 w-full" />
                                <BoxLoader :dimensions="{ width: '150px', height: '50px' }" />
                            </div>
                        </div>
                    </template>
                </TitleAndSubtitle>
                <div v-if="orgMetaData && orgMetaData.integrations.length > 0">
                    <RouterLink :to="{ name: 'projects', params: { page: 'add' } }">
                        <Button>
                            <Icon icon="ion:add-sharp" /> Add a project
                        </Button>
                    </RouterLink>
                </div>
                <div v-else>
                    <BoxLoader :dimensions="{ height: '40px', width: '125px' }" :static="true"></BoxLoader>
                </div>
            </div>
        </div>

        <div v-if="
            orgMetaDataLoading ||
            orgMetaDataError ||
            (orgMetaData &&
                (orgMetaData.integrations.length == 0 || orgMetaData.projects.length == 0))
        " class="h-full relative">
            <div class="flex flex-col gap-4 h-full">
                <div class="flex flex-row gap-5">
                    <Skeleton class="h-14 w-10/12" />
                    <Skeleton class="h-14 w-2/12" />
                </div>
                <Skeleton class="h-[16.6%] w-full min-h-32" v-for="i in 6" :key="i" />
            </div>
            <div
                class="flex flex-col gap-4 items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg">
                <template v-if="orgMetaDataError">
                    <Icon class="icon" icon="solar:confounded-square-linear" style="font-size: 5rem"></Icon>
                    <div style="font-size: 1.25rem">
                        Unable to fetch the state of your organizaiton
                    </div>
                </template>
                <template v-else-if="orgMetaData">
                    <Icon class="icon" icon="solar:sleeping-square-linear" style="font-size: 5rem"></Icon>
                    <div style="font-size: 1.25rem">
                        <div v-if="orgMetaData.integrations.length == 0">
                            You have no integration with a VCS system yet
                        </div>
                        <div v-else-if="orgMetaData.projects.length == 0">
                            You have imported no projects yet
                        </div>
                    </div>

                    <RouterLink v-if="orgMetaData.integrations.length == 0" :to="{
                        name: 'orgs',
                        params: { orgId: defaultOrg!.id, page: 'integrations', action: 'add' }
                    }">
                        <Button> Link to Github or Gitlab </Button>
                    </RouterLink>
                    <RouterLink v-else-if="orgMetaData.projects.length == 0"
                        :to="{ name: 'projects', params: { page: 'add' } }">
                        <Button>
                            <Icon icon="ion:add-sharp" /> Add a project
                        </Button>
                    </RouterLink>
                </template>
            </div>
        </div>
        <ProjectsList v-else />
    </div>
</template>
