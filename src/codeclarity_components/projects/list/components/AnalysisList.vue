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
    <Collapsible v-model:open="isOpen" class="w-full">
        <!-- Always show the most recent analysis -->
        <AnalysisItem
            v-for="analysis in analyses.slice(0, 1)"
            :key="analysis.id"
            :analysis="analysis"
            :project-i-d="projectID"
        />

        <!-- Show expand button if there are more analyses -->
        <div v-if="analyses.length > 1" class="mt-3">
            <CollapsibleTrigger
                class="flex items-center justify-center gap-2 w-full p-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200"
            >
                <span
                    >{{ isOpen ? 'Hide' : 'Show' }} {{ analyses.length - 1 }} older analysis{{
                        analyses.length - 1 > 1 ? 'es' : ''
                    }}</span
                >
                <Icon
                    icon="solar:chevron-down-linear"
                    class="h-3 w-3 transition-transform duration-200"
                    :class="{ 'rotate-180': isOpen }"
                />
            </CollapsibleTrigger>
        </div>

        <!-- Collapsible content for older analyses -->
        <CollapsibleContent v-if="analyses.length > 1" class="mt-3 space-y-3">
            <AnalysisItem
                v-for="analysis in analyses.slice(1)"
                :key="analysis.id"
                :analysis="analysis"
                :project-i-d="projectID"
            />
        </CollapsibleContent>
    </Collapsible>
</template>
