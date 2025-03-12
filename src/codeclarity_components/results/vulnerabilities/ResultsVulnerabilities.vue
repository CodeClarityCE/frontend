<script lang="ts" setup>
import { onMounted, onUpdated, ref, watch } from 'vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shadcn/ui/tabs';
import { Card, CardContent, CardHeader } from '@/shadcn/ui/card';
import List from './VulnList.vue';
import Table from './VulnTable.vue';
import VulnContent from './VulnContent.vue';
// Import stores
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { Icon } from '@iconify/vue';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import TitleAndSubtitle from '@/base_components/headers/TitleAndSubtitle.vue';
import { Badge } from '@/shadcn/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shadcn/ui/alert';

defineProps<{
    analysis: Analysis;
    project: Project;
}>();

let no_deps = false;

const active_tab = ref('List');
const list_ref: any = ref(null);
const table_ref: any = ref(null);

// VIEW DATA
const details = ref(false);
let y_position = 0;
let reference_click_element = ref('');

onMounted(() => {
    let loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
});

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

watch(active_tab, async (newTab, oldTab) => {
    if (newTab != oldTab) {
        y_position = 0;
        reference_click_element.value = '';
    }
});
</script>

<template>
    <div v-show="!details" class="w-full flex flex-col gap-14" id="main-container">
        <TitleAndSubtitle class="pt-8">
            <template #title>
                <div class="flex flex-row gap-2 items-center">
                    <Icon v-if="project.type == IntegrationProvider.GITHUB" icon="bi:github"></Icon>
                    <Icon v-else-if="project.type == IntegrationProvider.GITLAB" icon="bi:gitlab"></Icon>
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

        <template v-if="no_deps">
            <div style="margin-bottom: 100px">
                <Alert>
                    <AlertTitle>No dependencies in your project</AlertTitle>
                    <AlertDescription>
                        We did not find any dependencies in your project. This could be a
                        failure of our analyzer or it could be because the project does not
                        have the required files.<br /><br />

                        A project needs to contain the following files:
                        <ul>
                            <li>
                                a package manifest:
                                <a href="https://docs.npmjs.com/cli/v9/configuring-npm/package-json" target="_blank"
                                    style="color: var(--accent)">package.json
                                    <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                            </li>
                            <li>
                                <div style="
                                                display: flex;
                                                flex-direction: row;
                                                align-items: center;
                                                column-gap: 5px;
                                            ">
                                    a lockfile:
                                    <i class="fa-brands fa-yarn"
                                        style="color: lightblue; width: 25px; height: 25px"></i>
                                    <a href="https://classic.yarnpkg.com/lang/en/docs/yarn-lock/" target="_blank"
                                        style="color: var(--accent)">yarn.lock
                                        <i class="fa-solid fa-arrow-up-right-from-square"
                                            style="font-size: 0.7em"></i></a>
                                    or
                                    <i class="fa-brands fa-npm" style="color: red; width: 25px; height: 25px"></i>
                                    <a href="https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json"
                                        target="_blank" style="color: var(--accent)">package-lock.json
                                        <i class="fa-solid fa-arrow-up-right-from-square"
                                            style="font-size: 0.7em"></i></a>
                                </div>
                            </li>
                        </ul>

                        these two files need to be located at the same level in the file
                        tree of your project.<br /><br />

                        In case your project has the required files, but stills fails to be
                        analyzed, then please accept our apologies for the inconvenience.
                        Since our product is still in the beta phase, you can help us iron
                        out the issues by contacting us under:
                        <a href="mailto:help@codeclarity.io" style="color: var(--accent)">help@codeclarity.io</a>
                    </AlertDescription>
                </Alert>
            </div>
        </template>

        <VulnContent :analysisID="analysis.id" :projectID="project.id"></VulnContent>
        <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            </CardHeader>
            <CardContent>
                <Tabs default-value="list" class="space-y-4">
                    <TabsList>
                        <TabsTrigger value="list"> List </TabsTrigger>
                        <TabsTrigger value="table"> Table </TabsTrigger>
                    </TabsList>
                    <TabsContent value="list" class="space-y-4">
                        <List ref="list_ref" :highlight-elem="reference_click_element" :page-limit="20"
                            :force-open-new-tab="false" :analysisID="analysis.id" :projectID="project.id" />
                    </TabsContent>
                    <TabsContent value="table" class="space-y-4">
                        <Table ref="table_ref" :highlight-elem="reference_click_element" :force-open-new-tab="false"
                            :analysisID="analysis.id" :projectID="project.id"></Table>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
</template>
