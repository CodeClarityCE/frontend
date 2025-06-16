<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { Badge } from '@/shadcn/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import { Icon } from '@iconify/vue';
import moment from 'moment';
import type { PropType } from 'vue';

defineProps({
    dependency: {
        type: Object as PropType<DependencyDetails>,
        required: true
    }
});
</script>

<template>
    <div>
        <h2 class="font-black text-xl"><span class="text-primary text-3xl">I</span>nformation</h2>
        <div class="flex flex-col gap-2 pl-5 pt-5">
            <div v-if="dependency.package_manager == 'NPM'" class="flex gap-2 items-center">
                Integrated through:
                <a
                    :href="`https://www.npmjs.com/package/${dependency.name}/v/${dependency.version}`"
                    target="_blank"
                    class="flex gap-1 items-center"
                >
                    <Icon
                        :icon="'akar-icons:npm-fill'"
                        title="Dependency is integrated via npm."
                    ></Icon>
                    NPM
                </a>
            </div>
            <div v-if="dependency.package_manager == 'YARN'" class="flex gap-2 items-center">
                Integrated through:
                <a
                    :href="`https://yarnpkg.com/package?name=${dependency.name}&version=${dependency.version}`"
                    target="_blank"
                    class="flex gap-1 items-center"
                >
                    <Icon
                        :icon="'akar-icons:yarn-fill'"
                        title="Dependency is integrated via yarn."
                    ></Icon>
                    Yarn
                </a>
            </div>
            <div v-else-if="dependency.package_manager == 'SELF'" class="flex gap-2 items-center">
                Integrated through:
                <Icon :icon="'ion:document-outline'"></Icon>
                <span>
                    <span class="font-black">
                        {{ dependency.name }}
                    </span>
                    self-managed
                </span>
            </div>
            <div>Version: {{ dependency.version }}</div>
            <div
                v-if="
                    moment(dependency.release_date).toString() !==
                    'Mon Jan 01 0001 00:17:30 GMT+0017'
                "
            >
                Release date: {{ moment(dependency.release_date).format('LL') }}
            </div>
            <div class="pt-4">Latest version: {{ dependency.latest_version }}</div>
            <div
                v-if="
                    moment(dependency.lastest_release_date).toString() !==
                    'Mon Jan 01 0001 00:17:30 GMT+0017'
                "
            >
                Latest release date: {{ moment(dependency.lastest_release_date).format('LL') }}
            </div>
            <div v-if="dependency.engines" class="pt-4">
                Engines supported:
                <div v-for="(value, key) in dependency.engines" :key="key">
                    <div class="flex items-center gap-2 pl-4">
                        •
                        <Icon
                            v-if="dependency.engines.hasOwnProperty('node')"
                            class="min-w-4"
                            :icon="'akar-icons:node-fill'"
                        ></Icon>
                        {{ value }}
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <Badge v-if="dependency.license == ''" class="rounded-full"> Unlicensed </Badge>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge
                                v-if="
                                    moment(dependency.lastest_release_date).diff(
                                        moment(dependency.release_date),
                                        'days'
                                    ) > 182
                                "
                                class="rounded-full"
                            >
                                Outdated
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            There is a difference of
                            {{
                                moment(dependency.lastest_release_date).diff(
                                    moment(dependency.release_date),
                                    'days'
                                )
                            }}
                            days compared to the latest release
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div v-if="dependency.license != ''" class="flex items-center gap-1">
                <div>Licenses:</div>
                <Badge variant="secondary" class="rounded-full">
                    {{ dependency.license }}
                </Badge>
            </div>
        </div>
    </div>
</template>
