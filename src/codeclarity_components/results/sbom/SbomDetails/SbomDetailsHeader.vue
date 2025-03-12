<script lang="ts" setup>
import BubbleComponent from '@/base_components/bubbles/BubbleComponent.vue';
import TitleAndSubtitle from '@/base_components/headers/TitleAndSubtitle.vue';
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { Icon } from '@iconify/vue/dist/iconify.js';
import type { PropType } from 'vue';

defineProps({
    dependency: {
        type: Object as PropType<DependencyDetails>,
        required: true
    }
});
</script>


<template>
    <div class="flex flex-col gap-2">
        <TitleAndSubtitle>
            <template #title>{{ dependency.name }}</template>
            <template #subtitle>@{{ dependency.version }}</template>
        </TitleAndSubtitle>

        <div class="text-gray-600">
            <div v-if="!dependency.transitive">
                This is a direct dependency of the project.
            </div>
        </div>
        <!-- <div v-if="!dependency.is_self_managed" class="flex gap-6"> -->
        <div class="flex gap-6">
            <BubbleComponent>
                <template #content>
                    <a :href="`https://www.npmjs.com/package/${dependency.name}/v/${dependency.version}`"
                        target="_blank" class="flex flex-wrap gap-1 items-center"
                        title="opens the npm package page (in a new tab)">
                        <Icon :icon="'akar-icons:npm-fill'"></Icon> NPM
                    </a>
                </template>
            </BubbleComponent>
            <BubbleComponent>
                <template #content>
                    <a :href="`https://yarnpkg.com/package?name=${dependency.name}&version=${dependency.version}`"
                        target="_blank" class="flex flex-wrap gap-1 items-center"
                        title="opens the yarn package page (in a new tab)">
                        <Icon :icon="'akar-icons:yarn-fill'"></Icon> Yarn
                    </a>
                </template>
            </BubbleComponent>
            <BubbleComponent v-if="dependency.source">
                <template #content>
                    <a v-if="dependency.source.Type == 'git'" :href="`${dependency.source.Url.replace('git+', '')}`"
                        target="_blank" title="opens the github repo of the dependency (in a new tab)">
                        <div v-if="dependency.source.Url.includes('github')" class="flex flex-wrap gap-1 items-center">
                            <Icon :icon="'akar-icons:github-fill'"></Icon> Github
                        </div>
                        <div v-else-if="dependency.source.Url.includes('gitlab')"
                            class="flex flex-wrap gap-1 items-center">
                            <Icon :icon="'akar-icons:gitlab-fill'"></Icon> Gitlab
                        </div>
                    </a>
                </template>
            </BubbleComponent>
        </div>
    </div>
</template>
