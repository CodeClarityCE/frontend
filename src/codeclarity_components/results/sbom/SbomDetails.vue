<script lang="ts" setup>
import { ref, type Ref } from 'vue';

import SbomDetailsLoader from './SbomDetails/SbomDetailsLoader.vue';
import SbomDetailsHeader from './SbomDetails/SbomDetailsHeader.vue';
import SbomInformation from './SbomDetails/SbomInformation.vue';
import SbomDependencyHealth from './SbomDetails/SbomDependencyHealth.vue';

import { ResultsRepository } from '@/codeclarity_components/results/results.repository';

// Import stores
import { useUserStore } from '@/stores/user';
import { useAuthStore } from '@/stores/auth';
import type { DataResponse } from '@/utils/api/responses/DataResponse';

import { Icon } from '@iconify/vue';

import router from '@/router';
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import Badge from '@/shadcn/ui/badge/Badge.vue';
import SbomImportPaths from './SbomDetails/SbomImportPaths.vue';

type Props = {
    [key: string]: any;
    showBack?: boolean;
    analysisID: string;
    projectID: string;
};

const props = withDefaults(defineProps<Props>(), {
    showBack: false
});

const render: Ref<boolean> = ref(false);
const dependency: Ref<DependencyDetails> = ref(new DependencyDetails());

function goBack() {
    router.back();
}

const resultsRepository: ResultsRepository = new ResultsRepository();

// Store setup
const userStore = useUserStore();
const authStore = useAuthStore();

async function getDependency(projectID: string, analysisID: string) {
    const urlParams = new URLSearchParams(window.location.search);
    const package_id_param = urlParams.get('package_id');

    if (package_id_param == null) return;

    let res: DataResponse<DependencyDetails>;
    try {
        if (userStore.getDefaultOrg == null) {
            throw new Error('No default org');
        }

        if (authStore.getToken == null) {
            throw new Error('No token');
        }

        res = await resultsRepository.getDependency({
            orgId: userStore.getDefaultOrg.id,
            projectId: projectID,
            analysisId: analysisID,
            dependency: package_id_param,
            bearerToken: authStore.getToken,
            workspace: '.',
            handleBusinessErrors: true
        });
        dependency.value = res.data;

        render.value = true;
    } catch (_err) {
        console.error(_err);

        // error.value = true;
        // if (_err instanceof BusinessLogicError) {
        //     errorCode.value = _err.error_code;
        // }
    } finally {
        // loading.value = false;
        // createDepTypeChart();
        // createDepStatusDistChart();
    }
}

getDependency(props.projectID, props.analysisID);
</script>

<template>
    <div class="flex flex-col gap-10">
        <!--------------------------------------------------------------------------->
        <!--                               Navigation                              -->
        <!--------------------------------------------------------------------------->
        <div v-if="showBack" class="cursor-pointer">
            <Badge variant="secondary" title="Go back to preview page" @click="goBack()">
                <Icon :icon="'material-symbols:keyboard-backspace'"></Icon>
                Go back
            </Badge>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                                 Content                               -->
        <!--------------------------------------------------------------------------->
        <div v-if="render" class="flex flex-col gap-10">
            <SbomDetailsHeader :dependency="dependency"></SbomDetailsHeader>
            <div class="flex flex-row flex-wrap gap-y-10">
                <SbomInformation class="w-1/2" :dependency="dependency"></SbomInformation>
                <SbomDependencyHealth class="w-1/2" :dependency="dependency"></SbomDependencyHealth>
                <SbomImportPaths
                    class="w-1/2"
                    :dependency="dependency"
                    :analysis-i-d="analysisID"
                    :project-i-d="projectID"
                ></SbomImportPaths>
            </div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                            Loading skeleton                           -->
        <!--------------------------------------------------------------------------->
        <div v-else>
            <SbomDetailsLoader></SbomDetailsLoader>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/details.scss';
@use '@/assets/common/cvss.scss';
</style>
