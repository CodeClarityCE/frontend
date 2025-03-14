<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { Badge } from '@/shadcn/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shadcn/ui/tooltip';
import { Icon } from '@iconify/vue/dist/iconify.js';
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
                <a :href="`https://www.npmjs.com/package/${dependency.name}/v/${dependency.version}`" target="_blank"
                    class="flex gap-1 items-center">
                    <Icon :icon="'akar-icons:npm-fill'" title="Dependency is integrated via npm."></Icon>
                    NPM
                </a>
            </div>
            <div v-if="dependency.package_manager == 'YARN'" class="flex gap-2 items-center">
                Integrated through:
                <a :href="`https://yarnpkg.com/package?name=${dependency.name}&version=${dependency.version}`"
                    target="_blank" class="flex gap-1 items-center">
                    <Icon :icon="'akar-icons:yarn-fill'" title="Dependency is integrated via yarn."></Icon>
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
            <div v-if="moment(dependency.release).toString() !== 'Mon Jan 01 0001 00:17:30 GMT+0017'">
                Release date: {{ moment(dependency.release) }}
            </div>
            <div class="pt-4">Latest version: {{ dependency.newest_release }}</div>
            <div v-if="moment(dependency.release).toString() !== 'Mon Jan 01 0001 00:17:30 GMT+0017'">
                Latest release date: {{ moment(dependency.lastes_release) }}
            </div>
            <div class="pt-4" v-if="dependency.engines">
                Engines supported:
                <div v-for="(value, key) in dependency.engines" :key="key">
                    <div class="flex items-center gap-2 pl-4">
                        •
                        <Icon class="min-w-4" v-if="dependency.engines.hasOwnProperty('node')"
                            :icon="'akar-icons:node-fill'"></Icon>
                        {{ value }}
                    </div>
                </div>
            </div>

            <div class="flex gap-2">
                <Badge v-if="dependency.license == ''" class="rounded-full">
                    Unlicensed
                </Badge>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge class="rounded-full"
                                v-if="moment(dependency.lastes_release).diff(moment(dependency.release), 'days') > 182">
                                Outdated
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            There is a difference of {{
                                moment(dependency.lastes_release).diff(moment(dependency.release), 'days') }} days compared
                            to the latest release
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div class="flex items-center gap-1" v-if="dependency.license != ''">
                <div>Licenses:</div>
                <Badge variant="secondary" class="rounded-full">
                    {{ dependency.license }}
                </Badge>
            </div>
        </div>
    </div>
</template>