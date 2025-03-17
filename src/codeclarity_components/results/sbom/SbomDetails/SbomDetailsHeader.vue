<script lang="ts" setup>
import { DependencyDetails } from '@/codeclarity_components/results/sbom/SbomDetails/SbomDetails';
import { Badge } from '@/shadcn/ui/badge';
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
        <div class="flex text-3xl">
            <div>{{ dependency.name }}</div>
            <div>@{{ dependency.version }}</div>
        </div>
        <div class="flex gap-6">
            <Badge variant="secondary" class="rounded-full">
                <a
                    :href="`https://www.npmjs.com/package/${dependency.name}/v/${dependency.version}`"
                    target="_blank"
                    class="flex flex-wrap gap-1 items-center"
                    title="opens the npm package page (in a new tab)"
                >
                    <Icon :icon="'akar-icons:npm-fill'"></Icon> NPM
                </a>
            </Badge>
            <Badge variant="secondary" class="rounded-full">
                <a
                    :href="`https://yarnpkg.com/package?name=${dependency.name}&version=${dependency.version}`"
                    target="_blank"
                    class="flex flex-wrap gap-1 items-center"
                    title="opens the yarn package page (in a new tab)"
                >
                    <Icon :icon="'akar-icons:yarn-fill'"></Icon> Yarn
                </a>
            </Badge>
            <Badge v-if="dependency.source" variant="secondary" class="rounded-full">
                <a
                    v-if="dependency.source.Type == 'git'"
                    :href="`${dependency.source.Url.replace('git+', '')}`"
                    target="_blank"
                    title="opens the github repo of the dependency (in a new tab)"
                >
                    <div
                        v-if="dependency.source.Url.includes('github')"
                        class="flex flex-wrap gap-1 items-center"
                    >
                        <Icon :icon="'akar-icons:github-fill'"></Icon> Github
                    </div>
                    <div
                        v-else-if="dependency.source.Url.includes('gitlab')"
                        class="flex flex-wrap gap-1 items-center"
                    >
                        <Icon :icon="'akar-icons:gitlab-fill'"></Icon> Gitlab
                    </div>
                </a>
            </Badge>
        </div>
    </div>
</template>
