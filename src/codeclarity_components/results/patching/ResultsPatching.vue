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
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
});
</script>

<template>
    <div v-show="!details" class="flex flex-col gap-14">
        <PatchingContent :analysis-i-d="analysis.id" :project-i-d="project.id"></PatchingContent>
    </div>
</template>
