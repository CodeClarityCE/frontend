<script setup lang="ts">
import Collapsible from '@/shadcn/ui/collapsible/Collapsible.vue';
import CollapsibleContent from '@/shadcn/ui/collapsible/CollapsibleContent.vue';
import CollapsibleTrigger from '@/shadcn/ui/collapsible/CollapsibleTrigger.vue';
import { ref } from 'vue';
import AnalysisItem from './AnalysisItem.vue';
import type { Analysis } from '@/codeclarity_components/analyses/analysis.entity';
import { Icon } from '@iconify/vue';

const isOpen = ref(false);

defineProps({
    analyses: {
        type: Array<Analysis>,
        default: []
    },
    projectID: {
        type: String,
        default: ''
    }
});
</script>
<template>
    <Collapsible v-model:open="isOpen" class="flex flex-col gap-4 items-center">
        <AnalysisItem
            v-for="analysis in analyses.slice(0, 1)"
            :key="analysis.id"
            :analysis="analysis"
            :project-i-d="projectID"
        ></AnalysisItem>
        <CollapsibleTrigger v-if="analyses.length > 1" class="flex gap-2 items-center"
            >Show older analyses <Icon icon="tabler:chevron-down"></Icon>
        </CollapsibleTrigger>
        <CollapsibleContent v-if="analyses.length > 1">
            <AnalysisItem
                v-for="analysis in analyses.slice(1, analyses.length)"
                :key="analysis.id"
                :analysis="analysis"
                :project-i-d="projectID"
            ></AnalysisItem>
        </CollapsibleContent>
    </Collapsible>
</template>
