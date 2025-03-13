<script lang="ts" setup>
import { onMounted, ref } from 'vue';

// Import stores
import { Project } from '@/codeclarity_components/projects/project.entity';
import { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import PatchingContent from './PatchingContent.vue';

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

<template>
    <div v-show="!details" class="flex flex-col gap-14">
        <PatchingContent :analysisID="analysis.id" :projectID="project.id"></PatchingContent>
    </div>
</template>
