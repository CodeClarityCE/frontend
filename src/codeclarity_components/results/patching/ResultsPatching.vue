<template>
    <div v-show="!details" class="flex flex-col gap-14">
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

        <PatchingContent :analysisID="analysis.id" :projectID="project.id"></PatchingContent>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';

// Import stores
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { Icon } from '@iconify/vue';
import { IntegrationProvider } from '@/codeclarity_components/organizations/integrations/Integrations';
import TitleAndSubtitle from '@/base_components/headers/TitleAndSubtitle.vue';
import { Badge } from '@/shadcn/ui/badge';
import PatchingContent from './patching/PatchingContent.vue';

defineProps<{
    analysis: Analysis;
    project: Project;
}>();

const details = ref(false);

onMounted(() => {
    let loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
});
</script>
