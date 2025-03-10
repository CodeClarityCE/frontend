<template>
    <div class="w-full flex flex-col gap-14">
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

        <InfoBoxBlue v-if="no_deps">
            <template #content>
                <div class="title">
                    <i class="fa-solid fa-circle-info"></i>
                    No dependencies in your project
                </div>
                <div class="content">
                    <div class="error-box">
                        We did not find any dependencies in your project. This could be a failure of
                        our analyzer or it could be because the project does not have the required
                        files.<br /><br />

                        A project needs to contain the following files:
                        <ul>
                            <li>
                                a package manifest:
                                <a
                                    href="https://docs.npmjs.com/cli/v9/configuring-npm/package-json"
                                    target="_blank"
                                    style="color: var(--accent)"
                                    >package.json
                                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                </a>
                            </li>
                            <li>
                                <div class="flex items-center gap-1">
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
                                        >
                                        </i>
                                    </a>
                                    or
                                    <i
                                        class="fa-brands fa-npm"
                                        style="color: red; width: 25px; height: 25px"
                                    >
                                    </i>
                                    <a
                                        href="https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json"
                                        target="_blank"
                                        style="color: var(--accent)"
                                    >
                                        package-lock.json
                                        <i
                                            class="fa-solid fa-arrow-up-right-from-square"
                                            style="font-size: 0.7em"
                                        >
                                        </i>
                                    </a>
                                </div>
                            </li>
                        </ul>

                        these two files need to be located at the same level in the file tree of
                        your project.<br /><br />

                        In case your project has the required files, but stills fails to be
                        analyzed, then please accept our apologies for the inconvenience. Since our
                        product is still in the beta phase, you can help us iron out the issues by
                        contacting us under:
                        <a href="mailto:help@codeclarity.io" style="color: var(--accent)"
                            >help@codeclarity.io</a
                        >
                    </div>
                </div>
            </template>
        </InfoBoxBlue>

        <div class="flex flex-col gap-8">
            <Card>
                <CardHeader
                    class="flex flex-row items-center justify-between space-y-0 pb-2"
                ></CardHeader>
                <CardContent>
                    <Licenses
                        ref="licenses_ref"
                        :analysisID="analysis.id"
                        :projectID="project.id"
                    />
                </CardContent>
            </Card>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Card, CardContent, CardHeader } from '@/shadcn/ui/card';
import Licenses from './LicensesComponent.vue';
// Import stores
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { Icon } from '@iconify/vue';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import TitleAndSubtitle from '@/base_components/headers/TitleAndSubtitle.vue';
import InfoBoxBlue from '@/base_components/info_box/InfoBoxBlue.vue';
import { Badge } from '@/shadcn/ui/badge';

defineProps<{
    analysis: Analysis;
    project: Project;
}>();

let no_deps = false;
const licenses_ref = ref(null);
</script>
