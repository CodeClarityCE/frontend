<template>
    <div
        v-show="!details"
        v-if="!only_details"
        class="w-full flex flex-col gap-14"
        id="main-container"
    >
        <TitleAndSubtitle class="pt-8">
            <template #title>
                <div class="flex flex-row gap-2 items-center">
                    <Icon v-if="project.type == IntegrationProvider.GITHUB" icon="bi:github"></Icon>
                    <Icon
                        v-else-if="project.type == IntegrationProvider.GITLAB"
                        icon="bi:gitlab"
                    ></Icon>
                    <Icon v-else icon="material-symbols:drive-folder-upload-outline"></Icon>
                    <span class="text-gray-500">{{ project.name }}</span>
                </div>
            </template>
            <template #description>
                <div class="flex flex-row items-center gap-4">
                    <div v-if="project.integration_id" class="flex flex-row items-center gap-2">
                        <span>Branch:</span>
                        <Badge>{{ analysis.branch }}</Badge>
                    </div>
                    <div class="flex flex-row items-center gap-2">
                        <span>Workspace:</span>
                        <Badge>default</Badge>
                    </div>
                </div>
            </template>
        </TitleAndSubtitle>

        <template
            v-if="(bill_of_materials == null || bill_of_materials.length == 0) && !is_loading"
        >
            <div style="margin-bottom: 100px">
                <InfoBoxBlue>
                    <template #content>
                        <div class="title">
                            <i class="fa-solid fa-circle-info"></i>
                            No dependencies in your project
                        </div>
                        <div class="content">
                            <div class="error-box">
                                We did not find any dependencies in your project. This could be a
                                failure of our analyzer or it could be because the project does not
                                have the required files.<br /><br />

                                A project needs to contain the following files:
                                <ul>
                                    <li>
                                        a package manifest:
                                        <a
                                            href="https://docs.npmjs.com/cli/v9/configuring-npm/package-json"
                                            target="_blank"
                                            style="color: var(--accent)"
                                            >package.json
                                            <i class="fa-solid fa-arrow-up-right-from-square"></i
                                        ></a>
                                    </li>
                                    <li>
                                        <div
                                            style="
                                                display: flex;
                                                flex-direction: row;
                                                align-items: center;
                                                column-gap: 5px;
                                            "
                                        >
                                            a lockfile:
                                            <i
                                                class="fa-brands fa-yarn"
                                                style="color: lightblue; width: 25px; height: 25px"
                                            >
                                            </i>
                                            <a
                                                href="https://classic.yarnpkg.com/lang/en/docs/yarn-lock/"
                                                target="_blank"
                                                style="color: var(--accent)"
                                                >yarn.lock
                                                <i
                                                    class="fa-solid fa-arrow-up-right-from-square"
                                                    style="font-size: 0.7em"
                                                ></i
                                            ></a>
                                            or
                                            <i
                                                class="fa-brands fa-npm"
                                                style="color: red; width: 25px; height: 25px"
                                            ></i>
                                            <a
                                                href="https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json"
                                                target="_blank"
                                                style="color: var(--accent)"
                                                >package-lock.json
                                                <i
                                                    class="fa-solid fa-arrow-up-right-from-square"
                                                    style="font-size: 0.7em"
                                                ></i
                                            ></a>
                                        </div>
                                    </li>
                                </ul>

                                these two files need to be located at the same level in the file
                                tree of your project.<br /><br />

                                In case your project has the required files, but stills fails to be
                                analyzed, then please accept our apologies for the inconvenience.
                                Since our product is still in the beta phase, you can help us iron
                                out the issues by contacting us under:
                                <a href="mailto:help@codeclarity.io" style="color: var(--accent)"
                                    >help@codeclarity.io</a
                                >
                            </div>
                        </div>
                    </template>
                </InfoBoxBlue>
            </div>
        </template>

        <SbomContent :analysisID="analysis.id" :projectID="project.id"></SbomContent>
    </div>
</template>

<script lang="ts" setup>
import { onUpdated, ref, watch } from 'vue';
import type { Ref } from 'vue';
import SbomContent from '@/views/results/sbom/SbomContent.vue';
import { Icon } from '@iconify/vue';
import { IntegrationProvider } from '@/repositories/types/entities/Integrations';

// Import stores
import { Project } from '@/repositories/types/entities/Project';
import { Analysis } from '@/repositories/types/entities/Analysis';
import TitleAndSubtitle from '@/common_components/headers/TitleAndSubtitle.vue';
import InfoBoxBlue from '@/common_components/info_box/InfoBoxBlue.vue';
import { Badge } from '@/shadcn/ui/badge';

defineProps<{
    analysis: Analysis;
    project: Project;
}>();

const bill_of_materials = ref([]);
const details = ref(false);
let y_position = 0;
let reference_click_element: Ref<string> = ref('');
const is_loading = ref(true);
const only_details = ref(false);

// DATA FOR THE FILTER COMPONENT
const activeTab = ref('SBOM');

onUpdated(() => {
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        mainContainer.scrollTop = 0;
    }
    setTimeout(() => {
        if (y_position != 0 && details.value == false)
            if (mainContainer) {
                mainContainer.scrollTop = y_position;
            }
    }, 50);
});

watch(activeTab, async (newTab, oldTab) => {
    if (newTab != oldTab) {
        y_position = 0;
        reference_click_element.value = '';
    }
});
</script>
