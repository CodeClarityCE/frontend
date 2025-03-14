<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { Badge } from '@/shadcn/ui/badge';
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
            <div
                v-if="moment(dependency.release).toString() !== 'Mon Jan 01 0001 00:17:30 GMT+0017'"
            >
                Release date: {{ moment(dependency.release) }}
            </div>
            <div v-if="dependency.engines">
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
            <!-- <BubbleComponent :slim="true">
                <template #content>
                    {{ dependency.file_path }}
                </template>
</BubbleComponent> -->

            <div class="flex gap-2">
                <!-- <BubbleComponent v-if="dependency.vulnerable == true" :bad="true" :slim="true">
                    <template #content> Vulnerable </template>
                </BubbleComponent> -->

                <!-- <BubbleComponent v-if="dependency.deprecated == true" :bad="true" :slim="true">
                    <template #content> Deprecated </template>
                </BubbleComponent> -->

                <Badge v-if="dependency.license == ''" class="rounded-full">
                    Unlicensed
                </Badge>

                <!-- <BubbleComponent
                    v-if="dependency.outdated == true"
                    :partiallyPatchable="true"
                    :slim="true"
                >
                    <template #content> Outdated </template>
                </BubbleComponent> -->
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