<script setup lang="ts">
import { Icon } from '@iconify/vue';
export interface LegendItem {
    label: string;
    color: string;
    count: number;
}

defineProps<{
    items: LegendItem[];
}>();
</script>

<template>
    <div class="flex flex-col gap-1">
        <div v-for="item in items" :key="item.label" class="flex items-center gap-2">
            <Icon :icon="'ph:circle-fill'" :style="{ color: item.color }" />
            <span class="text-sm">{{ item.label }}</span>
            <span class="ml-auto text-sm font-semibold" :style="{ color: item.color }">
                {{ item.count }}
            </span>
        </div>
    </div>
</template>
