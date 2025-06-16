<script lang="ts" setup>
import { Icon } from '@iconify/vue';

export interface Props {
    analyzerData?: any;
}

withDefaults(defineProps<Props>(), {
    analyzerData: null
});
</script>

<template>
    <div class="flex flex-row items-center text-sm">
        <div class="analyzer-outer-icon">
            <Icon :icon="'devicon:javascript'" class="text-5xl relative z-10"></Icon>
        </div>

        <div class="rounded pl-6 flex flex-col gap-1">
            <div class="text-2xl font-extrabold text-grayTitle">
                <span v-if="analyzerData.name == 'JS'">SCA Analyzer for Javascript</span>
                <span v-else>{{ analyzerData.name }}</span>
            </div>
            <div>
                <span>{{ analyzerData.description }}</span>
            </div>
        </div>
    </div>
</template>
