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
    <div class="sbom-details-container">
        <!--------------------------------------------------------------------------->
        <!--                               Navigation                              -->
        <!--------------------------------------------------------------------------->
        <div v-if="showBack" class="navigation-section">
            <Badge
                variant="secondary"
                title="Go back to preview page"
                class="back-button"
                @click="goBack()"
            >
                <Icon :icon="'material-symbols:keyboard-backspace'" class="mr-2"></Icon>
                Go back
            </Badge>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                                 Content                               -->
        <!--------------------------------------------------------------------------->
        <div v-if="render" class="content-wrapper">
            <!-- Header Section -->
            <div class="header-section">
                <SbomDetailsHeader :dependency="dependency"></SbomDetailsHeader>
            </div>

            <!-- Main Content Grid -->
            <div class="main-content-grid">
                <!-- Information Card -->
                <div class="content-card information-card">
                    <SbomInformation :dependency="dependency"></SbomInformation>
                </div>

                <!-- Dependency Health Card -->
                <div class="content-card health-card">
                    <SbomDependencyHealth :dependency="dependency"></SbomDependencyHealth>
                </div>

                <!-- Import Paths Card - spans full width -->
                <div class="content-card import-paths-card">
                    <SbomImportPaths
                        :dependency="dependency"
                        :analysis-i-d="analysisID"
                        :project-i-d="projectID"
                    ></SbomImportPaths>
                </div>
            </div>
        </div>

        <!--------------------------------------------------------------------------->
        <!--                            Loading skeleton                           -->
        <!--------------------------------------------------------------------------->
        <div v-else class="loading-wrapper">
            <SbomDetailsLoader></SbomDetailsLoader>
        </div>
    </div>
</template>

<style scoped lang="scss">
@use '@/assets/colors.scss';
@use '@/assets/common/details.scss';
@use '@/assets/common/cvss.scss';

.sbom-details-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    background: #f8fafc;
    min-height: 100vh;
}

.navigation-section {
    margin-bottom: 1.5rem;

    .back-button {
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);

        &:hover {
            background: #f9fafb;
            border-color: #d1d5db;
        }
    }
}

.content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.header-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow:
        0 1px 3px 0 rgb(0 0 0 / 0.1),
        0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.main-content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
}

.content-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    box-shadow:
        0 1px 3px 0 rgb(0 0 0 / 0.1),
        0 1px 2px -1px rgb(0 0 0 / 0.1);
    transition: box-shadow 0.15s ease-in-out;

    &:hover {
        box-shadow:
            0 4px 6px -1px rgb(0 0 0 / 0.1),
            0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
}

.import-paths-card {
    grid-column: 1 / -1;
}

.loading-wrapper {
    background: white;
    border-radius: 8px;
    padding: 3rem;
    border: 1px solid #e5e7eb;
    box-shadow:
        0 1px 3px 0 rgb(0 0 0 / 0.1),
        0 1px 2px -1px rgb(0 0 0 / 0.1);
    text-align: center;
}

/* Enhanced responsive design */
@media (max-width: 768px) {
    .sbom-details-container {
        padding: 1rem;
    }

    .header-section {
        padding: 1rem;
    }

    .content-card {
        padding: 1rem;
    }

    .main-content-grid {
        gap: 1rem;
    }
}
</style>
